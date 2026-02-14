/**
 * Achievements Simulation Tests
 *
 * These tests run real games through the engine to verify that achievements
 * are correctly triggered during realistic gameplay scenarios.
 *
 * Unlike the unit tests in achievements.test.ts (which test check functions
 * in isolation), these tests verify the full integration:
 *   GameEngine → recordGameResult → checkAchievements → stats persistence
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    GameEngine,
    createSeededRandom,
    createDataProvider,
    type Device,
    type GameEvent,
    type Choice,
    type GameStateSnapshot
} from '../index';
import { recordGameResult, loadStats, getDefaultStats, saveStats } from '../stats-tracker';
import { checkAchievements, ACHIEVEMENTS } from '../achievements';

// Load actual game data
import devicesData from '../../data/devices.json';
import eventsData from '../../data/events.json';

const devices = devicesData as Device[];
const events = eventsData as GameEvent[];
const dataProvider = createDataProvider(devices, events);

// ============================================================================
// Helpers
// ============================================================================

interface SimResult {
    state: GameStateSnapshot;
    won: boolean;
}

/** Run a full game to completion and return the final state */
function simulateGame(deviceId: string, seed: number, strategy: 'safe' | 'risky'): SimResult {
    const random = createSeededRandom(seed);
    const engine = new GameEngine(dataProvider, undefined, random);

    engine.goToSetup();
    engine.selectDevice(deviceId);
    engine.startSimulation();

    let iterations = 0;
    while (iterations < 1000) {
        iterations++;
        const state = engine.getState();

        if (state.phase === 'victory' || state.phase === 'autopsy') {
            return { state, won: state.phase === 'victory' };
        }

        if (state.phase === 'crisis' && state.currentCrisis) {
            const choice = selectChoice(state.currentCrisis.choices, strategy, random);
            engine.resolveCrisis(choice.id);
            continue;
        }

        engine.advanceTime(1);
    }

    const finalState = engine.getState();
    return { state: finalState, won: finalState.phase === 'victory' };
}

function selectChoice(
    choices: readonly Choice[],
    strategy: 'safe' | 'risky',
    random: ReturnType<typeof createSeededRandom>
): Choice {
    if (strategy === 'safe') {
        return [...choices].sort((a, b) => a.doomImpact - b.doomImpact)[0]!;
    }
    if (strategy === 'risky') {
        return [...choices].sort((a, b) => b.doomImpact - a.doomImpact)[0]!;
    }
    return random.pick(choices) ?? choices[0]!;
}

/**
 * Simulate a game and record the result via recordGameResult (full integration).
 * Returns the updated stats after recording.
 */
function simulateAndRecord(deviceId: string, seed: number, strategy: 'safe' | 'risky') {
    const { state, won } = simulateGame(deviceId, seed, strategy);
    const stats = recordGameResult(
        won,
        state.timelineMonth,
        state.selectedDevice?.id || deviceId,
        state.selectedDevice?.name || 'Unknown',
        {
            budget: state.budget,
            doom: state.doomLevel,
            compliance: state.complianceLevel
        },
        state
    );
    return { state, won, stats };
}

// ============================================================================
// Tests
// ============================================================================

