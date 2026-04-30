import type {
    GameState,
    PlayerState,
    Block,
    IncomeResult,
    BuySource,
    DuelState,
    NegotiationOffer,
} from '../../../shared/types.js';
import { rollForIncome } from './dice.js';
import { buyFromMarket, blindDraw, BLIND_DRAW_COST, SWAP_SELL_PRICE } from './blocks.js';
import { checkWinCondition } from './winCheck.js';
import { calculateWager, executeDuel, applyDuelResult } from './duel.js';

// ---------------------------------------------------------------
// Turn Engine — orchestrates game phases and player actions
// ---------------------------------------------------------------

/**
 * Start a new turn: settlement phase — auto-roll dice and pay income.
 */
export function startTurn(game: GameState): { game: GameState; incomeResult: IncomeResult } {
    const incomeResult = rollForIncome();
    const player = { ...game.players[game.currentPlayerIndex] };

    player.cash += incomeResult.income;

    const updatedPlayers = [...game.players];
    updatedPlayers[game.currentPlayerIndex] = player;

    const updated: GameState = {
        ...game,
        players: updatedPlayers,
        phase: 'action',
        diceResult: incomeResult,
        currentAction: null,
        duelState: null,
        negotiation: null,
    };

    return { game: updated, incomeResult };
}

/**
 * Execute a BUY action.
 * source: 'openMarket' (buy specific block) or 'blindDraw' ($40 random)
 */
export function executeBuy(
    game: GameState,
    playerId: string,
    buyData: { blockId: string; source: BuySource },
): { game: GameState; success: boolean; message: string } {
    const playerIndex = game.players.findIndex((p) => p.id === playerId);
    if (playerIndex !== game.currentPlayerIndex) {
        return { game, success: false, message: '不是你的回合' };
    }

    const player = { ...game.players[playerIndex] };
    let block: Block;
    let cost: number;

    // Determine block and cost based on source
    if (buyData.source === 'blindDraw') {
        const drawResult = blindDraw([...game.blindPile]);
        if (!drawResult) {
            return { game, success: false, message: '盲抽堆已空' };
        }
        block = drawResult.block;
        cost = BLIND_DRAW_COST;
    } else {
        const blockInMarket = game.openMarket.find((b) => b.id === buyData.blockId);
        if (!blockInMarket) {
            return { game, success: false, message: '该方块不在公开市场' };
        }
        cost = blockInMarket.basePrice;
        // block will be assigned via buyFromMarket below
    }

    if (player.cash < cost) {
        return { game, success: false, message: `资金不足，需要 $${cost}，当前 $${player.cash}` };
    }

    player.cash -= cost;

    let openMarket = [...game.openMarket];
    let blindPile = [...game.blindPile];

    if (buyData.source === 'blindDraw') {
        const drawResult = blindDraw(blindPile);
        if (!drawResult) {
            return { game, success: false, message: '盲抽失败' };
        }
        block = drawResult.block;
        blindPile = drawResult.blindPile;
    } else {
        const marketResult = buyFromMarket(openMarket, blindPile, buyData.blockId);
        if (!marketResult) {
            return { game, success: false, message: '购买失败' };
        }
        block = marketResult.block;
        openMarket = marketResult.openMarket;
        blindPile = marketResult.blindPile;
    }

    player.hand = [...player.hand, block];

    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = player;

    const updated: GameState = {
        ...game,
        players: updatedPlayers,
        openMarket,
        blindPile,
        phase: 'action',
    };

    // Check win condition
    const winResult = checkWinCondition(player.hand);
    if (winResult.isWin) {
        updated.phase = 'finished';
        updated.winnerId = playerId;
    }

    return { game: updated, success: true, message: `购买了方块 $${cost}` };
}

/**
 * Execute a SWAP action: sell one block for $40, pay difference if buying a more expensive block.
 */
