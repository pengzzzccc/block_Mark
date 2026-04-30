import type { DiceResult, IncomeResult } from '@shared/types.js';
/**
 * Roll two dice: Red (1-6) and Green (1-6)
 */
export declare function rollDice(): DiceResult;
/**
 * Calculate income based on dice roll.
 * Rules:
 *   - Green ∈ [1,2] → round ones to 0  (e.g. R=4,G=2 → 40)
 *   - Green ∈ [3,7] → round ones to 5  (e.g. R=4,G=3 → 45)
 *   - Green ∈ [8,9] → round up to next 10 (e.g. R=4,G=8 → 50)
 *   - Double 6 (R=6,G=6) → $70 + extra action flag
 */
export declare function calculateIncome(dice: DiceResult): {
    income: number;
    isDouble6: boolean;
};
/**
 * Roll for income: roll dice and calculate income.
 */
export declare function rollForIncome(): IncomeResult;
/**
 * Roll for duel: sum of R+G, detect doubles (both dice same value).
 */
export declare function rollForDuel(): {
    dice: DiceResult;
    sum: number;
    isDoubles: boolean;
};
