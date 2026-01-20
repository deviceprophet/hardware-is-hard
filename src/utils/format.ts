/**
 * Format Utilities
 *
 * Helpers for displaying game values in a user-friendly way.
 * Uses generic units (K = thousands) instead of currency symbols
 * for international audiences.
 */

/**
 * Format budget value - uses K for thousands, no currency symbol
 * Examples: 100000 -> "100K", 50000 -> "50K", 5000 -> "5K"
 */
export function formatBudget(value: number): string {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue >= 1000) {
        const k = absValue / 1000;
        // Show up to 2 decimals, but only if needed (strip trailing zeros)
        return `${sign}${parseFloat(k.toFixed(2))}K`;
    }
    // For values < 1000, also ensure max 2 decimals
    return `${sign}${parseFloat(absValue.toFixed(2))}`;
}

/**
 * Format cost value for choices - shows negative for costs, positive for gains
 * Examples: 50000 -> "-50K", -20000 -> "+20K", 0 -> "FREE"
 */
export function formatCost(value: number): string {
    if (value === 0) return 'FREE';
    if (value < 0) return `+${formatBudget(Math.abs(value))}`;
    return `-${formatBudget(value)}`;
}

/**
 * Format month value - rounds to integer for display
 */
export function formatMonth(value: number): string {
    const rounded = Math.round(value);
    return rounded.toString();
}

import i18n from '../i18n';

/**
 * Format game date to "X mo Y d" format
 * Assumes 30 days per month
 */
export function formatGameDate(totalMonths: number): string {
    const m = Math.floor(totalMonths);
    const d = Math.floor((totalMonths - m) * 30);
    const mo = i18n.t('common.monthShort');
    const day = i18n.t('common.dayShort');
    return d > 0 ? `${m} ${mo} ${d} ${day}` : `${m} ${mo}`;
}
