import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../../adapters/react';
import { Play, RotateCcw } from 'lucide-react';
import { formatGameDate, formatBudget } from '../../../utils';
import { useTranslatedDevices } from '../../../hooks/useTranslatedContent';

export const SplashView: React.FC = () => {
    const goToSetup = useGameStore(state => state.goToSetup);
    const getStats = useGameStore(state => state.getStats);
    const hasSave = useGameStore(state => state.hasSave);
    const getSaveInfo = useGameStore(state => state.getSaveInfo);
    const loadSavedGame = useGameStore(state => state.loadSavedGame);
    const { t } = useTranslation();

    // Load stats on mount
    const stats = getStats();
    const saveInfo = getSaveInfo();
    const hasSavedGame = hasSave();

    const deviceIds = React.useMemo(
        () => stats.runHistory?.map(run => run.deviceId).filter(Boolean) || [],
        [stats.runHistory]
    );

    const deviceTranslations = useTranslatedDevices(deviceIds);

    const handleNewGame = () => {
        goToSetup();
    };

    const handleContinue = () => {
        if (loadSavedGame()) {
            // Game loaded successfully - state will update
        }
    };

    return (
        <main className="flex flex-col items-center justify-center h-full bg-slate-900 text-green-400 p-8 text-center font-mono">
            <h1 className="text-4xl mb-4 font-bold tracking-tighter" data-testid="splash-title">
                {t('splash.title')}
            </h1>
            <p className="mb-6 text-lg text-green-500/80">{t('splash.subtitle')}</p>
            <div className="max-w-lg text-sm text-slate-400 mb-8 leading-relaxed">
                {t('splash.description')}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                    data-testid="start-sim-btn"
                    className="px-8 py-4 bg-green-500 text-black font-bold hover:bg-green-400 transition-all flex items-center gap-2"
                    onClick={handleNewGame}
                >
                    <Play size={24} /> {t('splash.startButton')}
                </button>

                {hasSavedGame && saveInfo && (
                    <button
                        data-testid="continue-btn"
                        className="px-8 py-4 bg-slate-700 text-green-400 font-bold hover:bg-slate-600 transition-all flex items-center gap-2 border border-green-500/50"
                        onClick={handleContinue}
                    >
                        <RotateCcw size={24} /> {t('common.continue')}
                        <span className="text-xs opacity-70 ml-2">
                            ({formatGameDate(saveInfo.month)})
                        </span>
                    </button>
                )}
            </div>

            {/* Local Stats */}
            {/* Local Stats & History */}
            {stats.gamesPlayed > 0 && (
                <div className="flex flex-col gap-6 text-xs text-slate-500 animate-fade-in border-t border-slate-800 pt-6 px-4 w-full max-w-2xl">
                    <div className="flex gap-8 justify-center border-b border-slate-800 pb-4">
                        <div className="text-center">
                            <span className="block text-2xl text-green-500 font-bold">
                                {formatGameDate(stats.bestSurvivalMonths)}
                            </span>
                            <span className="text-[10px] uppercase opacity-70">
                                Record Survival
                            </span>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl text-green-500 font-bold">
                                {((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(0)}%
                            </span>
                            <span className="text-[10px] uppercase opacity-70">Win Rate</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl text-green-500 font-bold">
                                {stats.gamesPlayed}
                            </span>
                            <span className="text-[10px] uppercase opacity-70">Attempts</span>
                        </div>
                    </div>

                    {stats.runHistory && stats.runHistory.length > 0 && (
                        <div className="w-full">
                            <div className="uppercase tracking-widest mb-3 font-bold opacity-50 text-center">
                                {t('splash.recentLogs')}
                            </div>
                            <div className="flex flex-col gap-2 overflow-x-auto">
                                <div className="grid grid-cols-7 text-[10px] uppercase opacity-50 pb-1 px-2 min-w-[500px]">
                                    <span>Date</span>
                                    <span>Device</span>
                                    <span>Outcome</span>
                                    <span className="text-right">Survived</span>
                                    <span className="text-right">{t('common.budget')}</span>
                                    <span className="text-right">{t('common.doom')}</span>
                                    <span className="text-right">{t('common.compliance')}</span>
                                </div>
                                {stats.runHistory.slice(0, 5).map((run, i) => {
                                    const translation = deviceTranslations.get(run.deviceId);
                                    const displayName = translation?.name || run.deviceName;

                                    // Color coding functions
                                    const getBudgetColor = () => {
                                        if (run.budget === undefined) return 'text-slate-500';
                                        if (run.budget <= 0) return 'text-red-400';
                                        if (run.budget >= 50000) return 'text-green-400';
                                        return 'text-amber-400';
                                    };
                                    const getDoomColor = () => {
                                        if (run.doom === undefined) return 'text-slate-500';
                                        if (run.doom < 30) return 'text-green-400';
                                        if (run.doom < 60) return 'text-amber-400';
                                        return 'text-red-400';
                                    };
                                    const getComplianceColor = () => {
                                        if (run.compliance === undefined) return 'text-slate-500';
                                        if (run.compliance >= 70) return 'text-green-400';
                                        if (run.compliance >= 40) return 'text-amber-400';
                                        return 'text-red-400';
                                    };

                                    return (
                                        <div
                                            key={i}
                                            className="grid grid-cols-7 bg-slate-800/50 p-2 rounded text-slate-300 font-mono text-xs min-w-[500px]"
                                        >
                                            <span className="opacity-70">
                                                {new Date(run.date).toLocaleDateString()}
                                            </span>
                                            <span className="truncate pr-2" title={displayName}>
                                                {displayName}
                                            </span>
                                            <span
                                                className={
                                                    run.outcome === 'Victory'
                                                        ? 'text-green-400 font-bold'
                                                        : 'text-red-400'
                                                }
                                            >
                                                {run.outcome}
                                            </span>
                                            <span className="text-right text-slate-400">
                                                {formatGameDate(run.months)}
                                            </span>
                                            <span className={`text-right ${getBudgetColor()}`}>
                                                {run.budget !== undefined
                                                    ? formatBudget(run.budget)
                                                    : '-'}
                                            </span>
                                            <span className={`text-right ${getDoomColor()}`}>
                                                {run.doom !== undefined
                                                    ? `${Math.round(run.doom)}%`
                                                    : '-'}
                                            </span>
                                            <span className={`text-right ${getComplianceColor()}`}>
                                                {run.compliance !== undefined
                                                    ? `${Math.round(run.compliance)}%`
                                                    : '-'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
};
