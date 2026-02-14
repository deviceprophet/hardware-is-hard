import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { HistoryEntry } from '@/engine/types';
import { formatGameDate } from '@/utils';

interface LogPanelProps {
    history: readonly HistoryEntry[];
}

import { useTranslatedEvents } from '@/hooks/useTranslatedContent';

export const LogPanel: React.FC<LogPanelProps> = ({ history }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    const eventIds = React.useMemo(() => history.map(h => h.eventId), [history]);
    const translatedEventsMap = useTranslatedEvents(eventIds);

    // Auto-scroll to bottom of log panel only (not parent)
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [history]);

    // Always render panel to show system status area
    // if (history.length === 0) return null;

    return (
        <div className="mt-4 border-t border-slate-700 pt-4" data-testid="log-panel">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">
                {t('logs.title')}
            </h3>
            <div
                ref={containerRef}
                className="bg-black/50 rounded p-2 font-mono text-[10px] h-32 overflow-y-auto custom-scrollbar"
            >
                {history.map((entry, i) => {
                    const translatedEvent = translatedEventsMap.get(entry.eventId);
                    const displayTitle = translatedEvent?.title || t('logs.unknownEvent');
                    const choiceText =
                        translatedEvent?.getChoiceText(entry.choiceId) || t('logs.unknownAction');

                    return (
                        <div
                            key={i}
                            className="mb-1 border-b border-slate-800/50 pb-1 last:border-0 last:pb-0"
                        >
                            <div className="flex justify-between text-slate-400">
                                <span>
                                    {formatGameDate(entry.month)}: {displayTitle}
                                </span>
                                <span
                                    className={
                                        entry.doomIncrease > 0 ? 'text-red-400' : 'text-green-400'
                                    }
                                >
                                    {entry.doomIncrease > 0
                                        ? t('logs.doomIncrease', { count: entry.doomIncrease })
                                        : ''}
                                </span>
                            </div>
                            <div className="text-slate-400 pl-2">↳ {choiceText}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
