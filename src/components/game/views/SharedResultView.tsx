import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/adapters/react';
import { formatGameDate, formatBudget } from '@/utils';
import { useTranslatedDevice } from '@/hooks/useTranslatedContent';

export const SharedResultView: React.FC = () => {
    const { t } = useTranslation();
    const result = useGameStore(state => state.sharedResult);
    const goToSetup = useGameStore(state => state.goToSetup);
    // Direct engine access for setup
    const getEngine = useGameStore(state => state.getEngine);

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Get localized device info
    const deviceId = result?.d || 'unknown';
    const translatedDevice = useTranslatedDevice(deviceId);
    const deviceName = translatedDevice.name || 'Unknown Device';

    if (!result) {
        return <div className="text-white text-center p-8">Loading result...</div>;
    }

    const isVictory = result.o === 'v';
    const outcomeColor = isVictory ? 'var(--doom-safe)' : 'var(--doom-danger)';
    const bgColor = isVictory ? 'rgba(158, 206, 106, 0.1)' : 'rgba(247, 118, 142, 0.1)';

    const handleAcceptChallenge = () => {
        // Pre-select device by ID directly in engine
        getEngine().selectDevice(deviceId);
        goToSetup();
    };

    // Color helpers
    const getBudgetColor = () => {
        if (result.b <= 0) return 'var(--doom-danger)';
        if (!isVictory) return 'var(--text-primary)'; // Neutral for read-only
        return result.b >= 50000 ? 'var(--doom-safe)' : 'var(--doom-warning)';
    };

    return (
        <div
            className={`h-full flex flex-col items-center justify-center text-white p-8 text-center transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundColor: bgColor, fontFamily: 'var(--font-mono)' }}
            data-testid="shared-result-view"
        >
            <div className="uppercase tracking-[0.2em] text-xs font-bold mb-4 opacity-70">
                {t('shared.incoming')}
            </div>

            {/* Title */}
            <h1
                className="text-4xl md:text-5xl font-black mb-2 tracking-tighter"
                style={{ color: outcomeColor }}
            >
                {t(isVictory ? 'shared.missionSuccess' : 'shared.missionFailed')}
            </h1>

            <p className="text-lg mb-8 max-w-md" style={{ color: 'var(--text-primary)' }}>
                {t(isVictory ? 'shared.victoryDesc' : 'shared.failureDesc', {
                    device: deviceName,
                    duration: formatGameDate(result.m)
                })}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-md relative">
                {/* Decorative border */}
                <div className="absolute -inset-2 border border-slate-700/50 rounded-xl -z-10 bg-slate-900/50 backdrop-blur-sm" />

                <div className="p-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider mb-1 opacity-60">
                        {t('common.budget')}
                    </div>
                    <div className="text-xl font-bold" style={{ color: getBudgetColor() }}>
                        {formatBudget(result.b)}
                    </div>
                </div>
                <div className="p-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider mb-1 opacity-60">
                        {t('common.compliance')}
                    </div>
                    <div
                        className="text-xl font-bold"
                        style={{
                            color:
                                result.c >= 70
                                    ? 'var(--doom-safe)'
                                    : result.c < 40
                                      ? 'var(--doom-danger)'
                                      : 'var(--doom-warning)'
                        }}
                    >
                        {result.c}%
                    </div>
                </div>
                <div className="p-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider mb-1 opacity-60">
                        {t('common.doom')}
                    </div>
                    <div
                        className="text-xl font-bold"
                        style={{
                            color:
                                result.dm < 30
                                    ? 'var(--doom-safe)'
                                    : result.dm >= 60
                                      ? 'var(--doom-danger)'
                                      : 'var(--doom-warning)'
                        }}
                    >
                        {result.dm}%
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-4 items-center animate-bounce-subtle">
                <p className="text-sm italic opacity-60">{t('shared.challenge')}</p>
                <button
                    onClick={handleAcceptChallenge}
                    className="px-8 py-4 font-bold text-lg rounded-lg shadow-lg hover:scale-105 transition-transform"
                    style={{
                        backgroundColor: 'var(--text-primary)',
                        color: 'var(--bg-primary)',
                        boxShadow: `0 0 20px ${outcomeColor}40`
                    }}
                >
                    {t('shared.launch')}
                </button>
            </div>
        </div>
    );
};
