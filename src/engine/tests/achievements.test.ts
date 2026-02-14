import { describe, it, expect } from 'vitest';
import { checkAchievements, getAchievementDef, ACHIEVEMENTS } from '../achievements';
import { getDefaultStats, type GameStats } from '../stats-tracker';
import type { GameStateSnapshot } from '../types';

function makeState(overrides: Partial<GameStateSnapshot> = {}): GameStateSnapshot {
    return {
        phase: 'victory',
        budget: 50000,
        doomLevel: 30,
        timelineMonth: 60,
        selectedDevice: null,
        availableDevices: [],
        activeTags: [],
        history: [],
        shieldDeflections: [],
        currentCrisis: null,
        lastEventMonth: 0,
        isPaused: false,
        complianceLevel: 80,
        fundingLevel: 'full',
        deathAnalysis: null,
        ...overrides
    };
}

function makeStats(overrides: Partial<GameStats> = {}): GameStats {
    return { ...getDefaultStats(), ...overrides };
}

describe('Achievements', () => {
    it('first_blood: triggers on gamesPlayed >= 1', () => {
        const result = checkAchievements(null, makeStats({ gamesPlayed: 1 }));
        expect(result).toContain('first_blood');
    });

    it('first_blood: does not trigger if already earned', () => {
        const result = checkAchievements(
            null,
            makeStats({ gamesPlayed: 2, achievements: ['first_blood'] })
        );
        expect(result).not.toContain('first_blood');
    });

    it('survivor: triggers on gamesWon >= 1', () => {
        const result = checkAchievements(null, makeStats({ gamesWon: 1 }));
        expect(result).toContain('survivor');
    });

    it('budget_hawk: triggers on victory with budget >= 80000', () => {
        const state = makeState({ phase: 'victory', budget: 90000 });
        const result = checkAchievements(state, makeStats());
        expect(result).toContain('budget_hawk');
    });

    it('budget_hawk: does not trigger on autopsy', () => {
        const state = makeState({ phase: 'autopsy', budget: 90000 });
        const result = checkAchievements(state, makeStats());
        expect(result).not.toContain('budget_hawk');
    });

    it('doom_dancer: triggers on victory with doomLevel >= 70', () => {
        const state = makeState({ phase: 'victory', doomLevel: 75 });
        const result = checkAchievements(state, makeStats());
        expect(result).toContain('doom_dancer');
    });

    it('clean_slate: triggers on victory with doomLevel <= 10', () => {
        const state = makeState({ phase: 'victory', doomLevel: 5 });
        const result = checkAchievements(state, makeStats());
        expect(result).toContain('clean_slate');
    });

    it('veteran: triggers on gamesPlayed >= 10', () => {
        const result = checkAchievements(null, makeStats({ gamesPlayed: 10 }));
        expect(result).toContain('veteran');
    });

    it('undefeated: triggers when gamesWon >= 5 and all wins', () => {
        const result = checkAchievements(null, makeStats({ gamesPlayed: 5, gamesWon: 5 }));
        expect(result).toContain('undefeated');
    });

    it('undefeated: does not trigger if any losses', () => {
        const result = checkAchievements(null, makeStats({ gamesPlayed: 6, gamesWon: 5 }));
        expect(result).not.toContain('undefeated');
    });

    it('speed_run: triggers on victory with <= 3 history entries', () => {
        const state = makeState({
            phase: 'victory',
            history: [
                { month: 10, eventId: 'e1', choiceId: 'c1', doomIncrease: 5, cost: 100 },
                { month: 20, eventId: 'e2', choiceId: 'c2', doomIncrease: 5, cost: 100 }
            ]
        });
        const result = checkAchievements(state, makeStats());
        expect(result).toContain('speed_run');
    });

    it('crisis_veteran: triggers with >= 10 history entries', () => {
        const history = Array.from({ length: 10 }, (_, i) => ({
            month: i * 5,
            eventId: `e${i}`,
            choiceId: `c${i}`,
            doomIncrease: 3,
            cost: 50
        }));
        const state = makeState({ history });
        const result = checkAchievements(state, makeStats());
        expect(result).toContain('crisis_veteran');
    });

    it('all_devices: triggers with 7+ unique devices in run history', () => {
        const runHistory = Array.from({ length: 7 }, (_, i) => ({
            date: new Date().toISOString(),
            deviceId: `dev-${i}`,
            deviceName: `Device ${i}`,
            months: 60,
            outcome: 'Victory' as const
        }));
        const result = checkAchievements(null, makeStats({ runHistory }));
        expect(result).toContain('all_devices');
    });

    it('getAchievementDef returns correct definition', () => {
        const def = getAchievementDef('first_blood');
        expect(def).toBeDefined();
        expect(def?.id).toBe('first_blood');
    });

    it('all achievements have unique IDs', () => {
        const ids = ACHIEVEMENTS.map(a => a.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
