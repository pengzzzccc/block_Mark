import type { GameState, IncomeResult, BuySource, DuelState } from '@shared/types.js';
/**
 * Start a new turn: settlement phase — auto-roll dice and pay income.
 */
export declare function startTurn(game: GameState): {
    game: GameState;
    incomeResult: IncomeResult;
};
/**
 * Execute a BUY action.
 * source: 'openMarket' (buy specific block) or 'blindDraw' ($40 random)
 */
export declare function executeBuy(game: GameState, playerId: string, buyData: {
    blockId: string;
    source: BuySource;
}): {
    game: GameState;
    success: boolean;
    message: string;
};
/**
 * Execute a SWAP action: sell one block for $40, pay difference if buying a more expensive block.
 */
export declare function executeSwap(game: GameState, playerId: string, swapData: {
    sellBlockId: string;
    buyBlockId: string;
}): {
    game: GameState;
    success: boolean;
    message: string;
};
/**
 * Initiate a negotiation offer.
 */
export declare function initiateNegotiation(game: GameState, fromPlayerId: string, data: {
    targetPlayerId: string;
    offeredBlockId: string | null;
    requestedBlockId: string | null;
    cashOffered: number;
    cashRequested: number;
}): {
    game: GameState;
    success: boolean;
    message: string;
};
/**
 * Handle negotiation reply (accept/reject).
 */
export declare function handleNegotiationReply(game: GameState, playerId: string, accept: boolean): {
    game: GameState;
    success: boolean;
    message: string;
};
/**
 * Initiate a forced trade (duel).
 */
export declare function initiateForcedTrade(game: GameState, playerId: string, data: {
    targetPlayerId: string;
    targetBlockId: string;
}): {
    game: GameState;
    success: boolean;
    message: string;
};
/**
 * Roll for duel (process pending duel).
 */
export declare function rollDuelAction(game: GameState): {
    game: GameState;
    result: DuelState;
} | null;
/**
 * Resolve duel outcome — transfer block/cash.
 */
export declare function resolveDuel(game: GameState): {
    game: GameState;
    success: boolean;
    message: string;
};
/**
 * Advance to the next player's turn.
 * Skips disconnected players.
 */
export declare function advanceToNextPlayer(game: GameState): GameState;
