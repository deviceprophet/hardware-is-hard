import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameEngine, createDataProvider, createSeededRandom } from '../index';
import type { Device, GameEvent, GameCommand } from '../types';
import { createMockDevice, createMockEvent, createMockChoice } from './factories';

// Mock Data for Property Tests
// Mock Data for Property Tests
const mockDevices: Device[] = [
    createMockDevice({
        id: 'dev-1',
        name: 'Device 1',
        description: 'Desc',
        archetype: 'corporate',
        difficulty: 'easy',
        initialTags: ['tagA'],
        initialBudget: 10000,
        monthlyMaintenanceCost: 100,
        eolMonth: 60
    }),
    createMockDevice({
        id: 'dev-2',
        name: 'Device 2',
        description: 'Desc',
        archetype: 'consumer',
        difficulty: 'hard',
        initialTags: ['tagB'],
        initialBudget: 5000,
        monthlyMaintenanceCost: 200,
        eolMonth: 48
    })
];

const mockEvents: GameEvent[] = [
    createMockEvent({
        id: 'evt-1',
        title: 'Event 1',
        description: 'Desc',
        choices: [
            createMockChoice({ id: 'c1', text: 'C1', cost: 100, doomImpact: 5, riskLevel: 'low' }),
            createMockChoice({ id: 'c2', text: 'C2', cost: 0, doomImpact: 10, riskLevel: 'high' })
        ]
    })
];

const dataProvider = createDataProvider(mockDevices, mockEvents);

describe('GameEngine Properties (Fuzzing)', () => {
    it('should maintain state invariants after random command sequences', () => {
        // Model the state machine commands
        const commands = [
            fc.constant({ type: 'INITIALIZE' as const }),
            fc.constant({ type: 'GO_TO_SETUP' as const }),
            fc.record({
                type: fc.constant('SELECT_DEVICE' as const),
                deviceId: fc.constantFrom('dev-1', 'dev-2', 'invalid-dev')
            }),
            fc.constant({ type: 'START_SIMULATION' as const }),
            fc.record({
                type: fc.constant('ADVANCE_TIME' as const),
                deltaMonths: fc.integer({ min: 1, max: 12 })
            }),
            fc.record({
                type: fc.constant('TRIGGER_CRISIS' as const),
                eventId: fc.constantFrom('evt-1', 'invalid-evt')
            }),
            fc.record({
                type: fc.constant('RESOLVE_CRISIS' as const),
                choiceId: fc.constantFrom('c1', 'c2', 'invalid-choice')
            })
        ];

        fc.assert(
            fc.property(fc.array(fc.oneof(...commands), { minLength: 1, maxLength: 50 }), cmds => {
                const engine = new GameEngine(dataProvider, undefined, createSeededRandom(123));

                // Execute commands blindly
                // The engine should handle invalid transitions/commands gracefully (ignore or warn, but not crash)
                // Note: The current engine logs console.warn on invalid transitions, which is fine.
                // We want to ensure it doesn't throw.

                let errorOccurred = false;
                try {
                    cmds.forEach(cmd => {
                        // Some commands require arguments that might not match the current state context
                        // e.g. RESOLVE_CRISIS when no crisis is active.
                        // The engine should handle this safely.
                        // However, some engine methods might expect correct usage.
                        // Let's use dispatch() as it is the public command interface.
                        engine.dispatch(cmd as GameCommand);
                    });
                } catch {
                    errorOccurred = true;
                    // console.error('Crash during property test:', e);
                }

                expect(errorOccurred).toBe(false);

                // Check Invariants
                const state = engine.getState();

                // 1. Doom is finite
                expect(Number.isFinite(state.doomLevel)).toBe(true);

                // 2. Budget is finite
                expect(Number.isFinite(state.budget)).toBe(true);

                // 3. Month is positive finite
                expect(state.timelineMonth).toBeGreaterThanOrEqual(0);

                // 4. If in simulation, device must be selected
                if (state.phase === 'simulation') {
                    expect(state.selectedDevice).not.toBeNull();
                }

                if (state.phase === 'crisis' && !state.currentCrisis) {
                    process.stderr.write(
                        `INVARIANT VIOLATION: Phase=${state.phase}, Crisis=${state.currentCrisis}\n`
                    );
                    process.stderr.write(`Commands: ${JSON.stringify(cmds)}\n`);
                }

                // 5. If in crisis, currentCrisis must be set
                if (state.phase === 'crisis') {
                    expect(state.currentCrisis).not.toBeNull();
                    expect(state.isPaused).toBe(true);
                }
            })
        );
    });

    it('should be deterministic given the same seed and input sequence', () => {
        const commandGen = fc.array(
            fc.oneof(
                fc.constant({ type: 'GO_TO_SETUP' as const }),
                fc.constant({ type: 'SELECT_DEVICE' as const, deviceId: 'dev-1' }),
                fc.constant({ type: 'START_SIMULATION' as const }),
                fc.constant({ type: 'ADVANCE_TIME' as const, deltaMonths: 4 }),
                fc.constant({ type: 'TRIGGER_CRISIS' as const, eventId: 'evt-1' }),
                fc.constant({ type: 'RESOLVE_CRISIS' as const, choiceId: 'c1' })
            ),
            { minLength: 5, maxLength: 20 }
        );

        fc.assert(
            fc.property(commandGen, fc.integer(), (cmds, seed) => {
                const engine1 = new GameEngine(dataProvider, undefined, createSeededRandom(seed));
                const engine2 = new GameEngine(dataProvider, undefined, createSeededRandom(seed));

                cmds.forEach(cmd => {
                    // Try/catch purely to ignore invalid transition errors during fuzzing
                    try {
                        engine1.dispatch(cmd as GameCommand);
                    } catch {}
                    try {
                        engine2.dispatch(cmd as GameCommand);
                    } catch {}
                });

                expect(engine1.getState()).toEqual(engine2.getState());
            })
        );
    });
});
