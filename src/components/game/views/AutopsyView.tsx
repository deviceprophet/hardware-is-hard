import React, { useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '@/adapters/react';
import { generateBlame } from '@/engine/blame-generator';
import { formatGameDate } from '@/utils';
import eventsData from '@/data/events.json';
import type { GameEvent } from '@/engine/types';

import { useTranslation } from 'react-i18next';
import { useTranslatedDevice } from '@/hooks/useTranslatedContent';
import { GameStatsGrid, ShareButtons, DebugLink } from '../ui';

export const AutopsyView: React.FC = () => {
    const { t } = useTranslation();
    const reset = useGameStore(state => state.reset);
    const resultUrl = useGameStore(state => state.getResultUrl('recall'));
    const debugUrl = useGameStore(state => state.getShareUrl());
    const timelineMonth = useGameStore(state => state.timelineMonth);
    const selectedDevice = useGameStore(state => state.selectedDevice);
    const doomLevel = useGameStore(state => state.doomLevel);
    const budget = useGameStore(state => state.budget);
    const complianceLevel = useGameStore(state => state.complianceLevel);
    const history = useGameStore(state => state.history);
    const retryButtonRef = useRef<HTMLButtonElement>(null);

    const translatedDevice = useTranslatedDevice(selectedDevice?.id || '');
    const deviceName = translatedDevice.name || selectedDevice?.name || 'Unknown Device';

    const blame = useMemo(() => {
        return generateBlame(
            [...history],
            eventsData as GameEvent[],
            Math.round(timelineMonth * 1000)
        );
    }, [history, timelineMonth]);

    useEffect(() => {
        retryButtonRef.current?.focus();
    }, []);

    const blameText = `${blame.emoji} ${t(`blame.departments.${blame.department}`)} ${t(
        `blame.statements.${blame.department}.${blame.statement}`
    )}`;

    const shareText = t('autopsy.shareTemplate', {
        device: deviceName,
        duration: formatGameDate(timelineMonth),
        blame: blameText,
        budget: `$${Math.round(budget / 1000)}K`,
        doom: Math.round(doomLevel)
    });

    return (
        <div
            className="h-full w-full overflow-y-auto"
            style={{ backgroundColor: 'rgba(247, 118, 142, 0.1)' }}
        >
            <div
                className="min-h-full flex flex-col items-center justify-center text-white p-8 text-center"
                style={{ fontFamily: 'var(--font-mono)' }}
                role="alertdialog"
                aria-labelledby="autopsy-title"
                aria-describedby="autopsy-desc"
                data-testid="autopsy-view"
            >
                <h1
                    id="autopsy-title"
                    className="text-5xl md:text-6xl font-black mb-2 tracking-tighter animate-pulse"
                    style={{ color: 'var(--doom-danger)' }}
                >
                    {t('autopsy.title')}
                </h1>
                <p
                    id="autopsy-desc"
                    className="text-lg mb-4 max-w-md"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {t('autopsy.gameOver')}
                </p>

                <div
                    className="mb-4 px-4 py-3 rounded-lg max-w-md"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--doom-danger)',
                        boxShadow: '0 0 20px rgba(247, 118, 142, 0.2)'
                    }}
                >
                    <p className="text-sm" style={{ color: 'var(--doom-warning)' }}>
                        <span className="font-bold">
                            {t(`blame.departments.${blame.department}`)}
                        </span>{' '}
                        {t(`blame.statements.${blame.department}.${blame.statement}`)}
                    </p>
                </div>

                <GameStatsGrid
                    budget={budget}
                    complianceLevel={complianceLevel}
                    doomLevel={doomLevel}
                    initialBudget={selectedDevice?.initialBudget || 100000}
                />

                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    {deviceName} | {formatGameDate(timelineMonth)}
                </p>

                <ShareButtons
                    shareText={shareText}
                    resultUrl={resultUrl}
                    shareLabel={t('common.shareFailure')}
                />

                <button
                    ref={retryButtonRef}
                    onClick={reset}
                    className="px-8 py-3 font-bold text-lg rounded-lg transition-all cursor-pointer shadow-lg mb-8 hover:brightness-90"
                    style={{
                        backgroundColor: 'var(--text-primary)',
                        color: 'var(--bg-primary)'
                    }}
                    aria-label={t('autopsy.tryAgain')}
                    data-testid="retry-btn"
                >
                    {t('autopsy.tryAgain')}
                </button>

                <DebugLink
                    debugUrl={debugUrl}
                    copiedLabel={t('common.debugCopied')}
                    defaultLabel={t('common.debugCopy')}
                />
            </div>
        </div>
    );
};
