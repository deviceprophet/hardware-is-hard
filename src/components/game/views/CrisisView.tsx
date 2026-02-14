import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/adapters/react';
import { useTranslatedEvent } from '@/hooks/useTranslatedContent';
import { formatCost } from '@/utils/format';

export const CrisisView: React.FC = () => {
    const { currentCrisis, resolveCrisis } = useGameStore();
    const { t } = useTranslation();
    const firstButtonRef = useRef<HTMLButtonElement>(null);

    // Get translated content for this event
    const translatedEvent = useTranslatedEvent(currentCrisis?.id || '');

    // Focus management for accessibility
    useEffect(() => {
        if (currentCrisis && firstButtonRef.current) {
            firstButtonRef.current.focus();
        }
    }, [currentCrisis]);

    if (!currentCrisis) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crisis-title"
            aria-describedby="crisis-desc"
        >
            <div className="bg-slate-900 border border-red-500 max-w-lg w-full p-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <h2 className="text-red-500 text-2xl font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
                    <span aria-hidden="true" className="animate-pulse">
                        ⚠️
                    </span>
                    <span className="animate-glitch">{t('crisis.title')}</span>
                </h2>

                <h3 id="crisis-title" className="text-white text-xl font-bold mb-4">
                    {translatedEvent.title}
                </h3>

                <p id="crisis-desc" className="text-slate-300 mb-6 border-l-2 border-red-900 pl-4">
                    {translatedEvent.description}
                </p>

                <div
                    className="flex flex-col gap-3"
                    role="group"
                    aria-label={t('crisis.chooseAction')}
                >
                    {currentCrisis.choices.map((choice, index) => (
                        <button
                            key={choice.id}
                            ref={index === 0 ? firstButtonRef : null}
                            onClick={() => resolveCrisis(choice)}
                            className="text-left p-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-white transition-colors group focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            aria-label={`${translatedEvent.getChoiceText(choice.id)}. ${t('crisis.cost')}: ${choice.cost}. Risk: ${choice.riskLevel}`}
                        >
                            <div className="font-bold text-white group-hover:text-amber-400">
                                {translatedEvent.getChoiceText(choice.id)}
                            </div>
                            <div className="flex justify-between text-xs mt-1 text-slate-400 font-mono">
                                <span
                                    className={choice.cost > 0 ? 'text-red-300' : 'text-green-300'}
                                >
                                    {formatCost(choice.cost)}
                                </span>
                                <span
                                    className={`uppercase font-bold ${
                                        choice.riskLevel === 'high'
                                            ? 'text-red-500'
                                            : choice.riskLevel === 'medium'
                                              ? 'text-amber-500'
                                              : 'text-green-500'
                                    }`}
                                >
                                    {t('crisis.doomImpact')}: {choice.doomImpact > 0 ? '+' : ''}
                                    {choice.doomImpact}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