export function executeSwap(
    game: GameState,
    playerId: string,
    swapData: { sellBlockId: string; buyBlockId: string },
): { game: GameState; success: boolean; message: string } {
    const playerIndex = game.players.findIndex((p) => p.id === playerId);
    if (playerIndex !== game.currentPlayerIndex) {
        return { game, success: false, message: '不是你的回合' };
    }

    const player = { ...game.players[playerIndex] };

    // Find sell block in hand
    const sellIndex = player.hand.findIndex((b) => b.id === swapData.sellBlockId);
    if (sellIndex === -1) {
        return { game, success: false, message: '手牌中没有该方块' };
    }

    // Find buy block in open market
    const buyBlock = game.openMarket.find((b) => b.id === swapData.buyBlockId);
    if (!buyBlock) {
        return { game, success: false, message: '该方块不在公开市场' };
    }

    const buyCost = buyBlock.basePrice;
    const sellValue = SWAP_SELL_PRICE;
    const netCost = buyCost - sellValue;

    if (player.cash < netCost) {
        return { game, success: false, message: `资金不足，还需 $${netCost}，当前 $${player.cash}` };
    }

    // Remove sell block
    const soldBlock = player.hand.splice(sellIndex, 1)[0];
    player.cash += sellValue;
    player.cash -= buyCost;

    // Remove buy block from market and replenish
    const marketResult = buyFromMarket(game.openMarket, game.blindPile, buyBlock.id);
    if (!marketResult) {
        return { game, success: false, message: '交换失败' };
    }

    player.hand.push(marketResult.block);
    player.hand = [...player.hand]; // immutable update

    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = player;

    const updated: GameState = {
        ...game,
        players: updatedPlayers,
        openMarket: marketResult.openMarket,
        blindPile: marketResult.blindPile,
        discardPile: [...game.discardPile, soldBlock],
        phase: 'action',
    };

    // Check win
    const winResult = checkWinCondition(player.hand);
    if (winResult.isWin) {
        updated.phase = 'finished';
        updated.winnerId = playerId;
    }

    return { game: updated, success: true, message: '交换成功' };
}

/**
 * Initiate a negotiation offer.
 */
export function initiateNegotiation(
    game: GameState,
    fromPlayerId: string,
    data: {
        targetPlayerId: string;
        offeredBlockId: string | null;
        requestedBlockId: string | null;
        cashOffered: number;
        cashRequested: number;
    },
): { game: GameState; success: boolean; message: string } {
    const fromIndex = game.players.findIndex((p) => p.id === fromPlayerId);
    if (fromIndex !== game.currentPlayerIndex) {
        return { game, success: false, message: '不是你的回合' };
    }

    const offer: NegotiationOffer = {
        fromPlayerId,
        toPlayerId: data.targetPlayerId,
        offeredBlock: data.offeredBlockId
            ? game.players[fromIndex].hand.find((b) => b.id === data.offeredBlockId) || null
            : null,
        requestedBlock: data.requestedBlockId
            ? game.players.find((p) => p.id === data.targetPlayerId)?.hand.find((b) => b.id === data.requestedBlockId) || null
            : null,
        cashOffered: data.cashOffered,
        cashRequested: data.cashRequested,
        status: 'pending',
        expiresAt: Date.now() + 30000, // 30 seconds
    };

    return {
        game: { ...game, negotiation: offer, phase: 'negotiation' },
        success: true,
        message: '协商请求已发送',
    };
}

/**
 * Handle negotiation reply (accept/reject).
 */
export function handleNegotiationReply(
    game: GameState,
    playerId: string,
    accept: boolean,
): { game: GameState; success: boolean; message: string } {
    if (!game.negotiation) {
        return { game, success: false, message: '没有待处理的协商' };
    }

    if (game.negotiation.toPlayerId !== playerId) {
        return { game, success: false, message: '不是给你的协商请求' };
    }

    if (!accept) {
        return {
            game: { ...game, negotiation: null, phase: 'action' },
            success: true,
            message: '协商被拒绝',
        };
    }

    // Execute the trade
    const fromPlayer = { ...game.players.find((p) => p.id === game.negotiation!.fromPlayerId)! };
    const toPlayer = { ...game.players.find((p) => p.id === game.negotiation!.toPlayerId)! };

    const offer = game.negotiation;

    // Transfer blocks
    if (offer.offeredBlock) {
        toPlayer.hand = [...toPlayer.hand, offer.offeredBlock];
        fromPlayer.hand = fromPlayer.hand.filter((b) => b.id !== offer.offeredBlock!.id);
    }
    if (offer.requestedBlock) {
        fromPlayer.hand = [...fromPlayer.hand, offer.requestedBlock];
        toPlayer.hand = toPlayer.hand.filter((b) => b.id !== offer.requestedBlock!.id);
    }

    // Transfer cash
    fromPlayer.cash += offer.cashRequested - offer.cashOffered;
    toPlayer.cash += offer.cashOffered - offer.cashRequested;

    const updatedPlayers = game.players.map((p) => {
        if (p.id === fromPlayer.id) return fromPlayer;
        if (p.id === toPlayer.id) return toPlayer;
        return p;
    });

    const updated: GameState = {
        ...game,
        players: updatedPlayers,
        negotiation: null,
        phase: 'action',
    };

    // Check win for both players
    const fromWin = checkWinCondition(fromPlayer.hand);
    if (fromWin.isWin) {
        updated.phase = 'finished';
        updated.winnerId = fromPlayer.id;
    }
    const toWin = checkWinCondition(toPlayer.hand);
    if (toWin.isWin && !updated.winnerId) {
        updated.phase = 'finished';
        updated.winnerId = toPlayer.id;
    }

    return { game: updated, success: true, message: '协商成功' };
}

