import type { Block, DuelState, PlayerState } from '@shared/types.js';
/**
 * Execute a full duel between attacker and defender for a target block.
 * Returns the resolved duel state with result.
 */
export declare function executeDuel(attacker: PlayerState, defender: PlayerState, targetBlock: Block, duelState: DuelState): DuelState;
/**
 * Apply duel result to game state — transfer block/cash based on outcome.
 * Returns updated attacker, defender, and cash transferred.
 */
export declare function applyDuelResult(attacker: PlayerState, defender: PlayerState, targetBlock: Block, duelState: DuelState): {
    attacker: PlayerState;
    defender: PlayerState;
    blockTransferred: Block;
    cashTransferred: number;
    winnerId: string;
};
/**
 * Calculate wager amount: 120% of block's base price, rounded up.
 */
export declare function calculateWager(block: Block): number;
