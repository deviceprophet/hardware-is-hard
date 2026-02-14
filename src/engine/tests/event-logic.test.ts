import { describe, it, expect } from 'vitest';
import { calculateEventProbability } from '../logic/event-logic';
import { EVENT_PROBABILITY, RISKY_TAGS } from '../constants';
import { createMockEvent } from './factories';

describe('calculateEventProbability', () => {
    it('uses DEFAULT_BASE when event has no baseProb', () => {
        const event = createMockEvent();
        const result = calculateEventProbability(event, [], 0);
        expect(result).toBeCloseTo(EVENT_PROBABILITY.DEFAULT_BASE, 10);
    });

    it('uses custom baseProb when provided', () => {
        const event = createMockEvent({ baseProb: 0.5 });
        const result = calculateEventProbability(event, [], 0);
        expect(result).toBeCloseTo(0.5, 10);
    });

    it('adds doom accelerator: doomLevel / DOOM_DIVISOR', () => {
        const event = createMockEvent({ baseProb: 0.1 });
        const result = calculateEventProbability(event, [], 100);
        // 0.1 + 100/500 = 0.1 + 0.2 = 0.3
        expect(result).toBeCloseTo(0.3, 10);
    });

    it('adds nothing when doomLevel is 0', () => {
        const event = createMockEvent({ baseProb: 0.4 });
        const result = calculateEventProbability(event, [], 0);
        expect(result).toBeCloseTo(0.4, 10);
    });

    it('adds RISKY_TAG_BOOST for a single risky tag', () => {
        const event = createMockEvent({ baseProb: 0.1 });
        const result = calculateEventProbability(event, ['bad_flash'], 0);
        // 0.1 + 0.05 = 0.15
        expect(result).toBeCloseTo(0.15, 10);
    });

    it('adds RISKY_TAG_BOOST for each of multiple risky tags', () => {
        const event = createMockEvent({ baseProb: 0.1 });
        const tags = ['bad_flash', 'default_password', 'no_encryption'];
        const result = calculateEventProbability(event, tags, 0);
        // 0.1 + 3 * 0.05 = 0.1 + 0.15 = 0.25
        expect(result).toBeCloseTo(0.25, 10);
    });

    it('ignores tags that are not in RISKY_TAGS', () => {
        const event = createMockEvent({ baseProb: 0.1 });
        const result = calculateEventProbability(
            event,
            ['some_safe_tag', 'another_irrelevant_tag'],
            0
        );
        expect(result).toBeCloseTo(0.1, 10);
    });

    it('caps probability at MAX_PROBABILITY', () => {
        const event = createMockEvent({ baseProb: 0.9 });
        const allRisky = [...RISKY_TAGS];
        const result = calculateEventProbability(event, allRisky, 200);
        // 0.9 + 200/500 + 12*0.05 = 0.9 + 0.4 + 0.6 = 1.9 → capped at 0.95
        expect(result).toBeCloseTo(EVENT_PROBABILITY.MAX_PROBABILITY, 10);
    });

    it('combines baseProb + doom + tags correctly', () => {
        const event = createMockEvent({ baseProb: 0.2 });
        const tags = ['tech_debt', 'cheap_wifi'];
        const result = calculateEventProbability(event, tags, 50);
        // 0.2 + 50/500 + 2*0.05 = 0.2 + 0.1 + 0.1 = 0.4
        expect(result).toBeCloseTo(0.4, 10);
    });

    it('adds 0.60 when all 12 risky tags are present', () => {
        const event = createMockEvent({ baseProb: 0.1 });
        const allRisky = [...RISKY_TAGS];
        const result = calculateEventProbability(event, allRisky, 0);
        // 0.1 + 12 * 0.05 = 0.1 + 0.6 = 0.7
        expect(result).toBeCloseTo(0.7, 10);
    });
});
