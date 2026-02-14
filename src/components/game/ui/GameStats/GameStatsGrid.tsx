/**
 * Game Stats Grid Component
 *
 * Displays Budget, Compliance, and Doom stats in a consistent grid layout.
 * Used by AutopsyView, VictoryView, and SharedResultView.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatBudget } from '@/utils/format';
import { getBudgetColor, getComplianceColor, getDoomColor } from './colorHelpers';

export interface GameStatsGridProps {
    budget: number;
    complianceLevel: number;
    doomLevel: number;
    initialBudget: number;
    isVictory?: boolean;
}

export const GameStatsGrid: React.FC<GameStatsGridProps> = ({
    budget,
    complianceLevel,
    doomLevel,
    initialBudget,
    isVictory = false
}) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-3 gap-4 mb-4 w-full max-w-md">
            <div
                className="p-3 rounded-lg text-center"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)'
                }}
            >
                <div
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                    {t('common.budget')}
                </div>
                <div
                    className="text-xl font-bold"
                    style={{ color: getBudgetColor(budget, initialBudget) }}
                >
                    {formatBudget(budget)}
                </div>
            </div>
            <div
                className="p-3 rounded-lg text-center"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)'
                }}
            >
                <div
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                    {t('common.compliance')}
                </div>
                <div
                    className="text-xl font-bold"
                    style={{ color: getComplianceColor(complianceLevel) }}
                >
                    {Math.round(complianceLevel)}%
                </div>
            </div>
            <div
                className="p-3 rounded-lg text-center"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)'
                }}
            >
                <div
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                    {t('common.doom')}
                </div>
                <div
                    className="text-xl font-bold"
                    style={{ color: getDoomColor(doomLevel, isVictory) }}
                >
                    {Math.round(doomLevel)}%
                </div>
            </div>
        </div>
    );
};
