import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { compressGameState, decompressGameState } from '../compression';
import type { GameStateSnapshot } from '../../engine/types';

// Arbitrary for a minimal but valid GameStateSnapshot
const arbSnapshot: fc.Arbitrary<GameStateSnapshot> = fc.record({
    phase: fc.constantFrom(
        'splash' as const,
        'setup' as const,
        'simulation' as const,
        'crisis' as const,
        'autopsy' as const,
        'victory' as const
    ),
    budget: fc.integer({ min: -100000, max: 500000 }),
    doomLevel: fc.integer({ min: 0, max: 100 }),
    timelineMonth: fc.integer({ min: 0, max: 60 }),
    selectedDevice: fc.constant(null),
    availableDevices: fc.constant([]),
    activeTags: fc.uniqueArray(fc.string({ minLength: 1, maxLength: 20 }), {
        minLength: 0,
        maxLength: 10
    }),
    history: fc.constant([]),
    shieldDeflections: fc.constant([]),
    currentCrisis: fc.constant(null),
    lastEventMonth: fc.integer({ min: 0, max: 60 }),
    isPaused: fc.boolean(),
    complianceLevel: fc.integer({ min: 0, max: 100 }),
    fundingLevel: fc.constantFrom('full' as const, 'partial' as const, 'none' as const),
    deathAnalysis: fc.constant(null)
});

describe('Compression Properties', () => {
    it('should roundtrip: decompress(compress(state)) preserves key fields', () => {
        fc.assert(
            fc.property(arbSnapshot, state => {
                const compressed = compressGameState(state);
                const restored = decompressGameState(compressed);

                expect(restored).not.toBeNull();
                if (!restored) return;

                // Zod validation may add defaults, so check key fields individually
                expect(restored.phase).toBe(state.phase);
                expect(restored.budget).toBe(state.budget);
                expect(restored.doomLevel).toBe(state.doomLevel);
                expect(restored.timelineMonth).toBe(state.timelineMonth);
                expect(restored.isPaused).toBe(state.isPaused);
                expect(restored.complianceLevel).toBe(state.complianceLevel);
                expect(restored.fundingLevel).toBe(state.fundingLevel);
                expect(restored.lastEventMonth).toBe(state.lastEventMonth);
                expect([...restored.activeTags].sort()).toEqual([...state.activeTags].sort());
            })
        );
    });

    it('should produce non-empty compressed strings', () => {
        fc.assert(
            fc.property(arbSnapshot, state => {
                const compressed = compressGameState(state);
                expect(compressed.length).toBeGreaterThan(0);
            })
        );
    });
});
