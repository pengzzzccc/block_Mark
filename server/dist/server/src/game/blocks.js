import { v4 as uuidv4 } from 'uuid';
/** Block color combos for ordinal blocks */
const ORDINAL_COLORS = ['red', 'yellow', 'blue', 'green'];
const ORDINAL_NUMBERS = [1, 2, 3, 4];
const ORDINAL_COUNT = 3; // 3 copies of each color+number combo
const PURPLE_COUNT = 4;
const BLACK_COUNT = 4;
const PURPLE_PRICE = 120;
const BLACK_PRICE = 80;
const ORDINAL_PRICE = 50;
const BLIND_DRAW_COST = 40;
const SWAP_SELL_PRICE = 40;
/** Total: 4 colors × 4 numbers × 3 copies + 4 purple + 4 black = 56 blocks */
const TOTAL_BLOCKS = ORDINAL_COLORS.length * ORDINAL_NUMBERS.length * ORDINAL_COUNT + PURPLE_COUNT + BLACK_COUNT; // 56
/**
 * Create shuffled block pool containing all 56 blocks.
 */
export function initBlockPool() {
    const blocks = [];
    // Ordinal blocks
    for (const color of ORDINAL_COLORS) {
        for (const number of ORDINAL_NUMBERS) {
            for (let i = 0; i < ORDINAL_COUNT; i++) {
                blocks.push({
                    id: uuidv4(),
                    category: 'ordinal',
                    color,
                    number,
                    basePrice: ORDINAL_PRICE,
                });
            }
        }
    }
    // Purple (wild) blocks
    for (let i = 0; i < PURPLE_COUNT; i++) {
        blocks.push({
            id: uuidv4(),
            category: 'purple',
            color: 'purple',
            number: null,
            basePrice: PURPLE_PRICE,
        });
    }
    // Black (defense) blocks
    for (let i = 0; i < BLACK_COUNT; i++) {
        blocks.push({
            id: uuidv4(),
            category: 'black',
            color: 'black',
            number: null,
            basePrice: BLACK_PRICE,
        });
    }
    return shuffleArray(blocks);
}
/**
 * Set up open market by drawing 4 blocks from blind pile.
 */
export function setupOpenMarket(blindPile) {
    const drawCount = Math.min(4, blindPile.length);
    const openMarket = blindPile.splice(0, drawCount);
    return { openMarket, blindPile };
}
/**
 * Replenish open market after a block is removed.
 */
export function replenishMarket(openMarket, blindPile) {
    while (openMarket.length < 4 && blindPile.length > 0) {
        const block = blindPile.shift();
        openMarket.push(block);
    }
    return { openMarket, blindPile };
}
/**
 * Draw from blind pile (costs $40).
 */
export function blindDraw(blindPile) {
    if (blindPile.length === 0)
        return null;
    const block = blindPile.shift();
    return { block, blindPile };
}
/**
 * Buy from open market — returns the block and updated arrays.
 */
export function buyFromMarket(openMarket, blindPile, blockId) {
    const index = openMarket.findIndex((b) => b.id === blockId);
    if (index === -1)
        return null;
    const block = openMarket.splice(index, 1)[0];
    const result = replenishMarket(openMarket, blindPile);
    return { block, openMarket: result.openMarket, blindPile: result.blindPile };
}
/**
 * Get cost of a block (open market) or blind draw.
 */
export function getBlockCost(block) {
    return block.basePrice;
}
export { BLIND_DRAW_COST, SWAP_SELL_PRICE };
/** Fisher-Yates shuffle */
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
