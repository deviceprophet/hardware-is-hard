import React from 'react';
import { formatGameDate } from '../../../utils/format';

interface TimelineProgressProps {
    currentMonth: number;
    maxMonth?: number;
}

import { useTranslation } from 'react-i18next';

export const TimelineProgress: React.FC<TimelineProgressProps> = ({
    currentMonth,
    maxMonth = 60
}) => {
    const { t } = useTranslation();
    const progress = Math.min(100, (currentMonth / maxMonth) * 100);
    const yearMarkers = [12, 24, 36, 48, 60];

    return (
        <div className="w-full">
            <div
                className="flex justify-between text-xs mb-1"
                style={{ color: 'var(--text-secondary)' }}
            >
                <span data-testid="timeline-display">{formatGameDate(currentMonth)}</span>
                <span>
                    {maxMonth} {t('common.monthShort')}
                </span>
            </div>
            <div
                className="relative h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
                {/* Progress fill */}
                <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                        width: `${progress}%`,
                        backgroundColor: 'var(--action-primary)',
                        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                />
                {/* Year markers */}
                {yearMarkers.map(month => (
                    <div
                        key={month}
                        className="absolute top-0 bottom-0 w-0.5"
                        style={{
                            left: `${(month / maxMonth) * 100}%`,
                            backgroundColor: 'var(--bg-primary)'
                        }}
                    />
                ))}
            </div>
            <div
                className="flex justify-between mt-1"
                style={{ fontSize: '10px', color: 'var(--text-secondary)' }}
            >
                {['Y1', 'Y2', 'Y3', 'Y4', 'Y5'].map((label, i) => (
                    <span
                        key={label}
                        style={{
                            color:
                                currentMonth >= (i + 1) * 12 ? 'var(--action-primary)' : undefined
                        }}
                    >
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
};
