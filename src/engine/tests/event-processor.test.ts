import { describe, it, expect } from 'vitest';
import { selectEventByProbability, checkEventTagRequirements } from '../event-processor';
import { createMockEvent } from './factories';
import type { RandomProvider } from '../types';

const createMockRandom = (values: number[] = [0]): RandomProvider => {
    let idx = 0;
    return {
        random: () => values[idx++ % values.length] ?? 0,
        randomInt: (max: number) => Math.floor((values[idx++ % values.length] ?? 0) * max),
        pick: <T>(arr: readonly T[]): T | undefined => arr[0]
    };
};

describe('selectEventByProbability', () => {
    it('returns undefined for empty events list', () => {
        const random = createMockRandom();
        const result = selectEventByProbability([], [], 0, random);
        expect(result).toBeUndefined();
    });

    it('selects events that pass probability check', () => {
        const event = createMockEvent({ id: 'e1', baseProb: 0.5 });
        // random() returns 0, which is < any positive prob, so event passes
        const random = createMockRandom([0]);
        const result = selectEventByProbability([event], [], 0, random);
        expect(result).toBeDefined();
        expect(result!.id).toBe('e1');
    });

    it('falls back to random.pick(events) when no events pass probability check', () => {
        const eventA = createMockEvent({ id: 'a', baseProb: 0.1 });
        const eventB = createMockEvent({ id: 'b', baseProb: 0.1 });
        // random() returns 0.99, which is >= any reasonable prob, so none pass
        const random = createMockRandom([0.99]);
        const result = selectEventByProbability([eventA, eventB], [], 0, random);
        // Falls back to random.pick(events) which returns the first element
        expect(result).toBeDefined();
        expect(result!.id).toBe('a');
    });

    it('calls random.pick with the weighted array when multiple events pass', () => {
        const eventA = createMockEvent({ id: 'a', baseProb: 0.9 });
        const eventB = createMockEvent({ id: 'b', baseProb: 0.9 });
        // random() returns 0 for both events, so both pass probability check
        const random = createMockRandom([0, 0]);
        const result = selectEventByProbability([eventA, eventB], [], 0, random);
        // random.pick returns first element of weighted array, which is eventA
        expect(result).toBeDefined();
        expect(result!.id).toBe('a');
    });

    it('returns the single event when it passes the probability check', () => {
        const event = createMockEvent({ id: 'single' });
        const random = createMockRandom([0]);
        const result = selectEventByProbability([event], [], 0, random);
        expect(result).toBe(event);
    });

    it('returns the event object from the weighted entry (choice?.event)', () => {
        const event = createMockEvent({ id: 'wrapped' });
        const random = createMockRandom([0]);
        const result = selectEventByProbability([event], [], 0, random);
        // Ensure we get the actual event object, not a wrapper
        expect(result).toEqual(event);
        expect(result).toHaveProperty('id', 'wrapped');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('choices');
    });
});

describe('checkEventTagRequirements', () => {
    it('returns eligible when no tags required and no blocked tags', () => {
        const event = createMockEvent();
        const result = checkEventTagRequirements(event, []);
        expect(result).toEqual({ eligible: true });
    });

    it('returns eligible when requiredTags are met', () => {
        const event = createMockEvent({ requiredTags: ['wifi', 'bluetooth'] });
        const result = checkEventTagRequirements(event, ['wifi', 'bluetooth', 'extra']);
        expect(result).toEqual({ eligible: true });
    });

    it('returns ineligible when requiredTags are NOT met', () => {
        const event = createMockEvent({ requiredTags: ['wifi'] });
        const result = checkEventTagRequirements(event, ['bluetooth']);
        expect(result).toEqual({ eligible: false });
    });

    it('returns ineligible when requiredTags are only partially met', () => {
        const event = createMockEvent({ requiredTags: ['wifi', 'bluetooth'] });
        const result = checkEventTagRequirements(event, ['wifi']);
        expect(result).toEqual({ eligible: false });
    });

    it('returns ineligible with blockedBy when a blockedByTags tag is present', () => {
        const event = createMockEvent({ blockedByTags: ['patched'] });
        const result = checkEventTagRequirements(event, ['patched']);
        expect(result).toEqual({ eligible: false, blockedBy: 'patched' });
    });

    it('returns eligible when blockedByTags are not in activeTags', () => {
        const event = createMockEvent({ blockedByTags: ['patched'] });
        const result = checkEventTagRequirements(event, ['wifi']);
        expect(result).toEqual({ eligible: true });
    });

    it('returns eligible when required tags met AND not blocked', () => {
        const event = createMockEvent({
            requiredTags: ['wifi'],
            blockedByTags: ['patched']
        });
        const result = checkEventTagRequirements(event, ['wifi']);
        expect(result).toEqual({ eligible: true });
    });

    it('treats empty requiredTags array as no requirement', () => {
        const event = createMockEvent({ requiredTags: [] });
        const result = checkEventTagRequirements(event, []);
        expect(result).toEqual({ eligible: true });
    });

    it('treats empty blockedByTags array as no blocker', () => {
        const event = createMockEvent({ blockedByTags: [] });
        const result = checkEventTagRequirements(event, ['anything']);
        expect(result).toEqual({ eligible: true });
    });

    it('treats undefined requiredTags as eligible', () => {
        const event = createMockEvent({ requiredTags: undefined });
        const result = checkEventTagRequirements(event, []);
        expect(result).toEqual({ eligible: true });
    });

    it('treats undefined blockedByTags as eligible', () => {
        const event = createMockEvent({ blockedByTags: undefined });
        const result = checkEventTagRequirements(event, ['anything']);
        expect(result).toEqual({ eligible: true });
    });
});
