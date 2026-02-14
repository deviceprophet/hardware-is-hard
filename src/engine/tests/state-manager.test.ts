import { describe, it, expect } from 'vitest';
import {
    createInitialState,
    createSnapshot,
    canTransitionPhase,
    analyzeDeathCause,
    restoreState
} from '../state-manager';
import type { InternalState } from '../state-manager';
import {
    INITIAL_BUDGET,
    INITIAL_DOOM,
    INITIAL_MONTH,
    INITIAL_COMPLIANCE,
    NO_LAST_EVENT,
    DEFAULT_CONFIG,
    PROBLEM_TAGS
} from '../constants';
import type { HistoryEntry, GameConfig, DeathAnalysis } from '../types';
import { createMockDevice, createMockEvent } from './factories';

/** Helper: creates a base state from createInitialState() with field overrides. */
function createTestState(overrides: Partial<InternalState> = {}): InternalState {
    return { ...createInitialState(), ...overrides };
}

// ============================================================================
// createInitialState
// ============================================================================

describe('createInitialState', () => {
    it('returns correct scalar defaults', () => {
        const state = createInitialState();
        expect(state.phase).toBe('splash');
        expect(state.budget).toBe(INITIAL_BUDGET);
        expect(state.doomLevel).toBe(INITIAL_DOOM);
        expect(state.timelineMonth).toBe(INITIAL_MONTH);
        expect(state.lastEventMonth).toBe(NO_LAST_EVENT);
        expect(state.isPaused).toBe(false);
        expect(state.complianceLevel).toBe(INITIAL_COMPLIANCE);
        expect(state.fundingLevel).toBe('full');
    });

    it('returns empty arrays for collection fields', () => {
        const state = createInitialState();
        expect(state.activeTags).toEqual([]);
        expect(state.history).toEqual([]);
        expect(state.shieldDeflections).toEqual([]);
        expect(state.availableDevices).toEqual([]);
    });

    it('returns null for optional object fields', () => {
        const state = createInitialState();
        expect(state.selectedDevice).toBeNull();
        expect(state.currentCrisis).toBeNull();
    });
});

// ============================================================================
// createSnapshot
// ============================================================================

describe('createSnapshot', () => {
    it('creates independent copies of array fields', () => {
        const state = createTestState({
            activeTags: ['tag_a', 'tag_b'],
            history: [{ month: 1, eventId: 'e1', choiceId: 'c1', doomIncrease: 5, cost: 100 }],
            shieldDeflections: [{ month: 2, eventId: 'e2', blockedByTag: 'shield' }],
            availableDevices: [createMockDevice()]
        });

        const snapshot = createSnapshot(state);

        // Mutating snapshot arrays must not affect source
        (snapshot.activeTags as string[]).push('injected');
        (snapshot.history as HistoryEntry[]).push({
            month: 99,
            eventId: 'x',
            choiceId: 'x',
            doomIncrease: 0,
            cost: 0
        });

        expect(state.activeTags).toHaveLength(2);
        expect(state.history).toHaveLength(1);
    });

    it('copies selectedDevice as a new object', () => {
        const device = createMockDevice({ id: 'dev-1' });
        const state = createTestState({ selectedDevice: device });

        const snapshot = createSnapshot(state);

        expect(snapshot.selectedDevice).toEqual(device);
        expect(snapshot.selectedDevice).not.toBe(state.selectedDevice);
    });

    it('copies currentCrisis as a new object', () => {
        const crisis = createMockEvent({ id: 'crisis-1' });
        const state = createTestState({ currentCrisis: crisis });

        const snapshot = createSnapshot(state);

        expect(snapshot.currentCrisis).toEqual(crisis);
        expect(snapshot.currentCrisis).not.toBe(state.currentCrisis);
    });

    it('handles null selectedDevice', () => {
        const state = createTestState({ selectedDevice: null });
        const snapshot = createSnapshot(state);
        expect(snapshot.selectedDevice).toBeNull();
    });

    it('handles null currentCrisis', () => {
        const state = createTestState({ currentCrisis: null });
        const snapshot = createSnapshot(state);
        expect(snapshot.currentCrisis).toBeNull();
    });

    it('passes deathAnalysis through to snapshot', () => {
        const state = createTestState();
        const analysis: DeathAnalysis = {
            cause: 'doom_overflow',
            primaryTag: 'bad_flash',
            worstChoice: null,
            totalDoomFromChoices: 50,
            totalSpent: 1000,
            finalComplianceLevel: 80
        };

        const snapshot = createSnapshot(state, analysis);
        expect(snapshot.deathAnalysis).toBe(analysis);
    });

    it('defaults deathAnalysis to null when not provided', () => {
        const state = createTestState();
        const snapshot = createSnapshot(state);
        expect(snapshot.deathAnalysis).toBeNull();
    });
});

