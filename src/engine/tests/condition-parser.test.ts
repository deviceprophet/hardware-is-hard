import { describe, it, expect } from 'vitest';
import { evaluateCondition, createConditionContext } from '../condition-parser';

describe('Condition Parser (Jexl)', () => {
    const context = createConditionContext(24, 60000, 30, 2, ['tag1', 'tag2']);

    it('should evaluate numeric comparisons', () => {
        expect(evaluateCondition('month > 12', context)).toBe(true);
        expect(evaluateCondition('month < 12', context)).toBe(false);
        expect(evaluateCondition('budget >= 50000', context)).toBe(true);
        expect(evaluateCondition('doom <= 30', context)).toBe(true);
        expect(evaluateCondition('tagCount == 2', context)).toBe(true);
        expect(evaluateCondition('month != 0', context)).toBe(true);
    });

    it('should evaluate binary in operator', () => {
        expect(evaluateCondition("'tag1' in activeTags", context)).toBe(true);
        expect(evaluateCondition("'tag3' in activeTags", context)).toBe(false);
    });

    it('should evaluate custom functions (includes)', () => {
        expect(evaluateCondition("includes(activeTags, 'tag1')", context)).toBe(true);
        expect(evaluateCondition("includes(activeTags, 'tag3')", context)).toBe(false);
    });

    it('should handle complex expressions (AND/OR)', () => {
        expect(evaluateCondition('month > 12 && budget > 50000', context)).toBe(true);
        expect(evaluateCondition('month > 100 || budget > 50000', context)).toBe(true);
        expect(evaluateCondition('doom > 50 && budget < 1000', context)).toBe(false);
    });

    it('should handle loose strings (whitespace)', () => {
        expect(evaluateCondition('  month   >   12  ', context)).toBe(true);
    });

    it('should return true for empty/undefined conditions (fail open)', () => {
        expect(evaluateCondition(undefined, context)).toBe(true);
        expect(evaluateCondition('', context)).toBe(true);
    });

    it('should return false for invalid expressions (fail closed)', () => {
        expect(evaluateCondition('invalid syntax ???', context)).toBe(false);
        expect(evaluateCondition('month >', context)).toBe(false);
    });
});
