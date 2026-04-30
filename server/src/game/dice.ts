import type { DiceResult, IncomeResult } from '../../../shared/types.js';

/**
 * Roll two dice: Red (1-6) and Green (1-6)
 */
export function rollDice(): DiceResult {
    const red = Math.floor(Math.random() * 6) + 1;
    const green = Math.floor(Math.random() * 6) + 1;
    return { red, green };
}

/**
 * Calculate income based on dice roll.
 * Rules:
 *   - Green ∈ [1,2] → round ones to 0  (e.g. R=4,G=2 → 40)
 *   - Green ∈ [3,7] → round ones to 5  (e.g. R=4,G=3 → 45)
 *   - Green ∈ [8,9] → round up to next 10 (e.g. R=4,G=8 → 50)
 *   - Double 6 (R=6,G=6) → $70 + extra action flag
 */
export function calculateIncome(dice: DiceResult): { income: number; isDouble6: boolean } {
    const { red, green } = dice;

    // Double 6 special case
    if (red === 6 && green === 6) {
        return { income: 70, isDouble6: true };
    }

    let income: number;
    const baseIncome = red * 10; // e.g. red=4 → base=40

    if (green >= 1 && green <= 2) {
        // Round down to nearest 10
        income = baseIncome;
    } else if (green >= 3 && green <= 7) {
        // Round to nearest half-10 (.5)
        income = green === 3 ? baseIncome + 5 : baseIncome + 5;
    } else {
        // green >= 8 → round up to next 10
        income = baseIncome + 10;
    }

    return { income, isDouble6: false };
}

/**
 * Roll for income: roll dice and calculate income.
 */
export function rollForIncome(): IncomeResult {
    const dice = rollDice();
    const { income, isDouble6 } = calculateIncome(dice);
    return { dice, income, isDouble6 };
}

/**
 * Roll for duel: sum of R+G, detect doubles (both dice same value).
 */
export function rollForDuel(): { dice: DiceResult; sum: number; isDoubles: boolean } {
    const dice = rollDice();
    const sum = dice.red + dice.green;
    const isDoubles = dice.red === dice.green;
    return { dice, sum, isDoubles };
}