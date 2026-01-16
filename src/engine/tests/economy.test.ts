import { describe, it, expect } from 'vitest';
import { GameEngine } from '../GameEngine';
import { createValidatedDataProvider } from '../data-provider';
// Note: DEFAULT_CONFIG is not used in this test file

const mockDevices = [
    {
        id: 'omni-juice',
        name: 'Omni-Juice 4000',
        description: 'Test Device',
        archetype: 'consumer',
        difficulty: 'medium',
        initialTags: ['cloud_dependency'],
        initialBudget: 120000,
        monthlyMaintenanceCost: 1500,
        eolMonth: 48
    }
];

const mockEvents = [
    {
        id: 'event_flash_shortage',
        title: 'Flash Memory Shortage',
        description: 'Test Event',
        category: 'supply_chain',
        triggerCondition: 'month > 2',
        choices: [
            {
                id: 'choice_redesign',
                text: 'Redesign PCB',
                cost: 25000,
                doomImpact: 0,
                riskLevel: 'low'
            }
        ]
    }
];

const mockData = createValidatedDataProvider(mockDevices, mockEvents);

describe('Economic Engine v2', () => {
    it('should allow shipping product when stable', () => {
        const engine = new GameEngine(mockData);

        // Setup: splash -> setup -> simulation
        engine.dispatch({ type: 'GO_TO_SETUP' });
        engine.dispatch({ type: 'SELECT_DEVICE', deviceId: 'omni-juice' });
        engine.dispatch({ type: 'START_SIMULATION' });

        const initialSnapshot = engine.getState();
        const initialBudget = initialSnapshot.budget;
        const initialDoom = initialSnapshot.doomLevel;
        const initialMonth = initialSnapshot.timelineMonth;

        // Act: Ship Product
        engine.dispatch({ type: 'SHIP_PRODUCT' });

        const nextSnapshot = engine.getState();

        // Assert: Mechanics
        expect(nextSnapshot.budget).toBeGreaterThan(initialBudget); // Gained money
        expect(nextSnapshot.budget).toBe(initialBudget + 35000 - 1500); // +Revenue - Maintenance
        expect(nextSnapshot.doomLevel).toBe(initialDoom + 10); // Risk increased
        expect(nextSnapshot.timelineMonth).toBe(initialMonth + 1); // Time passed
    });

    it('should block shipping if Doom is too high (Quality Gate)', () => {
        const engine = new GameEngine(mockData);
        engine.dispatch({ type: 'GO_TO_SETUP' });
        engine.dispatch({ type: 'SELECT_DEVICE', deviceId: 'omni-juice' });
        engine.dispatch({ type: 'START_SIMULATION' });

        // Hack state to high doom (Using type casting for test access)
        (engine as unknown as { state: { doomLevel: number } }).state.doomLevel = 60; // 60% is > 50% limit

        const before = engine.getState();

        // Act
        engine.dispatch({ type: 'SHIP_PRODUCT' });

        const after = engine.getState();

        // Assert: NO change
        expect(after.budget).toBe(before.budget);
        expect(after.timelineMonth).toBe(before.timelineMonth);
    });

    it('should not allow shipping when paused (Crisis)', () => {
        const engine = new GameEngine(mockData);
        engine.dispatch({ type: 'GO_TO_SETUP' });
        engine.dispatch({ type: 'SELECT_DEVICE', deviceId: 'omni-juice' });
        engine.dispatch({ type: 'START_SIMULATION' });

        // Trigger a crisis manually
        engine.dispatch({ type: 'TRIGGER_CRISIS', eventId: 'event_flash_shortage' });

        expect(engine.getState().phase).toBe('crisis');

        // Act
        engine.dispatch({ type: 'SHIP_PRODUCT' });

        // Assert: NO budget gain
        // Let's check strict equality
        const after = engine.getState();
        expect(after.budget).toBe(120000); // Initial budget of mock device
    });
});
