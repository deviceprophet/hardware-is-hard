import React from 'react';
import { formatPercentage } from '@/utils/format';

interface DoomMeterProps {
    level: number; // 0-100
    showLabel?: boolean;
}

const getDoomColor = (level: number): string => {
    if (level >= 80) return 'bg-doom-critical';
    if (level >= 60) return 'bg-doom-danger';
    if (level >= 40) return 'bg-doom-warning';
    return 'bg-doom-safe';
};

const getDoomTextColor = (level: number): string => {
    if (level >= 80) return 'text-doom-critical';
    if (level >= 60) return 'text-doom-danger';
    if (level >= 40) return 'text-doom-warning';
    return 'text-doom-safe';
};

const getDoomGlow = (level: number): string => {
    if (level >= 80) return 'shadow-[0_0_20px_rgba(219,75,75,0.5)]';
    if (level >= 60) return 'shadow-[0_0_15px_rgba(247,118,142,0.4)]';
    return '';
};

export const DoomMeter: React.FC<DoomMeterProps> = React.memo(({ level, showLabel = true }) => {
    const clampedLevel = Math.min(100, Math.max(0, level));
    const colorClass = getDoomColor(clampedLevel);
    const textColorClass = getDoomTextColor(clampedLevel);
    const glowClass = getDoomGlow(clampedLevel);
    const isPulsing = clampedLevel >= 80;

    return (
        <div className="flex items-center gap-3" data-testid="doom-meter">
            {showLabel && (
                <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    DOOM
                </span>
            )}
            <div
                role="progressbar"
                aria-valuenow={clampedLevel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Doom level: ${formatPercentage(clampedLevel)}%`}
                className="flex-1 h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
                <div
                    data-testid="doom-fill"
                    className={`h-full rounded-full transition-all duration-300 ${colorClass} ${glowClass} ${
                        isPulsing ? 'animate-pulse' : ''
                    }`}
                    style={{
                        width: `${clampedLevel}%`,
                        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                />
            </div>
            <span className={`text-sm font-bold tabular-nums ${textColorClass}`}>
                {formatPercentage(clampedLevel)}%
            </span>
        </div>
    );
});

DoomMeter.displayName = 'DoomMeter';
