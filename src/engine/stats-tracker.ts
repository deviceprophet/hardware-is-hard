/**
 * Stats Tracker
 *
 * Handles persistent storage of player statistics using LocalStorage.
 * Tracks cumulative stats like games played, win rate, and best runs.
 */

import { checkAchievements } from './achievements';
import type { GameStateSnapshot } from './types';
import { STATS } from './constants';

export interface RunResult {
    date: string;
    deviceId: string;
    deviceName: string;
    months: number;
    outcome: 'Victory' | 'Defeat';
    // Final stats (added v1.1)
    budget?: number;
    doom?: number;
    compliance?: number;
}

export interface GameStats {
    gamesPlayed: number;
    gamesWon: number;
    bestSurvivalMonths: number;
    totalMonthsSurvived: number;
    favoriteDevice: string | null;
    lastPlayed: string;
    achievements: string[];
    runHistory: RunResult[];
}

/**
 * Load stats from local storage or return defaults
 */
export function loadStats(): GameStats {
    if (typeof localStorage === 'undefined') {
        return getDefaultStats();
    }

    try {
        const stored = localStorage.getItem(STATS.STORAGE_KEY);
        if (!stored) return getDefaultStats();

        const parsed = JSON.parse(stored);
        // Merge with default to ensure new fields are present if schema updates
        return { ...getDefaultStats(), ...parsed };
    } catch (e) {
        console.warn('Failed to load stats:', e);
        return getDefaultStats();
    }
}

/**
 * Save stats to local storage
 */
export function saveStats(stats: GameStats): void {
    if (typeof localStorage === 'undefined') return;

    try {
        localStorage.setItem(STATS.STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
        console.warn('Failed to save stats:', e);
    }
}

/**
 * Record the result of a finished game
 */
export function recordGameResult(
    won: boolean,
    monthsSurvived: number,
    deviceId: string,
    deviceName: string,
    finalStats?: { budget: number; doom: number; compliance: number },
    fullState?: GameStateSnapshot
): GameStats {
    const stats = loadStats();

    // Update counters
    stats.gamesPlayed++;
    if (won) stats.gamesWon++;

    // Update bests
    stats.bestSurvivalMonths = Math.max(stats.bestSurvivalMonths, monthsSurvived);
    stats.totalMonthsSurvived += monthsSurvived;

    const now = new Date().toISOString();
    stats.lastPlayed = now;

    // Add to history (keep last 10)
    const newRun: RunResult = {
        date: now,
        deviceId,
        deviceName,
        months: monthsSurvived,
        outcome: won ? 'Victory' : 'Defeat',
        budget: finalStats?.budget,
        doom: finalStats?.doom,
        compliance: finalStats?.compliance
    };

    // Initialize if undefined (migration safety)
    if (!stats.runHistory) stats.runHistory = [];

    stats.runHistory.unshift(newRun);
    if (stats.runHistory.length > STATS.MAX_RUN_HISTORY) {
        stats.runHistory = stats.runHistory.slice(0, STATS.MAX_RUN_HISTORY);
    }

    // Simple heuristic for favorite device
    if (!stats.favoriteDevice) {
        stats.favoriteDevice = deviceName;
    }

    // Check for new achievements
    const newAchievements = checkAchievements(fullState || null, stats);
    if (newAchievements.length > 0) {
        if (!stats.achievements) stats.achievements = [];
        stats.achievements.push(...newAchievements);
    }

    saveStats(stats);
    return stats;
}

/**
 * Public helper to get default empty stats
 */
export function getDefaultStats(): GameStats {
    return {
        gamesPlayed: 0,
        gamesWon: 0,
        bestSurvivalMonths: 0,
        totalMonthsSurvived: 0,
        favoriteDevice: null,
        lastPlayed: '',
        achievements: [],
        runHistory: []
    };
}