// ============================================================================
// canTransitionPhase
// ============================================================================

describe('canTransitionPhase', () => {
    it('allows splash → setup', () => {
        expect(canTransitionPhase('splash', 'setup')).toBe(true);
    });

    it('allows setup → simulation', () => {
        expect(canTransitionPhase('setup', 'simulation')).toBe(true);
    });

    it('allows setup → splash (back)', () => {
        expect(canTransitionPhase('setup', 'splash')).toBe(true);
    });

    it('allows simulation → crisis', () => {
        expect(canTransitionPhase('simulation', 'crisis')).toBe(true);
    });

    it('allows simulation → autopsy', () => {
        expect(canTransitionPhase('simulation', 'autopsy')).toBe(true);
    });

    it('allows simulation → victory', () => {
        expect(canTransitionPhase('simulation', 'victory')).toBe(true);
    });

    it('allows crisis → simulation', () => {
        expect(canTransitionPhase('crisis', 'simulation')).toBe(true);
    });

    it('allows crisis → autopsy', () => {
        expect(canTransitionPhase('crisis', 'autopsy')).toBe(true);
    });

    it('allows autopsy → splash', () => {
        expect(canTransitionPhase('autopsy', 'splash')).toBe(true);
    });

    it('allows victory → splash', () => {
        expect(canTransitionPhase('victory', 'splash')).toBe(true);
    });

    it('allows shared_result → setup', () => {
        expect(canTransitionPhase('shared_result', 'setup')).toBe(true);
    });

    it('allows shared_result → splash', () => {
        expect(canTransitionPhase('shared_result', 'splash')).toBe(true);
    });

    it('rejects splash → crisis (invalid)', () => {
        expect(canTransitionPhase('splash', 'crisis')).toBe(false);
    });

    it('rejects splash → simulation (invalid)', () => {
        expect(canTransitionPhase('splash', 'simulation')).toBe(false);
    });

    it('rejects crisis → victory (invalid)', () => {
        expect(canTransitionPhase('crisis', 'victory')).toBe(false);
    });

    it('rejects autopsy → simulation (invalid)', () => {
        expect(canTransitionPhase('autopsy', 'simulation')).toBe(false);
    });

    it('rejects victory → simulation (invalid)', () => {
        expect(canTransitionPhase('victory', 'simulation')).toBe(false);
    });
});

// ============================================================================
// analyzeDeathCause
// ============================================================================

