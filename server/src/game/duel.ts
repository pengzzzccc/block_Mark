import type { Block, DuelState, PlayerState } from '../../../shared/types.js';
import { rollForDuel } from './dice.js';

/**
 * Execute a full duel between attacker and defender for a target block.
 * Returns the resolved duel state with result.
 */
export function executeDuel(
    attacker: PlayerState,
    defender: PlayerState,
    targetBlock: Block,
    duelState: DuelState,
): DuelState {
    // Both players roll
    const attackRoll = rollForDuel();
    let attackerTotal = attackRoll.sum;
    const attackerDoubles = attackRoll.isDoubles;

    const defendRoll = rollForDuel();
    let defenderTotal = defendRoll.sum;
    const defenderDoubles = defendRoll.isDoubles;

    // Check if defender has a black block
    const hasBlackBlock = defender.hand.some((b) => b.category === 'black');
    let blackBlockHalved = false;

    if (hasBlackBlock) {
        attackerTotal = Math.floor(attackerTotal / 2);
        blackBlockHalved = true;
    }

    // Doubles rule: if either player rolled doubles, that player wins instantly
    // If both roll doubles, attacker wins (attacker priority, or could re-roll - we choose attacker)
    let winnerId: string;

    if (attackerDoubles && defenderDoubles) {
        // Both doubles → attacker wins (attacker advantage)
        winnerId = attacker.id;
    } else if (attackerDoubles) {
        winnerId = attacker.id;
    } else if (defenderDoubles) {
        winnerId = defender.id;
    } else {
        // Normal comparison
        winnerId = attackerTotal > defenderTotal ? attacker.id : defender.id;
    }

    return {
        ...duelState,
        phase: 'result',
        result: {
            attackerRoll: attackerTotal,
            defenderRoll: defenderTotal,
            attackerDoubles,
            defenderDoubles,
            blackBlockHalved,
            winnerId,
        },
    };
}

/**
 * Apply duel result to game state — transfer block/cash based on outcome.
 * Returns updated attacker, defender, and cash transferred.
 */
export function applyDuelResult(
    attacker: PlayerState,
    defender: PlayerState,
    targetBlock: Block,
    duelState: DuelState,
): {
    attacker: PlayerState;
    defender: PlayerState;
    blockTransferred: Block;
    cashTransferred: number;
    winnerId: string;
} {
    const wager = duelState.wagerAmount; // 120% of target block base price
    const result = duelState.result!;
    const winnerId = result.winnerId;

    // Remove target block from defender
    const blockIndex = defender.hand.findIndex((b) => b.id === targetBlock.id);
    const block = defender.hand.splice(blockIndex, 1)[0];

    if (winnerId === attacker.id) {
        // Attacker wins: gets the block, wager goes to bank (already deducted)
        attacker.hand.push(block);
        return {
            attacker: { ...attacker, hand: [...attacker.hand] },
            defender: { ...defender, hand: [...defender.hand] },
            blockTransferred: block,
            cashTransferred: 0,
            winnerId,
        };
    } else {
        // Defender wins: keeps block + gets the wager from bank
        defender.hand.push(block);
        defender.cash += wager;
        return {
            attacker: { ...attacker },
            defender: { ...defender, cash: defender.cash, hand: [...defender.hand] },
            blockTransferred: block,
            cashTransferred: wager,
            winnerId,
        };
    }
}

/**
 * Calculate wager amount: 120% of block's base price, rounded up.
 */
export function calculateWager(block: Block): number {
    return Math.ceil(block.basePrice * 1.2);
}