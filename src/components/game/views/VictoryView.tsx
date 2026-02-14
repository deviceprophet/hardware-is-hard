import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/adapters/react';
import { formatGameDate } from '@/utils';
import confetti from 'canvas-confetti';

import { useTranslation } from 'react-i18next';
import { useTranslatedDevice } from '@/hooks/useTranslatedContent';
import { GameStatsGrid, ShareButtons, DebugLink } from '../ui';

export const VictoryView: React.FC = () => {
    const { t } = useTranslation();
    const reset = useGameStore(state => state.reset);
    const resultUrl = useGameStore(state => state.getResultUrl('victory'));
    const debugUrl = useGameStore(state => state.getShareUrl());
    const timelineMonth = useGameStore(state => state.timelineMonth);
    const selectedDevice = useGameStore(state => state.selectedDevice);
    const budget = useGameStore(state => state.budget);
    const doomLevel = useGameStore(state => state.doomLevel);
    const complianceLevel = useGameStore(state => state.complianceLevel);
    const playAgainButtonRef = useRef<HTMLButtonElement>(null);

    const translatedDevice = useTranslatedDevice(selectedDevice?.id || '');
    const deviceName = translatedDevice.name || selectedDevice?.name || 'Unknown Device';

    useEffect(() => {
        playAgainButtonRef.current?.focus();

        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const shareText = t('victory.shareTemplate', {
        duration: formatGameDate(timelineMonth),
        device: deviceName,
        budget: `$${Math.round(budget / 1000)}K`,
        compliance: Math.round(complianceLevel),
        doom: Math.round(doomLevel)
    });

    return (
        <div
            className="h-full w-full overflow-y-auto"
            style={{ backgroundColor: 'rgba(158, 206, 106, 0.1)' }}
        >
            <div
                className="min-h-full flex flex-col items-center justify-center text-white p-8 text-center"
                style={{ fontFamily: 'var(--font-mono)' }}
                role="alertdialog"
                aria-labelledby="victory-title"
                aria-describedby="victory-desc"
                data-testid="victory-view"
            >
                <h1
                    id="victory-title"
                    className="text-5xl md:text-6xl font-black mb-2 tracking-tighter"
                    style={{ color: 'var(--doom-safe)' }}
                >
                    {t('victory.title')}
                </h1>
                <p
                    id="victory-desc"
                    className="text-lg mb-6 max-w-md"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {t('victory.survived')}
                </p>

                <GameStatsGrid
                    budget={budget}
                    complianceLevel={complianceLevel}
                    doomLevel={doomLevel}
                    initialBudget={selectedDevice?.initialBudget || 100000}
                    isVictory={true}
                />

                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    {deviceName} | {formatGameDate(timelineMonth)}
                </p>

                <ShareButtons
                    shareText={shareText}
                    resultUrl={resultUrl}
                    shareLabel={t('common.shareVictory')}
                />

                <button
                    ref={playAgainButtonRef}
                    onClick={reset}
                    className="px-8 py-3 font-bold text-lg rounded-lg transition-all cursor-pointer shadow-lg mb-8 hover:brightness-110"
                    style={{
                        backgroundColor: 'var(--doom-safe)',
                        color: 'var(--bg-primary)'
                    }}
                    aria-label={t('victory.playAgain')}
                    data-testid="play-again-btn"
                >
                    {t('victory.playAgain')}
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
