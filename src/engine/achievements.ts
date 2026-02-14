/**
 * Achievements System
 *
 * Defines achievement conditions and checks them against game state and stats.
 */

import type { GameStateSnapshot } from './types';
import type { GameStats } from './stats-tracker';
import { ACHIEVEMENT_THRESHOLDS as T } from './constants';

export interface AchievementDef {
    id: string;
    icon: string;
    check: (state: GameStateSnapshot | null, stats: GameStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
    {
        id: 'first_blood',
        icon: '1',
        check: (_state, stats) => stats.gamesPlayed >= T.FIRST_BLOOD_GAMES
    },
    {
        id: 'survivor',
        icon: 'S',
        check: (_state, stats) => stats.gamesWon >= T.SURVIVOR_WINS
    },
    {
        id: 'budget_hawk',
        icon: '$',
        check: (state, _stats) =>
            state !== null && state.phase === 'victory' && state.budget >= T.BUDGET_HAWK_MIN_BUDGET
    },
    {
        id: 'doom_dancer',
        icon: 'D',
        check: (state, _stats) =>
            state !== null && state.phase === 'victory' && state.doomLevel >= T.DOOM_DANCER_MIN_DOOM
    },
    {
        id: 'clean_slate',
        icon: '0',
        check: (state, _stats) =>
            state !== null && state.phase === 'victory' && state.doomLevel <= T.CLEAN_SLATE_MAX_DOOM
    },
    {
        id: 'veteran',
        icon: 'V',
        check: (_state, stats) => stats.gamesPlayed >= T.VETERAN_GAMES
    },
    {
        id: 'undefeated',
        icon: 'U',
        check: (_state, stats) =>
            stats.gamesWon >= T.UNDEFEATED_WINS && stats.gamesWon === stats.gamesPlayed
    },
    {
        id: 'speed_run',
        icon: 'R',
        check: (state, _stats) =>
            state !== null &&
            state.phase === 'victory' &&
            state.history.length <= T.SPEEDRUN_MAX_EVENTS
    },
    {
        id: 'crisis_veteran',
        icon: 'C',
        check: (state, _stats) =>
            state !== null && state.history.length >= T.CRISIS_VETERAN_MIN_EVENTS
    },
    {
        id: 'all_devices',
        icon: 'A',
        check: (_state, stats) => {
            if (!stats.runHistory) return false;
            const uniqueDevices = new Set(stats.runHistory.map(r => r.deviceId));
            return uniqueDevices.size >= T.ALL_DEVICES_COUNT;
        }
    }
];

/**
 * Check which achievements are newly earned.
 */
export const checkAchievements = (state: GameStateSnapshot | null, stats: GameStats): string[] => {
    const existing = new Set(stats.achievements || []);
    const newlyEarned: string[] = [];

    for (const achievement of ACHIEVEMENTS) {
        if (existing.has(achievement.id)) continue;
        if (achievement.check(state, stats)) {
            newlyEarned.push(achievement.id);
        }
    }

    return newlyEarned;
};

/**
 * Look up an achievement definition by ID.
 */
export const getAchievementDef = (id: string): AchievementDef | undefined =>
    ACHIEVEMENTS.find(a => a.id === id);
