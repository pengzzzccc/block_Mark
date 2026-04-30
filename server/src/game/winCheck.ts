import type { Block, BlockColor, OrdinalNumber, WinResult, DetectedSet, DetectedPair } from '../../shared/types.js';

// ---------------------------------------------------------------
// Victory Check — Mahjong-style hand evaluation (recursive)
//
// Win condition: 8 blocks = 2 Sets + 1 Pair
// Set types:
//   - Sequence: 3 blocks same color, consecutive numbers (e.g., R1,R2,R3)
//   - Triplet: 3 blocks same color, same number (e.g., B4,B4,B4)
//   - Rainbow: 4 blocks same number, all different colors = 2 Sets
// Pair: 2 blocks same color, same number
// Purple blocks: wild — can substitute for any color/number
// ---------------------------------------------------------------

const ALL_COLORS: BlockColor[] = ['red', 'yellow', 'blue', 'green'];
const ALL_NUMBERS: OrdinalNumber[] = [1, 2, 3, 4];

/** Key for grouping: "color:number" or "purple" or "black" */
function blockKey(b: Block): string {
    if (b.category === 'purple') return 'purple';
    if (b.category === 'black') return 'black';
    return `${b.color}:${b.number}`;
}

/**
 * Check if a hand of 8 blocks forms a winning combination.
 */
export function checkWinCondition(hand: Block[]): WinResult {
    if (hand.length !== 8) {
        return { isWin: false, sets: [], pair: null };
    }

    // Use recursive backtracking
    const result = searchWinningCombination([...hand]);
    if (result) return result;
    return { isWin: false, sets: [], pair: null };
}

/**
 * Recursive backtracking search for 2 Sets + 1 Pair.
 * Strategy: try all possible pairs first, then for remaining 6 blocks, try to form 2 sets.
 */
function searchWinningCombination(blocks: Block[]): WinResult | null {
    const wilds = blocks.filter((b) => b.category === 'purple');
    const nonWilds = blocks.filter((b) => b.category !== 'purple');

    // Try each possible pair
    const possiblePairs = generateAllPossiblePairs(nonWilds, wilds.length);

    for (const pair of possiblePairs) {
        const remaining = removePairFromBlocks(nonWilds, wilds, pair);
        if (!remaining) continue;

        // Try to form 2 sets from remaining 6 blocks
        const setsResult = findTwoSets(remaining.nonWilds, remaining.wilds);
        if (setsResult) {
            return {
                isWin: true,
                sets: setsResult,
                pair: pairToDetectedPair(pair),
            };
        }
    }

    return null;
}

// ---------------------------------------------------------------
// Pair generation
// ---------------------------------------------------------------

interface PairCandidate {
    color: BlockColor;
    number: OrdinalNumber;
    count: number; // how many non-wild blocks used for this pair
}

function generateAllPossiblePairs(nonWilds: Block[], wildCount: number): PairCandidate[] {
    const pairs: PairCandidate[] = [];
    const seen = new Set<string>();

    // Natural pair: 2 blocks of same color+number
    const countMap = new Map<string, number>();
    for (const b of nonWilds) {
        if (b.category !== 'ordinal') continue;
        const key = blockKey(b);
        countMap.set(key, (countMap.get(key) || 0) + 1);
    }

    for (const [key, count] of countMap) {
        if (count >= 2) {
            const [color, numStr] = key.split(':') as [BlockColor, string];
            const number = parseInt(numStr) as OrdinalNumber;
            pairs.push({ color, number, count: 2 });
            seen.add(key);
        }
    }

    // 1 wild + 1 ordinal
    if (wildCount >= 1) {
        for (const b of nonWilds) {
            if (b.category !== 'ordinal') continue;
            const key = blockKey(b);
            if (seen.has(key)) continue; // already handled as natural pair
            pairs.push({ color: b.color, number: b.number!, count: 1 });
            seen.add(key);
        }
    }

    // 2 wilds (can be any color/number — will try during resolution)
    if (wildCount >= 2) {
        // Represent as a wild-only pair — resolved during set composition
        pairs.push({ color: 'red', number: 1, count: 0 }); // placeholder
    }

    return pairs;
}

function pairToDetectedPair(pair: PairCandidate): DetectedPair {
    // Build placeholder blocks for the pair
    const blocks: Block[] = [];
    for (let i = 0; i < 2; i++) {
        blocks.push({
            id: `pair-${i}`,
            category: 'ordinal',
            color: pair.color,
            number: pair.number,
            basePrice: 50,
        });
    }
    return { blocks: [blocks[0], blocks[1]] };
}