describe('analyzeDeathCause', () => {
    const config: GameConfig = { ...DEFAULT_CONFIG, maxDoom: 100, totalMonths: 60 };

    describe('cause determination', () => {
        it('returns doom_overflow when doomLevel >= maxDoom', () => {
            const state = createTestState({ doomLevel: 100, timelineMonth: 30 });
            const result = analyzeDeathCause(state, config);
            expect(result.cause).toBe('doom_overflow');
        });

        it('returns doom_overflow when doomLevel exceeds maxDoom', () => {
            const state = createTestState({ doomLevel: 150, timelineMonth: 30 });
            const result = analyzeDeathCause(state, config);
            expect(result.cause).toBe('doom_overflow');
        });

        it('returns survived when doomLevel < maxDoom AND timelineMonth >= totalMonths', () => {
            const state = createTestState({ doomLevel: 50, timelineMonth: 60 });
            const result = analyzeDeathCause(state, config);
            expect(result.cause).toBe('survived');
        });

        it('returns survived when timelineMonth exceeds totalMonths', () => {
            const state = createTestState({ doomLevel: 50, timelineMonth: 65 });
            const result = analyzeDeathCause(state, config);
            expect(result.cause).toBe('survived');
        });

        it('returns doom_overflow when doomLevel >= maxDoom even if month >= totalMonths', () => {
            // Both conditions: doom at max AND month reached — doom takes priority
            const state = createTestState({ doomLevel: 100, timelineMonth: 60 });
            const result = analyzeDeathCause(state, config);
            expect(result.cause).toBe('doom_overflow');
        });

        it('returns doom_overflow when doomLevel >= maxDoom and month < totalMonths', () => {
            const state = createTestState({ doomLevel: 100, timelineMonth: 10 });
            const result = analyzeDeathCause(state, config);
            expect(result.cause).toBe('doom_overflow');
        });

        it('returns doom_overflow when doomLevel is exactly maxDoom', () => {
            // boundary: doomLevel === maxDoom (not strictly >) still triggers doom_overflow
            // because the condition for survived requires doomLevel < maxDoom
            const state = createTestState({ doomLevel: 100, timelineMonth: 60 });
            const result = analyzeDeathCause(state, config);
            expect(result.cause).toBe('doom_overflow');
        });

        it('returns doom_overflow for mid-game doom (month not reached)', () => {
            const state = createTestState({ doomLevel: 100, timelineMonth: 0 });
            const result = analyzeDeathCause(state, config);
            expect(result.cause).toBe('doom_overflow');
        });

        it('returns doom_overflow when doomLevel < maxDoom and month < totalMonths', () => {
            // Default path: doom not reached, month not reached → doom_overflow (default)
            const state = createTestState({ doomLevel: 50, timelineMonth: 30 });
            const result = analyzeDeathCause(state, config);
            expect(result.cause).toBe('doom_overflow');
        });
    });

    describe('worstChoice selection', () => {
        it('picks the history entry with the highest doomIncrease', () => {
            const history: HistoryEntry[] = [
                { month: 1, eventId: 'e1', choiceId: 'c1', doomIncrease: 5, cost: 100 },
                { month: 2, eventId: 'e2', choiceId: 'c2', doomIncrease: 20, cost: 200 },
                { month: 3, eventId: 'e3', choiceId: 'c3', doomIncrease: 10, cost: 300 }
            ];
            const state = createTestState({ history, doomLevel: 100 });
            const result = analyzeDeathCause(state, config);
            expect(result.worstChoice).toEqual(history[1]);
        });

        it('returns null when history is empty', () => {
            const state = createTestState({ history: [], doomLevel: 100 });
            const result = analyzeDeathCause(state, config);
            expect(result.worstChoice).toBeNull();
        });

        it('does not select an entry with doomIncrease of 0', () => {
            const history: HistoryEntry[] = [
                { month: 1, eventId: 'e1', choiceId: 'c1', doomIncrease: 0, cost: 500 }
            ];
            const state = createTestState({ history, doomLevel: 100 });
            const result = analyzeDeathCause(state, config);
            expect(result.worstChoice).toBeNull();
        });

        it('selects entry with doomIncrease of 1 (> 0 threshold)', () => {
            const history: HistoryEntry[] = [
                { month: 1, eventId: 'e1', choiceId: 'c1', doomIncrease: 1, cost: 100 }
            ];
            const state = createTestState({ history, doomLevel: 100 });
            const result = analyzeDeathCause(state, config);
            expect(result.worstChoice).toEqual(history[0]);
        });

        it('picks first when multiple entries tie for highest doomIncrease', () => {
            const history: HistoryEntry[] = [
                { month: 1, eventId: 'e1', choiceId: 'c1', doomIncrease: 10, cost: 100 },
                { month: 2, eventId: 'e2', choiceId: 'c2', doomIncrease: 10, cost: 200 }
            ];
            const state = createTestState({ history, doomLevel: 100 });
            const result = analyzeDeathCause(state, config);
            // First entry wins because > comparison (not >=) won't replace an equal
            expect(result.worstChoice).toEqual(history[0]);
        });
    });

    describe('totalDoomFromChoices', () => {
        it('sums doomIncrease across all history entries', () => {
            const history: HistoryEntry[] = [
                { month: 1, eventId: 'e1', choiceId: 'c1', doomIncrease: 5, cost: 100 },
                { month: 2, eventId: 'e2', choiceId: 'c2', doomIncrease: 15, cost: 200 },
                { month: 3, eventId: 'e3', choiceId: 'c3', doomIncrease: 10, cost: 300 }
            ];
            const state = createTestState({ history, doomLevel: 100 });
            const result = analyzeDeathCause(state, config);
            expect(result.totalDoomFromChoices).toBe(30);
        });

        it('returns 0 when history is empty', () => {
            const state = createTestState({ history: [], doomLevel: 100 });
            const result = analyzeDeathCause(state, config);
            expect(result.totalDoomFromChoices).toBe(0);
        });

        it('handles single entry', () => {
            const history: HistoryEntry[] = [
                { month: 1, eventId: 'e1', choiceId: 'c1', doomIncrease: 42, cost: 100 }
            ];
            const state = createTestState({ history, doomLevel: 100 });
            const result = analyzeDeathCause(state, config);
            expect(result.totalDoomFromChoices).toBe(42);
        });
    });

    describe('totalSpent', () => {
        it('sums cost across all history entries', () => {
            const history: HistoryEntry[] = [
                { month: 1, eventId: 'e1', choiceId: 'c1', doomIncrease: 0, cost: 1000 },
                { month: 2, eventId: 'e2', choiceId: 'c2', doomIncrease: 0, cost: 2500 },
                { month: 3, eventId: 'e3', choiceId: 'c3', doomIncrease: 0, cost: 500 }
            ];
            const state = createTestState({ history, doomLevel: 100 });
            const result = analyzeDeathCause(state, config);
            expect(result.totalSpent).toBe(4000);
        });

        it('returns 0 when history is empty', () => {
            const state = createTestState({ history: [], doomLevel: 100 });
            const result = analyzeDeathCause(state, config);
            expect(result.totalSpent).toBe(0);
        });
    });

    describe('problemTags filtering', () => {
        it('filters activeTags to only include PROBLEM_TAGS members', () => {
            const state = createTestState({
                activeTags: ['bad_flash', 'some_random_tag', 'tech_debt', 'other'],
                doomLevel: 100
            });
            const result = analyzeDeathCause(state, config);
            // Only bad_flash and tech_debt are in PROBLEM_TAGS
            expect(result.primaryTag).toBe('bad_flash');
        });

        it('returns null primaryTag when no problem tags present', () => {
            const state = createTestState({
                activeTags: ['safe_tag', 'another_tag'],
                doomLevel: 100
            });
            const result = analyzeDeathCause(state, config);
            expect(result.primaryTag).toBeNull();
        });

        it('returns null primaryTag when activeTags is empty', () => {
            const state = createTestState({
                activeTags: [],
                doomLevel: 100
            });
            const result = analyzeDeathCause(state, config);
            expect(result.primaryTag).toBeNull();
        });

        it('returns first problem tag when multiple are present', () => {
            const state = createTestState({
                activeTags: ['no_encryption', 'fake_ai', 'data_loss'],
                doomLevel: 100
            });
            const result = analyzeDeathCause(state, config);
            expect(result.primaryTag).toBe('no_encryption');
        });

        it('recognizes each individual PROBLEM_TAG', () => {
            for (const tag of PROBLEM_TAGS) {
                const state = createTestState({
                    activeTags: [tag],
                    doomLevel: 100
                });
                const result = analyzeDeathCause(state, config);
                expect(result.primaryTag).toBe(tag);
            }
        });
    });

    describe('finalComplianceLevel', () => {
        it('includes complianceLevel from state', () => {
            const state = createTestState({ complianceLevel: 42, doomLevel: 100 });
            const result = analyzeDeathCause(state, config);
            expect(result.finalComplianceLevel).toBe(42);
        });
    });
});

