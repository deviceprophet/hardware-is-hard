import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../../adapters/react';
import { formatBudget } from '../../../utils/format';
import type { Device } from '../../../engine';
import { useTranslatedDevices } from '../../../hooks/useTranslatedContent';

export const SetupView: React.FC = () => {
    console.log('SetupView: Rendering');
    const { t } = useTranslation();
    const selectDevice = useGameStore(state => state.selectDevice);
    const availableDevices = useGameStore(state => state.availableDevices);
    const startGame = useGameStore(state => state.startGame);

    const deviceIds = React.useMemo(() => availableDevices.map(d => d.id), [availableDevices]);
    const deviceTranslations = useTranslatedDevices(deviceIds);

    const handleSelect = (device: Device) => {
        selectDevice(device);
        startGame();
    };

    return (
        <main
            data-testid="setup-view"
            className="flex flex-col items-center justify-center min-h-full bg-slate-900 text-white p-4 py-12"
        >
            <h1
                data-testid="setup-view-title"
                className="text-3xl mb-8 font-mono text-green-400 font-bold tracking-tight"
            >
                {t('setup.chooseDevice')}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                {availableDevices.map(device => {
                    const translation = deviceTranslations.get(device.id);
                    return (
                        <button
                            key={device.id}
                            data-testid="device-card"
                            data-qa={`device-card-${device.id}`}
                            onClick={() => handleSelect(device)}
                            className="bg-slate-800/50 border border-slate-700 p-6 hover:border-green-500 hover:bg-slate-700/80 transition-all text-left flex flex-col gap-2 group relative overflow-hidden backdrop-blur-sm"
                        >
                            {/* Decorative accent */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500/20 group-hover:bg-green-500 transition-colors" />

                            <h2 className="text-xl font-bold group-hover:text-green-400 transition-colors">
                                {translation?.name || device.name}
                            </h2>
                            <div className="text-[10px] text-slate-300 uppercase tracking-[0.2em] font-mono">
                                {t(`common.archetypes.${device.archetype}`)}
                            </div>
                            <p className="text-sm text-slate-300 mt-2 leading-relaxed h-12 line-clamp-2">
                                {translation?.description || device.description}
                            </p>
                            <div className="mt-4 flex gap-1.5 flex-wrap">
                                {device.initialTags.map(tag => (
                                    <span
                                        key={tag}
                                        className="text-[9px] px-2 py-0.5 bg-slate-900/80 border border-slate-700 rounded text-slate-400 font-mono"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-between items-end">
                                <div className="font-mono text-green-500 text-lg font-bold">
                                    {formatBudget(device.initialBudget)}
                                </div>
                                <div className="text-[10px] text-slate-300 uppercase font-mono">
                                    {t('common.difficulty')}: {t(`common.${device.difficulty}`)}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </main>
    );
};
