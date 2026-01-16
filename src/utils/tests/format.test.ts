/**
 * Format Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { formatBudget, formatCost, formatMonth } from '../format';

describe('formatBudget', () => {
    it('should format thousands with K suffix', () => {
        expect(formatBudget(100000)).toBe('100K');
        expect(formatBudget(50000)).toBe('50K');
        expect(formatBudget(10000)).toBe('10K');
    });

    it('should show decimal K for non-round thousands', () => {
        expect(formatBudget(2500)).toBe('2.5K');
        expect(formatBudget(15500)).toBe('15.5K');
    });

    it('should show raw value for small numbers', () => {
        expect(formatBudget(500)).toBe('500');
        expect(formatBudget(999)).toBe('999');
        expect(formatBudget(99.999)).toBe('100');
    });

    it('should handle decimal values < 1000', () => {
        expect(formatBudget(123.456)).toBe('123.46');
        expect(formatBudget(123.4)).toBe('123.4');
    });

    it('should show up to 2 decimals with K suffix', () => {
        expect(formatBudget(2550)).toBe('2.55K');
        expect(formatBudget(2555)).toBe('2.56K');
        expect(formatBudget(2500)).toBe('2.5K');
    });

    it('should handle zero', () => {
        expect(formatBudget(0)).toBe('0');
    });

    it('should handle exactly 1000', () => {
        expect(formatBudget(1000)).toBe('1K');
    });

    it('should handle negative values with K suffix', () => {
        expect(formatBudget(-50000)).toBe('-50K');
        expect(formatBudget(-2500)).toBe('-2.5K');
        expect(formatBudget(-500)).toBe('-500');
    });
});

describe('formatCost', () => {
    it('should show FREE for zero cost', () => {
        expect(formatCost(0)).toBe('FREE');
    });

    it('should show negative K format for costs', () => {
        expect(formatCost(50000)).toBe('-50K');
        expect(formatCost(25000)).toBe('-25K');
    });

    it('should handle small costs', () => {
        expect(formatCost(500)).toBe('-500');
    });

    it('should show positive for gains (negative values)', () => {
        expect(formatCost(-50000)).toBe('+50K');
        expect(formatCost(-2550)).toBe('+2.55K');
        expect(formatCost(-100)).toBe('+100');
    });
});

describe('formatMonth', () => {
    it('should round to integer', () => {
        expect(formatMonth(24.5)).toBe('25');
        expect(formatMonth(24.4)).toBe('24');
    });

    it('should handle exact integers', () => {
        expect(formatMonth(30)).toBe('30');
    });
});
