import React from 'react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { LogOut, FastForward, Play } from 'lucide-react';
import { useGameStore } from '../../../adapters/react';
import { DoomMeter, TimelineProgress } from '../ui';
import { SystemArchitecture } from '../ui/SystemArchitecture';
import { LogPanel } from '../ui/LogPanel';
import { formatBudget } from '../../../utils/format';
import { OTA_MONETIZATION_CONFIG } from '../../../engine/constants';
import { useTranslatedDevice } from '../../../hooks/useTranslatedContent';

export const SimulationView: React.FC = () => {
    const {
        budget,
        doomLevel,
        timelineMonth,
        complianceLevel,
        fundingLevel,
        activeTags,
        selectedDevice,
        history
    } = useGameStore();

    const translatedDevice = useTranslatedDevice(selectedDevice?.id || '');
    const deviceName = translatedDevice.name || selectedDevice?.name || 'Unknown Device';

    const setFundingLevel = useGameStore(state => state.setFundingLevel);
    const shipProduct = useGameStore(state => state.shipProduct);
    const tick = useGameStore(state => state.tick);
    const saveCurrentGame = useGameStore(state => state.saveCurrentGame);
    const exitToMenu = useGameStore(state => state.exitToMenu);
    const toggleGameSpeed = useGameStore(state => state.toggleGameSpeed);
    const gameSpeed = useGameStore(state => state.gameSpeed);
    const { t } = useTranslation();

    // Auto-save on significant state changes
    // Auto-save periodically
    useEffect(() => {
        // Save every 2 seconds (interval, not debounce, so it runs while playing)
        const timer = setInterval(() => {
            saveCurrentGame();
        }, 2000);

        // Also save on unmount
        return () => {
            clearInterval(timer);
            saveCurrentGame();
        };
    }, [saveCurrentGame]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input (not that we have any, but good practice)
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
                return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'enter':
                    e.preventDefault(); // Prevent scrolling
                    tick(timelineMonth + 4);
                    break;
                case 's':
                    if (doomLevel < 50) shipProduct();
                    break;
                case '1':
                    setFundingLevel('full');
                    break;
                case '2':
                    setFundingLevel('partial');
                    break;
                case '3':
                    setFundingLevel('none');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tick, shipProduct, setFundingLevel, timelineMonth, doomLevel]);

    // Strategy Descriptions (localized)
    const strategies = {
        full: {
            label: t('strategies.full.label'),
            desc: t('strategies.full.desc'),
            color: 'var(--doom-safe)'
        },
        partial: {
            label: t('strategies.partial.label'),
            desc: t('strategies.partial.desc'),
            color: 'var(--doom-warning)'
        },
        none: {
            label: t('strategies.none.label'),
            desc: t('strategies.none.desc'),
            color: 'var(--doom-danger)'
        }
    };

    const complianceColor =
        complianceLevel < 20
            ? 'var(--doom-danger)'
            : complianceLevel < 50
              ? 'var(--doom-warning)'
              : 'var(--doom-safe)';

    return (
        <main
            className="text-white p-4 h-full flex flex-col overflow-y-auto"
            aria-label="Game Dashboard"
            style={{ fontFamily: 'var(--font-mono)' }}
            data-testid="simulation-view"
        >
            {/* Header with device name */}
            <div className="mb-2 flex justify-between items-center px-2">
                <div className="w-6" /> {/* Spacer for balance */}
                <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {deviceName}
                </h1>
                <div className="flex gap-2 mr-12">
                    <button
                        onClick={() => {
                            const url = useGameStore.getState().getShareUrl();
                            navigator.clipboard.writeText(url).then(() => {
                                alert('Share URL copied to clipboard!');
                            });
                        }}
                        className="p-2 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-green-400"
                        title={t('common.shareGame') || 'Share Game'}
                        data-testid="share-btn"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                    </button>
                    <button
                        onClick={() => toggleGameSpeed()}
                        className={`p-2 rounded hover:bg-slate-800 transition-colors ${
                            gameSpeed === 'fast' ? 'text-blue-400' : 'text-slate-400'
                        }`}
                        title={
                            gameSpeed === 'fast'
                                ? t('common.normalSpeed') || 'Normal Speed'
                                : t('common.fastForward') || 'Fast Forward'
                        }
                        data-testid="speed-btn"
                    >
                        {gameSpeed === 'fast' ? <Play size={16} /> : <FastForward size={16} />}
                    </button>
                    <button
                        onClick={() => exitToMenu()}
                        className="p-2 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                        title={t('common.returnToMenu')}
                        data-testid="exit-menu-btn"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            {/* Timeline Progress */}
            <div className="mb-4" data-testid="timeline-wrapper">
                <TimelineProgress currentMonth={timelineMonth} />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div
                    className="p-3 rounded"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    data-testid="budget-display"
                >
                    <div
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {t('common.budget')}
                    </div>
                    <div className="text-lg font-bold" style={{ color: 'var(--doom-safe)' }}>
                        {formatBudget(budget)}
                    </div>
                </div>
                <div
                    className="p-3 rounded"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    data-testid="compliance-display"
                >
                    <div
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {t('common.compliance')}
                    </div>
                    <div className="text-lg font-bold" style={{ color: complianceColor }}>
                        {complianceLevel.toFixed(0)}%
                    </div>
                </div>
                <div
                    className="p-3 rounded"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    data-testid="strategy-display"
                >
                    <div
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {t('common.strategy')}
                    </div>
                    <div
                        className="text-lg font-bold"
                        style={{ color: strategies[fundingLevel].color }}
                    >
                        {strategies[fundingLevel].label}
                    </div>
                </div>
            </div>

            {/* Doom Meter - Prominent */}
            <div className="mb-4 p-4 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <DoomMeter level={doomLevel} />
            </div>

            {/* System Architecture Visualization (Replaces Active Tags) */}
            <div className="mb-4">
                <SystemArchitecture activeTags={activeTags} />
            </div>

            {/* Release Management */}
            <div
                className="mb-4 p-4 rounded-lg flex items-center justify-between"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)'
                }}
            >
                <div>
                    <h3
                        className="text-sm font-bold uppercase tracking-wider mb-1"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {t('simulation.releaseManagement')}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {t('simulation.shipFirmware')}
                        <br />
                        <span className="text-green-400">
                            {t('simulation.yields')}: +$
                            {formatBudget(OTA_MONETIZATION_CONFIG.REWARD)}
                        </span>{' '}
                        <span className="text-amber-400">
                            {' '}
                            {t('simulation.risk')}: +{OTA_MONETIZATION_CONFIG.DOOM_PENALTY}%{' '}
                            {t('common.doom')}
                        </span>
                    </p>
                </div>
                <button
                    onClick={() => shipProduct()}
                    disabled={doomLevel >= 50}
                    data-testid="ship-btn"
                    className="px-4 py-2 font-bold text-xs uppercase rounded transition-all flex flex-col items-center min-w-[120px]"
                    style={{
                        backgroundColor:
                            doomLevel >= 50 ? 'var(--bg-tertiary)' : 'var(--action-success)',
                        color: doomLevel >= 50 ? 'var(--text-tertiary)' : 'var(--text-inverse)',
                        opacity: doomLevel >= 50 ? 0.5 : 1,
                        cursor: doomLevel >= 50 ? 'not-allowed' : 'pointer'
                    }}
                    title={
                        doomLevel >= 50
                            ? t('simulation.stabilityWarning')
                            : t('simulation.deployUpdate')
                    }
                >
                    <span>{t('simulation.deployUpdate')}</span>
                    {doomLevel >= 50 && (
                        <span className="text-[10px] mt-1">{t('simulation.qaFailed')}</span>
                    )}
                </button>
            </div>

            {/* Engineering Strategy Panel */}
            <div
                className="p-4 rounded-lg"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)'
                }}
                data-testid="strategy-panel"
            >
                <h3
                    className="text-sm font-bold mb-3 uppercase tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {t('simulation.engineeringStrategy')}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    {(['full', 'partial', 'none'] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => setFundingLevel(level)}
                            className="p-3 rounded text-left transition-all cursor-pointer"
                            style={{
                                backgroundColor:
                                    fundingLevel === level
                                        ? 'var(--bg-tertiary)'
                                        : 'var(--bg-primary)',
                                border:
                                    fundingLevel === level
                                        ? '1px solid var(--text-primary)'
                                        : '1px solid var(--border-default)',
                                boxShadow:
                                    fundingLevel === level
                                        ? '0 0 0 1px var(--text-primary)'
                                        : 'none'
                            }}
                            aria-pressed={fundingLevel === level}
                            data-testid={`strategy-btn-${level}`}
                        >
                            <div
                                className="font-bold"
                                style={{
                                    color:
                                        fundingLevel === level
                                            ? 'var(--text-primary)'
                                            : 'var(--text-secondary)'
                                }}
                            >
                                {strategies[level].label}
                            </div>
                            <div className="text-xs mt-1 text-slate-300">
                                {strategies[level].desc}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Event Log */}
            <LogPanel history={history} />
        </main>
    );
};
