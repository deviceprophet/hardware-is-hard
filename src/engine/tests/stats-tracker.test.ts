/**
 * Stats Tracker Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadStats, saveStats, recordGameResult, getDefaultStats } from '../stats-tracker';

describe('Stats Tracker', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('should return default stats when storage is empty', () => {
        const stats = loadStats();
        expect(stats).toEqual(getDefaultStats());
    });

    it('should save and load stats correctly', () => {
        const stats = getDefaultStats();
        stats.gamesPlayed = 5;
        stats.bestSurvivalMonths = 42;

        saveStats(stats);

        const loaded = loadStats();
        expect(loaded).toEqual(stats);
    });

    it('should record a game win correctly', () => {
        recordGameResult(true, 60, 'test-id', 'TestDevice');

        const stats = loadStats();
        expect(stats.gamesPlayed).toBe(1);
        expect(stats.gamesWon).toBe(1);
        expect(stats.bestSurvivalMonths).toBe(60);
        expect(stats.totalMonthsSurvived).toBe(60);
        expect(stats.favoriteDevice).toBe('TestDevice');
    });

    it('should record a game loss correctly', () => {
        recordGameResult(false, 25, 'test-id', 'TestDevice');

        const stats = loadStats();
        expect(stats.gamesPlayed).toBe(1);
        expect(stats.gamesWon).toBe(0);
        expect(stats.bestSurvivalMonths).toBe(25);
    });

    it('should accumulate stats over multiple games', () => {
        recordGameResult(false, 10, 'device-a', 'DeviceA');
        recordGameResult(true, 60, 'device-b', 'DeviceB');

        const stats = loadStats();
        expect(stats.gamesPlayed).toBe(2);
        expect(stats.gamesWon).toBe(1);
        expect(stats.bestSurvivalMonths).toBe(60);
        expect(stats.totalMonthsSurvived).toBe(70);
    });

    it('should handle corrupted local storage gracefully', () => {
        localStorage.setItem('hardware-is-hard-stats_v1', 'NOT_VALID_JSON');

        const stats = loadStats();
        // Should fallback to defaults instead of crashing
        expect(stats).toEqual(getDefaultStats());
    });

    it('should store final stats (budget, doom, compliance) in run history', () => {
        recordGameResult(true, 60, 'test-id', 'TestDevice', {
            budget: 45000,
            doom: 35,
            compliance: 78
        });

        const stats = loadStats();
        expect(stats.runHistory).toHaveLength(1);
        expect(stats.runHistory[0].budget).toBe(45000);
        expect(stats.runHistory[0].doom).toBe(35);
        expect(stats.runHistory[0].compliance).toBe(78);
    });
});
