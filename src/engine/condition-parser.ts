/**
 * Condition Parser for Event Triggers (Jexl Implementation)
 *
 * Uses Jexl (Javascript Expression Language) to evaluate trigger conditions safely.
 * Logic: "month > 12", "budget < 50000 && doom > 50"
 */

import jexl from 'jexl';

// Add 'includes' function to Jexl
jexl.addFunction('includes', (arr: unknown, val: unknown) => {
    if (Array.isArray(arr)) {
        return arr.includes(val);
    }
    if (typeof arr === 'string') {
        return arr.includes(val as string);
    }
    return false;
});

// Supported variables in context
interface ConditionContext {
    month: number;
    budget: number;
    doom: number;
    tagCount: number;
    activeTags: string[];
}

/**
 * Evaluates a condition string against a context using Jexl.
 *
 * @param conditionStr The Jexl expression string (e.g. "month > 12")
 * @param context The variables available to the expression
 * @returns boolean result
 */
export function evaluateCondition(
    conditionStr: string | undefined,
    context: ConditionContext
): boolean {
    if (!conditionStr || conditionStr.trim() === '') {
        return true; // No condition implies always eligible
    }

    try {
        // Jexl.evalSync is safe for simple sync expressions
        // Reference: https://github.com/TomFrost/jexl
        return !!jexl.evalSync(conditionStr, context);
    } catch (e) {
        console.warn(`Jexl evaluation error for condition "${conditionStr}":`, e);
        // Fail open or closed?
        // Failing open (true) might trigger events prematurely.
        // Failing closed (false) is safer for game balance.
        return false;
    }
}

/**
 * Creates a context object from game state values
 */
export function createConditionContext(
    month: number,
    budget: number,
    doom: number,
    tagCount: number,
    activeTags: string[]
): ConditionContext {
    return { month, budget, doom, tagCount, activeTags };
}
