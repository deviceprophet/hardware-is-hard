/**
 * Color Helper Utilities for Game Stats
 *
 * Provides consistent color coding across all game views.
 */

export interface ColorConfig {
    budget: string;
    compliance: string;
    doom: string;
}

export function getBudgetColor(budget: number, initialBudget: number): string {
    if (budget <= 0) return 'var(--doom-danger)';
    if (budget >= initialBudget * 0.5) return 'var(--doom-warning)';
    return 'var(--doom-danger)';
}

export function getComplianceColor(complianceLevel: number): string {
    if (complianceLevel >= 70) return 'var(--doom-safe)';
    if (complianceLevel >= 40) return 'var(--doom-warning)';
    return 'var(--doom-danger)';
}

export function getDoomColor(doomLevel: number, isVictory: boolean = false): string {
    if (isVictory) {
        if (doomLevel < 30) return 'var(--doom-safe)';
        if (doomLevel < 60) return 'var(--doom-warning)';
        return 'var(--doom-danger)';
    }
    if (doomLevel >= 100) return 'var(--doom-danger)';
    if (doomLevel >= 60) return 'var(--doom-danger)';
    return 'var(--doom-warning)';
}
