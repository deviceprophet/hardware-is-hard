import { describe, it, expect } from 'vitest';
import devicesData from '../../data/devices.json';
import eventsData from '../../data/events.json';

describe('Game Balance Snapshots', () => {
    it('should match devices balance snapshot', () => {
        const stats = devicesData.map(d => ({
            id: d.id,
            difficulty: d.difficulty,
            budget: d.initialBudget,
            tagCount: d.initialTags.length,
            maintenance: d.monthlyMaintenanceCost,
            eol: d.eolMonth
        }));

        expect(stats).toMatchSnapshot();
    });

    it('should match events balance snapshot', () => {
        const stats = eventsData.map(e => ({
            id: e.id,
            hasCondition: !!e.triggerCondition,
            hasTags: (e.requiredTags || []).length > 0,
            choiceCount: e.choices.length,
            avgCost: e.choices.reduce((sum, c) => sum + c.cost, 0) / e.choices.length,
            avgDoom: e.choices.reduce((sum, c) => sum + c.doomImpact, 0) / e.choices.length,
            riskProfile: e.choices.map(c => c.riskLevel).sort()
        }));

        expect(stats).toMatchSnapshot();
    });

    it('should have valid choice distribution', () => {
        // Ensure every event has at least one 'low' risk choice?
        // Or at least one choice with 0 cost?
        // This enforces a design rule: "Player should always have a 'free' option" (if desired)
        const eventsWithoutFreeOption = eventsData
            .filter(e => !e.choices.some(c => c.cost === 0))
            .map(e => e.id);

        // This might fail if design changes, but good to know
        // For now, let's just snapshot the list of "expensive only" events
        expect(eventsWithoutFreeOption).toMatchSnapshot();
    });
});