// ============================================================================
// restoreState
// ============================================================================

describe('restoreState', () => {
    it('restores all scalar fields from saved state', () => {
        const current = createTestState();
        const saved = {
            phase: 'simulation' as const,
            budget: 50000,
            doomLevel: 30,
            timelineMonth: 24,
            lastEventMonth: 18,
            isPaused: true,
            complianceLevel: 75,
            fundingLevel: 'partial' as const
        };

        const restored = restoreState(current, saved);

        expect(restored.phase).toBe('simulation');
        expect(restored.budget).toBe(50000);
        expect(restored.doomLevel).toBe(30);
        expect(restored.timelineMonth).toBe(24);
        expect(restored.lastEventMonth).toBe(18);
        expect(restored.isPaused).toBe(true);
        expect(restored.complianceLevel).toBe(75);
        expect(restored.fundingLevel).toBe('partial');
    });

    it('falls back to current state for missing (undefined) fields', () => {
        const device = createMockDevice({ id: 'kept-device' });
        const current = createTestState({
            phase: 'crisis',
            budget: 80000,
            doomLevel: 20,
            selectedDevice: device,
            complianceLevel: 90
        });

        // saved has only budget
        const saved = { budget: 1234 };
        const restored = restoreState(current, saved);

        expect(restored.budget).toBe(1234);
        expect(restored.phase).toBe('crisis');
        expect(restored.doomLevel).toBe(20);
        expect(restored.selectedDevice).toBe(device);
        expect(restored.complianceLevel).toBe(90);
    });

    it('handles saved.budget = 0 correctly (uses 0, not fallback)', () => {
        const current = createTestState({ budget: 50000 });
        const saved = { budget: 0 };
        const restored = restoreState(current, saved);
        expect(restored.budget).toBe(0);
    });

    it('handles saved.doomLevel = 0 correctly (uses 0, not fallback)', () => {
        const current = createTestState({ doomLevel: 50 });
        const saved = { doomLevel: 0 };
        const restored = restoreState(current, saved);
        expect(restored.doomLevel).toBe(0);
    });

    it('handles saved.timelineMonth = 0 correctly (uses 0, not fallback)', () => {
        const current = createTestState({ timelineMonth: 30 });
        const saved = { timelineMonth: 0 };
        const restored = restoreState(current, saved);
        expect(restored.timelineMonth).toBe(0);
    });

    it('handles saved.complianceLevel = 0 correctly (uses 0, not fallback)', () => {
        const current = createTestState({ complianceLevel: 80 });
        const saved = { complianceLevel: 0 };
        const restored = restoreState(current, saved);
        expect(restored.complianceLevel).toBe(0);
    });

    it('handles saved.lastEventMonth = 0 correctly (uses 0, not fallback)', () => {
        const current = createTestState({ lastEventMonth: 12 });
        const saved = { lastEventMonth: 0 };
        const restored = restoreState(current, saved);
        expect(restored.lastEventMonth).toBe(0);
    });

    it('handles saved.isPaused = false correctly (uses false, not fallback)', () => {
        const current = createTestState({ isPaused: true });
        const saved = { isPaused: false };
        const restored = restoreState(current, saved);
        expect(restored.isPaused).toBe(false);
    });

    it('copies saved.activeTags as new array (spread)', () => {
        const savedTags = ['tag_x', 'tag_y'];
        const current = createTestState({ activeTags: ['old'] });
        const saved = { activeTags: savedTags };
        const restored = restoreState(current, saved);

        expect(restored.activeTags).toEqual(['tag_x', 'tag_y']);
        expect(restored.activeTags).not.toBe(savedTags);
    });

    it('falls back to current.activeTags when saved has no activeTags', () => {
        const currentTags = ['existing_tag'];
        const current = createTestState({ activeTags: currentTags });
        const saved = {};
        const restored = restoreState(current, saved);

        expect(restored.activeTags).toBe(currentTags);
    });

    it('preserves empty arrays from saved (not fall back)', () => {
        const current = createTestState({ activeTags: ['has_stuff'] });
        const saved = { activeTags: [] as string[] };
        const restored = restoreState(current, saved);

        expect(restored.activeTags).toEqual([]);
        expect(restored.activeTags).not.toBe(current.activeTags);
    });

    it('copies saved.history as new array', () => {
        const savedHistory: HistoryEntry[] = [
            { month: 1, eventId: 'e1', choiceId: 'c1', doomIncrease: 5, cost: 100 }
        ];
        const current = createTestState();
        const saved = { history: savedHistory };
        const restored = restoreState(current, saved);

        expect(restored.history).toEqual(savedHistory);
        expect(restored.history).not.toBe(savedHistory);
    });

    it('falls back to current.history when saved has no history', () => {
        const currentHistory: HistoryEntry[] = [
            { month: 1, eventId: 'e1', choiceId: 'c1', doomIncrease: 5, cost: 100 }
        ];
        const current = createTestState({ history: currentHistory });
        const saved = {};
        const restored = restoreState(current, saved);

        expect(restored.history).toBe(currentHistory);
    });

    it('preserves empty history array from saved', () => {
        const current = createTestState({
            history: [{ month: 1, eventId: 'e1', choiceId: 'c1', doomIncrease: 5, cost: 100 }]
        });
        const saved = { history: [] as HistoryEntry[] };
        const restored = restoreState(current, saved);

        expect(restored.history).toEqual([]);
    });

    it('copies saved.shieldDeflections as new array', () => {
        const savedDeflections = [{ month: 5, eventId: 'e1', blockedByTag: 'shield' }];
        const current = createTestState();
        const saved = { shieldDeflections: savedDeflections };
        const restored = restoreState(current, saved);

        expect(restored.shieldDeflections).toEqual(savedDeflections);
        expect(restored.shieldDeflections).not.toBe(savedDeflections);
    });

    it('falls back to current.shieldDeflections when not in saved', () => {
        const currentDeflections = [{ month: 5, eventId: 'e1', blockedByTag: 'shield' }];
        const current = createTestState({ shieldDeflections: currentDeflections });
        const saved = {};
        const restored = restoreState(current, saved);

        expect(restored.shieldDeflections).toBe(currentDeflections);
    });

    it('copies saved.availableDevices as new array', () => {
        const devices = [createMockDevice({ id: 'dev-1' })];
        const current = createTestState();
        const saved = { availableDevices: devices };
        const restored = restoreState(current, saved);

        expect(restored.availableDevices).toEqual(devices);
        expect(restored.availableDevices).not.toBe(devices);
    });

    it('falls back to current.availableDevices when not in saved', () => {
        const currentDevices = [createMockDevice({ id: 'dev-1' })];
        const current = createTestState({ availableDevices: currentDevices });
        const saved = {};
        const restored = restoreState(current, saved);

        expect(restored.availableDevices).toBe(currentDevices);
    });

    it('preserves empty availableDevices from saved', () => {
        const current = createTestState({
            availableDevices: [createMockDevice()]
        });
        const saved = { availableDevices: [] as never[] };
        const restored = restoreState(current, saved);

        expect(restored.availableDevices).toEqual([]);
    });

    it('restores selectedDevice from saved', () => {
        const device = createMockDevice({ id: 'restored-dev' });
        const current = createTestState({ selectedDevice: null });
        const saved = { selectedDevice: device };
        const restored = restoreState(current, saved);

        expect(restored.selectedDevice).toBe(device);
    });

    it('restores currentCrisis from saved', () => {
        const crisis = createMockEvent({ id: 'restored-crisis' });
        const current = createTestState({ currentCrisis: null });
        const saved = { currentCrisis: crisis };
        const restored = restoreState(current, saved);

        expect(restored.currentCrisis).toBe(crisis);
    });

    it('falls back to current selectedDevice when saved is null (null is nullish for ??)', () => {
        const device = createMockDevice({ id: 'current-dev' });
        const current = createTestState({ selectedDevice: device });
        // ?? treats null as nullish, so it falls back to current
        const saved = { selectedDevice: null };
        const restored = restoreState(current, saved);

        expect(restored.selectedDevice).toBe(device);
    });
});