/**
 * Initiate a forced trade (duel).
 */
export function initiateForcedTrade(
    game: GameState,
    playerId: string,
    data: { targetPlayerId: string; targetBlockId: string },
): { game: GameState; success: boolean; message: string } {
    const playerIndex = game.players.findIndex((p) => p.id === playerId);
    if (playerIndex !== game.currentPlayerIndex) {
        return { game, success: false, message: '不是你的回合' };
    }

    const targetPlayer = game.players.find((p) => p.id === data.targetPlayerId);
    if (!targetPlayer) {
        return { game, success: false, message: '目标玩家不存在' };
    }

    const targetBlock = targetPlayer.hand.find((b) => b.id === data.targetBlockId);
    if (!targetBlock) {
        return { game, success: false, message: '目标方块不存在' };
    }

    const wager = calculateWager(targetBlock);
    const player = game.players[playerIndex];

    if (player.cash < wager) {
        return { game, success: false, message: `资金不足，需要 $${wager}，当前 $${player.cash}` };
    }

    // Deduct wager immediately
    const updatedPlayer = { ...player, cash: player.cash - wager };
    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = updatedPlayer;

    const duelState: DuelState = {
        attackerId: playerId,
        defenderId: data.targetPlayerId,
        targetBlockId: data.targetBlockId,
        wagerAmount: wager,
        phase: 'rolling',
    };

    return {
        game: { ...game, players: updatedPlayers, duelState, phase: 'duel' },
        success: true,
        message: '对决开始',
    };
}

/**
 * Roll for duel (process pending duel).
 */
export function rollDuelAction(
    game: GameState,
): { game: GameState; result: DuelState } | null {
    if (!game.duelState || game.duelState.phase !== 'rolling') return null;

    const attacker = { ...game.players.find((p) => p.id === game.duelState!.attackerId)! };
    const defender = { ...game.players.find((p) => p.id === game.duelState!.defenderId)! };
    const targetBlock = defender.hand.find((b) => b.id === game.duelState!.targetBlockId)!;

    const duelResult = executeDuel(attacker, defender, targetBlock, game.duelState);

    return {
        game: { ...game, duelState: duelResult },
        result: duelResult,
    };
}

/**
 * Resolve duel outcome — transfer block/cash.
 */
export function resolveDuel(game: GameState): { game: GameState; success: boolean; message: string } {
    if (!game.duelState || game.duelState.phase !== 'result') {
        return { game, success: false, message: '对决尚未完成' };
    }

    const attackerIndex = game.players.findIndex((p) => p.id === game.duelState!.attackerId);
    const defenderIndex = game.players.findIndex((p) => p.id === game.duelState!.defenderId);

    let attacker = { ...game.players[attackerIndex] };
    let defender = { ...game.players[defenderIndex] };
    const targetBlock = defender.hand.find((b) => b.id === game.duelState!.targetBlockId)!;

    const applied = applyDuelResult(attacker, defender, targetBlock, game.duelState);

    const updatedPlayers = [...game.players];
    updatedPlayers[attackerIndex] = applied.attacker;
    updatedPlayers[defenderIndex] = applied.defender;

    const updated: GameState = {
        ...game,
        players: updatedPlayers,
        duelState: null,
        phase: 'action',
    };

    // Check win
    const attackerWin = checkWinCondition(applied.attacker.hand);
    if (attackerWin.isWin) {
        updated.phase = 'finished';
        updated.winnerId = applied.attacker.id;
    }

    return { game: updated, success: true, message: `对决结束，${applied.winnerId === attacker.id ? '攻击方' : '防御方'}获胜` };
}

/**
 * Advance to the next player's turn.
 * Skips disconnected players.
 */
export function advanceToNextPlayer(game: GameState): GameState {
    const numPlayers = game.players.length;
    let nextIndex = (game.currentPlayerIndex + 1) % numPlayers;
    let attempts = 0;

    // Skip disconnected players
    while (attempts < numPlayers) {
        if (game.players[nextIndex].connected) {
            break;
        }
        nextIndex = (nextIndex + 1) % numPlayers;
        attempts++;
    }

    // If all disconnected, stay on current
    if (attempts >= numPlayers) {
        return game;
    }

    return {
        ...game,
        currentPlayerIndex: nextIndex,
        currentTurn: nextIndex === 0 ? game.currentTurn + 1 : game.currentTurn,
        phase: 'settlement',
        currentAction: null,
        duelState: null,
        negotiation: null,
        diceResult: null,
    };
}