import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterEligibleEvents, type EventFilterContext } from '../event-processor';
import { createDataProvider } from '../data-provider';
import { createMockDevice, createMockEvent, createMockChoice } from './factories';
import type { Device, GameEvent } from '../types';

// Build a realistic set of devices and events for property testing
const testDevices: Device[] = [
    createMockDevice({ id: 'prop-dev', initialTags: ['tagA', 'tagB'], initialBudget: 100000 })
];

const testEvents: GameEvent[] = [
    createMockEvent({
        id: 'evt-req-tagA',
        requiredTags: ['tagA'],
        choices: [createMockChoice({ id: 'c1' })]
    }),
    createMockEvent({
        id: 'evt-req-tagC',
        requiredTags: ['tagC'],
        choices: [createMockChoice({ id: 'c2' })]
    }),
    createMockEvent({
        id: 'evt-blocked-by-tagB',
        blockedByTags: ['tagB'],
        choices: [createMockChoice({ id: 'c3' })]
    }),
    createMockEvent({
        id: 'evt-no-reqs',
        choices: [createMockChoice({ id: 'c4' })]
    }),
    createMockEvent({
        id: 'evt-req-tagA-blocked-tagD',
        requiredTags: ['tagA'],
        blockedByTags: ['tagD'],
        choices: [createMockChoice({ id: 'c5' })]
    })
];

const dataProvider = createDataProvider(testDevices, testEvents);

// Arbitrary for a valid EventFilterContext
const arbContext: fc.Arbitrary<EventFilterContext> = fc.record({
    activeTags: fc.uniqueArray(fc.constantFrom('tagA', 'tagB', 'tagC', 'tagD', 'tagE'), {
        minLength: 0,
        maxLength: 5
    }),
    history: fc.constant([]),
    timelineMonth: fc.integer({ min: 0, max: 60 }),
    budget: fc.integer({ min: 0, max: 200000 }),
    doomLevel: fc.integer({ min: 0, max: 100 })
});

describe('Event Processor Properties', () => {
    it('should be deterministic: same context produces same eligible events', () => {
        fc.assert(
            fc.property(arbContext, context => {
                const result1 = filterEligibleEvents(dataProvider, context);
                const result2 = filterEligibleEvents(dataProvider, context);

                const ids1 = result1.eligible.map(e => e.id).sort();
                const ids2 = result2.eligible.map(e => e.id).sort();

                expect(ids1).toEqual(ids2);
            })
        );
    });

    it('should never include events whose required tags are unmet', () => {
        fc.assert(
            fc.property(arbContext, context => {
                const { eligible } = filterEligibleEvents(dataProvider, context);

                for (const event of eligible) {
                    if (event.requiredTags && event.requiredTags.length > 0) {
                        for (const tag of event.requiredTags) {
                            expect(context.activeTags).toContain(tag);
                        }
                    }
                }
            })
        );
    });

    it('should never include events blocked by an active tag', () => {
        fc.assert(
            fc.property(arbContext, context => {
                const { eligible } = filterEligibleEvents(dataProvider, context);

                for (const event of eligible) {
                    if (event.blockedByTags && event.blockedByTags.length > 0) {
                        for (const tag of event.blockedByTags) {
                            expect(context.activeTags).not.toContain(tag);
                        }
                    }
                }
            })
        );
    });

    it('should record deflections for events blocked by active tags', () => {
        fc.assert(
            fc.property(arbContext, context => {
                const { deflections } = filterEligibleEvents(dataProvider, context);

                for (const deflection of deflections) {
                    expect(context.activeTags).toContain(deflection.blockedByTag);
                }
            })
        );
    });
});
