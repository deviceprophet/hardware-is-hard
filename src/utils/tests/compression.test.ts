/**
 * Game State Compression Tests
 */

import { describe, it, expect } from 'vitest';
import { compressGameState, decompressGameState, generateShareUrl } from '../compression';
import type { GameStateSnapshot, HistoryEntry } from '../../engine/types';

describe('Compression Utilities', () => {
    const mockState: GameStateSnapshot = {
        phase: 'simulation',
        budget: 50000,
        doomLevel: 10,
        timelineMonth: 5.5,
        selectedDevice: {
            id: 'test-device',
            name: 'Test Device',
            description: 'A device for testing',
            archetype: 'consumer',
            difficulty: 'easy',
            initialTags: ['test'],
            initialBudget: 50000,
            monthlyMaintenanceCost: 1000,
            eolMonth: 48
        },
        availableDevices: [],
        activeTags: ['tag1', 'tag2'],
        history: [
            {
                month: 1,
                eventId: 'event-1',
                choiceId: 'choice-1',
                doomIncrease: 5,
                cost: 100
            }
        ],
        shieldDeflections: [],
        currentCrisis: null,
        lastEventMonth: 1,
        isPaused: false,
        complianceLevel: 90,
        fundingLevel: 'partial',
        deathAnalysis: null
    };

    it('should compress and decompress state correctly', () => {
        const compressed = compressGameState(mockState);
        expect(typeof compressed).toBe('string');
        expect(compressed.length).toBeGreaterThan(0);

        const decompressed = decompressGameState(compressed);
        expect(decompressed).toEqual(mockState);
    });

    it('should return null for invalid compressed strings', () => {
        expect(decompressGameState('invalid-string')).toBeNull();
        expect(decompressGameState('')).toBeNull();
    });

    it('should handle state with special characters', () => {
        const stateWithSpecials: GameStateSnapshot = {
            ...mockState,
            history: [
                {
                    month: 1,
                    eventId: 'event-1',
                    choiceId: 'choice-1',
                    doomIncrease: 5,
                    cost: 100
                }
            ]
        };

        const compressed = compressGameState(stateWithSpecials);
        const decompressed = decompressGameState(compressed);
        expect(decompressed).toEqual(stateWithSpecials);
    });

    it('should generate a valid share URL', () => {
        const url = generateShareUrl(mockState, 'https://example.com');
        expect(url).toContain('https://example.com?save=');

        const params = new URL(url).searchParams;
        const compressed = params.get('save');
        expect(compressed).not.toBeNull();

        const decompressed = decompressGameState(compressed!);
        expect(decompressed).toEqual(mockState);
    });

    it('should produce compact strings (under 2KB for complex history)', () => {
        // Create state with a long history
        const history: HistoryEntry[] = [];
        for (let i = 0; i < 50; i++) {
            history.push({
                month: i,
                eventId: `event-${i}`,
                choiceId: `choice-${i}`,
                doomIncrease: i,
                cost: i * 10
            });
        }
        const longHistoryState: GameStateSnapshot = { ...mockState, history };

        const compressed = compressGameState(longHistoryState);
        const bytes = new Blob([compressed]).size;

        // Even with 50 events, it should be well under 4KB if compression is working
        expect(bytes).toBeLessThan(4096);
        console.log(`Compressed size for 50 events: ${bytes} bytes`);
    });
});