function removePairFromBlocks(
    nonWilds: Block[],
    wilds: Block[],
    pair: PairCandidate,
): { nonWilds: Block[]; wilds: Block[] } | null {
    const remainingNonWilds = [...nonWilds];
    let remainingWilds = [...wilds];

    let toRemoveNonWild = pair.count;
    let toRemoveWild = 2 - pair.count;

    if (toRemoveWild > remainingWilds.length) return null;

    // Remove non-wild blocks
    const removeOrder = [...remainingNonWilds];

    remainingNonWilds.length = 0;
    let removed = 0;
    for (const b of removeOrder) {
        if (removed < toRemoveNonWild && b.category === 'ordinal' && b.color === pair.color && b.number === pair.number) {
            removed++;
            continue;
        }
        remainingNonWilds.push(b);
    }

    if (removed < toRemoveNonWild) return null;

    // Remove wild blocks
    remainingWilds = remainingWilds.slice(toRemoveWild);

    return { nonWilds: remainingNonWilds, wilds: remainingWilds };
}

// ---------------------------------------------------------------
// Set finding: 2 sets from 6 blocks
// ---------------------------------------------------------------

function findTwoSets(nonWilds: Block[], wilds: Block[]): DetectedSet[] | null {
    const nonWildOrdinals = nonWilds.filter((b) => b.category === 'ordinal');

    // Try rainbow first (4 blocks, same number, different colors)
    const rainbowResult = tryRainbow(nonWildOrdinals, wilds);
    if (rainbowResult) {
        // Rainbow = 2 sets, consumes at most 4 non-wilds (or 3 non-wilds + 1 wild)
        return rainbowResult;
    }

    // Try forming first set, then check if remaining can form second set
    const possibleFirstSets = generateAllPossibleSets(nonWildOrdinals, wilds.length);

    for (const firstSet of possibleFirstSets) {
        const afterFirst = removeSetFromBlocks(nonWildOrdinals, wilds, firstSet);
        if (!afterFirst) continue;

        const secondSets = generateAllPossibleSets(afterFirst.nonWilds, afterFirst.wilds.length);
        for (const secondSet of secondSets) {
            const afterSecond = removeSetFromBlocks(afterFirst.nonWilds, afterFirst.wilds, secondSet);
            if (afterSecond && afterSecond.nonWilds.length + afterSecond.wilds.length === 0) {
                return [setCandidateToDetectedSet(firstSet), setCandidateToDetectedSet(secondSet)];
            }
        }
    }

    return null;
}

// ---------------------------------------------------------------
// Rainbow detection
// ---------------------------------------------------------------

function tryRainbow(nonWilds: Block[], wilds: Block[]): DetectedSet[] | null {
    // Rainbow: 4 blocks with SAME number, ALL DIFFERENT colors
    // Can use up to 1 wild block

    for (const number of ALL_NUMBERS) {
        const colored: Map<BlockColor, Block> = new Map();
        for (const b of nonWilds) {
            if (b.number === number && b.category === 'ordinal') {
                colored.set(b.color, b);
            }
        }

        const presentColors = [...colored.keys()];
        const missingColors = ALL_COLORS.filter((c) => !colored.has(c));

        if (missingColors.length === 0 && presentColors.length === 4) {
            // Perfect rainbow — 4 blocks, 4 colors, same number = 2 sets
            return [
                {
                    type: 'rainbow',
                    blocks: ALL_COLORS.map((c) => colored.get(c)!),
                },
            ];
        }

        if (missingColors.length === 1 && wilds.length >= 1) {
            // 3 non-wilds + 1 wild can complete rainbow
            return [
                {
                    type: 'rainbow',
                    blocks: [
                        ...presentColors.map((c) => colored.get(c)!),
                        { id: 'wild-rainbow', category: 'purple', color: 'purple', number: null, basePrice: 120 },
                    ],
                },
            ];
        }
    }

    return null;
}

// ---------------------------------------------------------------
// Set candidate generation
// ---------------------------------------------------------------

interface SetCandidate {
    type: 'sequence' | 'triplet';
    color: BlockColor;
    number: OrdinalNumber; // starting number for sequence, or the number for triplet
    nonWildCount: number; // how many non-wild blocks used
    wildCount: number; // how many wild blocks used
}

