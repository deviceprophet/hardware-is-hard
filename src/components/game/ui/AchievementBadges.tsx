import React from 'react';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENTS } from '@/engine/achievements';

interface AchievementBadgesProps {
    earned: string[];
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({ earned }) => {
    const { t } = useTranslation();
    const earnedSet = new Set(earned);

    return (
        <div className="w-full">
            <div className="uppercase tracking-widest mb-3 font-bold opacity-50 text-center text-xs">
                {t('achievements.title')}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
                {ACHIEVEMENTS.map(achievement => {
                    const isEarned = earnedSet.has(achievement.id);
                    return (
                        <div
                            key={achievement.id}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors ${
                                isEarned
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                    : 'bg-slate-800/50 border-slate-700 text-slate-600'
                            }`}
                            title={
                                isEarned
                                    ? `${t(`achievements.${achievement.id}.name`)} - ${t(`achievements.${achievement.id}.desc`)}`
                                    : '???'
                            }
                        >
                            {isEarned ? achievement.icon : '?'}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