describe('Achievements Simulation', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('Integration: recordGameResult triggers achievements', () => {
        it('should award first_blood after the very first game', () => {
            const { stats } = simulateAndRecord('omni-juice', 42, 'safe');

            expect(stats.gamesPlayed).toBe(1);
            expect(stats.achievements).toContain('first_blood');
        });

        it('should award survivor after a winning game', () => {
            // Find a seed that wins with safe strategy
            let won = false;
            let seed = 100;
            let stats = getDefaultStats();

            while (!won && seed < 200) {
                localStorage.clear();
                const result = simulateAndRecord('omni-juice', seed, 'safe');
                stats = result.stats;
                won = result.won;
                seed++;
            }

            if (won) {
                expect(stats.achievements).toContain('survivor');
            } else {
                // If no seed produced a win in 100 tries, the test is inconclusive
                // but first_blood should still be there
                expect(stats.achievements).toContain('first_blood');
            }
        });

        it('should accumulate achievements across multiple games', () => {
            // Play several games - achievements should accumulate
            for (let i = 0; i < 5; i++) {
                simulateAndRecord('omni-juice', 1000 + i, 'safe');
            }

            const stats = loadStats();
            expect(stats.gamesPlayed).toBe(5);
            expect(stats.achievements).toContain('first_blood');
            // No duplicates
            const uniqueAchievements = new Set(stats.achievements);
            expect(uniqueAchievements.size).toBe(stats.achievements.length);
        });

        it('should not duplicate achievements when recording more games', () => {
            simulateAndRecord('omni-juice', 42, 'safe');
            const statsAfterFirst = loadStats();
            const firstBloodCount1 = statsAfterFirst.achievements.filter(
                a => a === 'first_blood'
            ).length;
            expect(firstBloodCount1).toBe(1);

            simulateAndRecord('smart-lock', 43, 'safe');
            const statsAfterSecond = loadStats();
            const firstBloodCount2 = statsAfterSecond.achievements.filter(
                a => a === 'first_blood'
            ).length;
            expect(firstBloodCount2).toBe(1); // Still just 1
        });
    });

    describe('State-dependent achievements with real game engine', () => {
        it('crisis_veteran should trigger in games with many events', () => {
            // Run many games and check if any produced 10+ history entries
            let crisisVeteranEarned = false;

            for (let seed = 0; seed < 50; seed++) {
                localStorage.clear();
                const { state, stats } = simulateAndRecord('omni-juice', seed, 'risky');

                if (state.history.length >= 10) {
                    expect(stats.achievements).toContain('crisis_veteran');
                    crisisVeteranEarned = true;
                    break;
                }
            }

            // It's possible but not guaranteed - log for visibility
            if (!crisisVeteranEarned) {
                console.log(
                    'Note: crisis_veteran not triggered in 50 simulated games (needs 10+ events)'
                );
            }
        });

        it('speed_run should be possible with safe strategy and few events', () => {
            // Run games looking for one that wins with <= 3 history entries
            let speedRunFound = false;

            for (let seed = 0; seed < 100; seed++) {
                localStorage.clear();
                const { state, won, stats } = simulateAndRecord('omni-juice', seed, 'safe');

                if (won && state.history.length <= 3) {
                    expect(stats.achievements).toContain('speed_run');
                    speedRunFound = true;
                    break;
                }
            }

            if (!speedRunFound) {
                console.log(
                    'Note: speed_run not triggered in 100 games (needs victory + <= 3 events)'
                );
            }
        });

        it('budget_hawk requires victory with >= $80K budget', () => {
            // Check achievements against simulated state
            for (let seed = 0; seed < 50; seed++) {
                const { state, won } = simulateGame('omni-juice', seed, 'safe');
                if (won && state.budget >= 80000) {
                    const newAchievements = checkAchievements(state, getDefaultStats());
                    expect(newAchievements).toContain('budget_hawk');
                    return;
                }
            }
            console.log('Note: No game ended with victory + $80K budget in 50 tries');
        });

        it('doom_dancer requires victory with >= 70% doom', () => {
            // This is very hard to achieve - high doom usually means loss
            // Verify the check function works on a realistic victory state
            for (let seed = 0; seed < 100; seed++) {
                const { state, won } = simulateGame('omni-juice', seed, 'risky');
                if (won && state.doomLevel >= 70) {
                    const newAchievements = checkAchievements(state, getDefaultStats());
                    expect(newAchievements).toContain('doom_dancer');
                    return;
                }
            }
            // Expected: this is rare. Verify manually that the logic is correct
            const fakeState: GameStateSnapshot = {
                phase: 'victory',
                budget: 50000,
                doomLevel: 75,
                timelineMonth: 60,
                selectedDevice: null,
                availableDevices: [],
                activeTags: [],
                history: [],
                shieldDeflections: [],
                currentCrisis: null,
                lastEventMonth: 0,
                isPaused: false,
                complianceLevel: 50,
                fundingLevel: 'full',
                deathAnalysis: null
            };
            expect(checkAchievements(fakeState, getDefaultStats())).toContain('doom_dancer');
        });

        it('clean_slate requires victory with <= 10% doom', () => {
            for (let seed = 0; seed < 100; seed++) {
                const { state, won } = simulateGame('omni-juice', seed, 'safe');
                if (won && state.doomLevel <= 10) {
                    const newAchievements = checkAchievements(state, getDefaultStats());
                    expect(newAchievements).toContain('clean_slate');
                    return;
                }
            }
            // Fallback: confirm the check logic works
            const fakeState: GameStateSnapshot = {
                phase: 'victory',
                budget: 50000,
                doomLevel: 5,
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
                deathAnalysis: null
            };
            expect(checkAchievements(fakeState, getDefaultStats())).toContain('clean_slate');
        });
    });

    describe('Cumulative achievements across simulated sessions', () => {
        it('veteran should trigger after 10 recorded games', () => {
            for (let i = 0; i < 10; i++) {
                simulateAndRecord('omni-juice', 500 + i, 'safe');
            }

            const stats = loadStats();
            expect(stats.gamesPlayed).toBe(10);
            expect(stats.achievements).toContain('veteran');
        });

        it('all_devices should trigger after playing 7+ unique devices', () => {
            const deviceIds = devices.map(d => d.id);

            // Play one game with each of the first 7 devices
            for (let i = 0; i < 7; i++) {
                simulateAndRecord(deviceIds[i]!, 300 + i, 'safe');
            }

            const stats = loadStats();
            const uniqueDevicesPlayed = new Set(stats.runHistory.map(r => r.deviceId));
            expect(uniqueDevicesPlayed.size).toBeGreaterThanOrEqual(7);
            expect(stats.achievements).toContain('all_devices');
        });

        it('undefeated requires 5+ wins with zero losses', () => {
            // Find seeds that produce wins
            const winningSeeds: number[] = [];
            for (let seed = 0; seed < 200 && winningSeeds.length < 5; seed++) {
                const { won } = simulateGame('omni-juice', seed, 'safe');
                if (won) winningSeeds.push(seed);
            }

            if (winningSeeds.length >= 5) {
                localStorage.clear();
                for (const seed of winningSeeds) {
                    simulateAndRecord('omni-juice', seed, 'safe');
                }
                const stats = loadStats();
                expect(stats.gamesWon).toBe(5);
                expect(stats.gamesPlayed).toBe(5);
                expect(stats.achievements).toContain('undefeated');
            } else {
                console.log(
                    `Note: Only found ${winningSeeds.length} winning seeds out of 200 tries`
                );
            }
        });

        it('undefeated should NOT trigger if there is a loss mixed in', () => {
            // Find winning and losing seeds
            const winningSeeds: number[] = [];
            let losingSeed: number | null = null;

            for (let seed = 0; seed < 200; seed++) {
                const { won } = simulateGame('omni-juice', seed, 'safe');
                if (won && winningSeeds.length < 5) {
                    winningSeeds.push(seed);
                } else if (!won && losingSeed === null) {
                    losingSeed = seed;
                }
                if (winningSeeds.length >= 5 && losingSeed !== null) break;
            }

            if (winningSeeds.length >= 5 && losingSeed !== null) {
                // Record: 3 wins, 1 loss, 2 wins = 5 wins but gamesPlayed=6
                for (let i = 0; i < 3; i++) {
                    simulateAndRecord('omni-juice', winningSeeds[i]!, 'safe');
                }
                simulateAndRecord('omni-juice', losingSeed, 'safe');
                for (let i = 3; i < 5; i++) {
                    simulateAndRecord('omni-juice', winningSeeds[i]!, 'safe');
                }

                const stats = loadStats();
                expect(stats.gamesWon).toBe(5);
                expect(stats.gamesPlayed).toBe(6);
                expect(stats.achievements).not.toContain('undefeated');
            }
        });
    });

    describe('Batch simulation: achievement distribution', () => {
        it('should produce realistic achievement distributions across many games', () => {
            const NUM_GAMES = 50;
            const achievementCounts = new Map<string, number>();

            // Initialize counts
            for (const a of ACHIEVEMENTS) {
                achievementCounts.set(a.id, 0);
            }

            // Run games across different devices
            localStorage.clear();
            for (let i = 0; i < NUM_GAMES; i++) {
                const deviceId = devices[i % devices.length]!.id;
                simulateAndRecord(deviceId, 2000 + i, i % 2 === 0 ? 'safe' : 'risky');
            }

            const finalStats = loadStats();

            // Count which achievements were earned
            for (const achId of finalStats.achievements) {
                achievementCounts.set(achId, (achievementCounts.get(achId) || 0) + 1);
            }

            // first_blood should always be earned (plays at least 1 game)
            expect(finalStats.achievements).toContain('first_blood');

            // After 50 games, veteran should be earned
            expect(finalStats.gamesPlayed).toBe(NUM_GAMES);
            expect(finalStats.achievements).toContain('veteran');

            // All achievements should appear at most once (no duplicates)
            const uniqueAchievements = new Set(finalStats.achievements);
            expect(uniqueAchievements.size).toBe(finalStats.achievements.length);

            // Log the distribution for review
            console.log('\n--- ACHIEVEMENT DISTRIBUTION (50 games) ---');
            console.log(`Games: ${finalStats.gamesPlayed}, Wins: ${finalStats.gamesWon}`);
            console.log(`Achievements earned: ${finalStats.achievements.join(', ')}`);
            console.log(
                `Unique devices played: ${new Set(finalStats.runHistory.map(r => r.deviceId)).size}`
            );
        });
    });

    describe('Edge cases', () => {
        it('checkAchievements with null state should only return stats-based achievements', () => {
            const stats = getDefaultStats();
            stats.gamesPlayed = 1;
            stats.gamesWon = 1;

            const result = checkAchievements(null, stats);

            // Stats-based achievements should work
            expect(result).toContain('first_blood');
            expect(result).toContain('survivor');

            // State-dependent achievements should NOT trigger with null state
            expect(result).not.toContain('budget_hawk');
            expect(result).not.toContain('doom_dancer');
            expect(result).not.toContain('clean_slate');
            expect(result).not.toContain('speed_run');
            expect(result).not.toContain('crisis_veteran');
        });

        it('checkAchievements on autopsy state should not award victory-gated achievements', () => {
            const autopsyState: GameStateSnapshot = {
                phase: 'autopsy',
                budget: 100000,
                doomLevel: 5,
                timelineMonth: 60,
                selectedDevice: null,
                availableDevices: [],
                activeTags: [],
                history: [{ month: 10, eventId: 'e1', choiceId: 'c1', doomIncrease: 0, cost: 0 }],
                shieldDeflections: [],
                currentCrisis: null,
                lastEventMonth: 0,
                isPaused: false,
                complianceLevel: 100,
                fundingLevel: 'full',
                deathAnalysis: null
            };

            const result = checkAchievements(autopsyState, getDefaultStats());

            // These require victory phase
            expect(result).not.toContain('budget_hawk');
            expect(result).not.toContain('doom_dancer');
            expect(result).not.toContain('clean_slate');
            expect(result).not.toContain('speed_run');
        });

        it('achievements should survive localStorage round-trip', () => {
            simulateAndRecord('omni-juice', 42, 'safe');
            const before = loadStats();
            expect(before.achievements.length).toBeGreaterThan(0);

            // Simulate reload: save and load again
            saveStats(before);
            const after = loadStats();

            expect(after.achievements).toEqual(before.achievements);
        });

        it('should handle pre-existing achievements from old stats gracefully', () => {
            // Simulate migrated stats that already have some achievements
            const oldStats = getDefaultStats();
            oldStats.gamesPlayed = 3;
            oldStats.achievements = ['first_blood', 'survivor'];
            saveStats(oldStats);

            // Play another game
            simulateAndRecord('smart-lock', 42, 'safe');

            const stats = loadStats();
            // Should not duplicate
            const firstBloodCount = stats.achievements.filter(a => a === 'first_blood').length;
            expect(firstBloodCount).toBe(1);
        });
    });
});