function generateAllPossibleSets(nonWildOrdinals: Block[], wildsAvailable: number): SetCandidate[] {
    const candidates: SetCandidate[] = [];

    // Count ordinal blocks by color+number
    const countMap = new Map<string, number>();
    for (const b of nonWildOrdinals) {
        const key = `${b.color}:${b.number}`;
        countMap.set(key, (countMap.get(key) || 0) + 1);
    }

    const hasBlock = (color: BlockColor, number: OrdinalNumber): number =>
        countMap.get(`${color}:${number}`) || 0;

    // Triplets: 3 same color/number
    for (const color of ALL_COLORS) {
        for (const number of ALL_NUMBERS) {
            const cnt = hasBlock(color, number);
            // Natural triplet
            if (cnt >= 3) {
                candidates.push({ type: 'triplet', color, number, nonWildCount: 3, wildCount: 0 });
            }
            // 2 non-wild + 1 wild
            if (cnt >= 2 && wildsAvailable >= 1) {
                candidates.push({ type: 'triplet', color, number, nonWildCount: 2, wildCount: 1 });
            }
            // 1 non-wild + 2 wilds
            if (cnt >= 1 && wildsAvailable >= 2) {
                candidates.push({ type: 'triplet', color, number, nonWildCount: 1, wildCount: 2 });
            }
        }
    }

    // Sequences: 3 consecutive numbers, same color
    for (const color of ALL_COLORS) {
        for (const startNum of [1, 2] as OrdinalNumber[]) {
            const n1 = startNum;
            const n2 = (startNum + 1) as OrdinalNumber;
            const n3 = (startNum + 2) as OrdinalNumber;

            const c1 = hasBlock(color, n1);
            const c2 = hasBlock(color, n2);
            const c3 = hasBlock(color, n3);

            // Natural sequence: all 3 present
            if (c1 >= 1 && c2 >= 1 && c3 >= 1) {
                candidates.push({ type: 'sequence', color, number: startNum, nonWildCount: 3, wildCount: 0 });
            }

            // 2 non-wilds + 1 wild
            const existing = [c1 >= 1, c2 >= 1, c3 >= 1].filter(Boolean).length;
            if (existing === 2 && wildsAvailable >= 1) {
                candidates.push({ type: 'sequence', color, number: startNum, nonWildCount: 2, wildCount: 1 });
            }

            // 1 non-wild + 2 wilds
            if (existing === 1 && wildsAvailable >= 2) {
                candidates.push({ type: 'sequence', color, number: startNum, nonWildCount: 1, wildCount: 2 });
            }
        }
    }

    // 3 wilds can form any set (triplet or sequence)
    if (wildsAvailable >= 3) {
        candidates.push({ type: 'triplet', color: 'red', number: 1, nonWildCount: 0, wildCount: 3 });
    }

    return candidates;
}

function setCandidateToDetectedSet(c: SetCandidate): DetectedSet {
    const blocks: Block[] = [];
    for (let i = 0; i < c.nonWildCount; i++) {
        blocks.push({
            id: `set-${c.color}-${c.number}-${i}`,
            category: 'ordinal',
            color: c.color,
            number: c.number,
            basePrice: 50,
        });
    }
    for (let i = 0; i < c.wildCount; i++) {
        blocks.push({
            id: `set-wild-${i}`,
            category: 'purple',
            color: 'purple',
            number: null,
            basePrice: 120,
        });
    }
    return { type: c.type, blocks };
}

function removeSetFromBlocks(
    nonWilds: Block[],
    wilds: Block[],
    set: SetCandidate,
): { nonWilds: Block[]; wilds: Block[] } | null {
    const remainingNonWilds = [...nonWilds];
    let remainingWilds = [...wilds];

    if (set.wildCount > remainingWilds.length) return null;

    // Remove non-wild blocks based on set type
    if (set.type === 'triplet') {
        // Remove blocks of {color, number}
        let toRemove = set.nonWildCount;
        const removeOrder = [...remainingNonWilds];
        remainingNonWilds.length = 0;
        for (const b of removeOrder) {
            if (toRemove > 0 && b.category === 'ordinal' && b.color === set.color && b.number === set.number) {
                toRemove--;
                continue;
            }
            remainingNonWilds.push(b);
        }
        if (toRemove > 0) return null;
    } else {
        // Sequence: remove one block each of consecutive numbers
        const numbers = [set.number, set.number + 1, set.number + 2] as OrdinalNumber[];
        let toRemovePerNumber = [1, 1, 1]; // default: 1 of each
        // Adjust based on which numbers have blocks
        const removeOrder = [...remainingNonWilds];
        remainingNonWilds.length = 0;

        for (const b of removeOrder) {
            if (b.category === 'ordinal' && b.color === set.color) {
                const idx = numbers.indexOf(b.number!);
                if (idx !== -1 && toRemovePerNumber[idx] > 0) {
                    toRemovePerNumber[idx]--;
                    continue;
                }
            }
            remainingNonWilds.push(b);
        }

        const remainingToRemove = toRemovePerNumber.reduce((a, b) => a + b, 0);
        if (remainingToRemove > 0) return null;
    }

    // Remove wild blocks
    remainingWilds = remainingWilds.slice(set.wildCount);

    return { nonWilds: remainingNonWilds, wilds: remainingWilds };
}