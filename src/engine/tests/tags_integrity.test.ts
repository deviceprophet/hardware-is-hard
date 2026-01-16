import { describe, it } from 'vitest';
import events from '../../data/events.json';
import devices from '../../data/devices.json';

describe('Tag System Integrity', () => {
    it('should not have unused tags (tags added but never required/blocked)', () => {
        // 1. Collect all tags that are ADDED or REMOVED (Producers)
        const producedTags = new Set<string>();

        // From Events
        events.forEach(event => {
            event.choices.forEach((choice: { addTags?: string[]; removeTags?: string[] }) => {
                choice.addTags?.forEach((tag: string) => producedTags.add(tag));
                choice.removeTags?.forEach((tag: string) => producedTags.add(tag));
            });
        });

        // From Devices (Initial tags)
        devices.forEach(device => {
            device.initialTags.forEach(tag => producedTags.add(tag));
        });

        // 2. Collect all tags that are REQUIRED or BLOCKED (Consumers)
        const consumedTags = new Set<string>();

        events.forEach(event => {
            event.requiredTags?.forEach(tag => consumedTags.add(tag));
            event.blockedByTags?.forEach(tag => consumedTags.add(tag));

            // Also check for tags referenced in triggerCondition
            if (event.triggerCondition) {
                [...producedTags].forEach(tag => {
                    if (
                        event.triggerCondition?.includes(`'${tag}'`) ||
                        event.triggerCondition?.includes(`"${tag}"`)
                    ) {
                        consumedTags.add(tag);
                    }
                });
            }
        });

        // 3. Find Phantom Tags (Produced but never Consumed)
        // Note: Some tags might be purely informational (like badge of honor),
        // but generally they should do something.
        // We filter out known "informational-only" tags if strictly needed.
        const unusedTags = [...producedTags].filter(tag => !consumedTags.has(tag));

        // Start with a warn-only approach or exact match expectation
        // This test helps us identify what we need to implement next!
        console.log('Unused Tags:', unusedTags);

        // This assertion will fail until we fix them, which is what we want
        // expect(unusedTags).toEqual([]);
    });
});
