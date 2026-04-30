import type { Block } from '@shared/types.js';
declare const BLIND_DRAW_COST = 40;
declare const SWAP_SELL_PRICE = 40;
/**
 * Create shuffled block pool containing all 56 blocks.
 */
export declare function initBlockPool(): Block[];
/**
 * Set up open market by drawing 4 blocks from blind pile.
 */
export declare function setupOpenMarket(blindPile: Block[]): {
    openMarket: Block[];
    blindPile: Block[];
};
/**
 * Replenish open market after a block is removed.
 */
export declare function replenishMarket(openMarket: Block[], blindPile: Block[]): {
    openMarket: Block[];
    blindPile: Block[];
};
/**
 * Draw from blind pile (costs $40).
 */
export declare function blindDraw(blindPile: Block[]): {
    block: Block;
    blindPile: Block[];
} | null;
/**
 * Buy from open market — returns the block and updated arrays.
 */
export declare function buyFromMarket(openMarket: Block[], blindPile: Block[], blockId: string): {
    block: Block;
    openMarket: Block[];
    blindPile: Block[];
} | null;
/**
 * Get cost of a block (open market) or blind draw.
 */
export declare function getBlockCost(block: Block): number;
export { BLIND_DRAW_COST, SWAP_SELL_PRICE };
