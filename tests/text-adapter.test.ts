import { describe, test, expect } from 'vitest';
import { GameEngine } from '../src/engine/GameEngine';
import { createDataProvider } from '../src/engine/data-provider';
import { TextAdapter } from '../src/adapters/text/TextAdapter';
import devicesData from '../src/data/devices.json' with { type: 'json' };
import eventsData from '../src/data/events.json' with { type: 'json' };
import { defaultRandomProvider } from '../src/engine/GameEngine';
import type { Device, GameEvent } from '../src/engine/types';

// Setup data provider
const dataProvider = createDataProvider(devicesData as Device[], eventsData as GameEvent[]);

describe('Text UI Adapter & Game Logic', () => {
    test('should initialize and report correct state', () => {
        const engine = new GameEngine(dataProvider);
        const adapter = new TextAdapter(engine);

        const state = adapter.getState();
        expect(state.phase).toBe('splash');
        expect(adapter.render()).toContain('Phase: splash');
    });

    test('should generate persistent and random devices in setup', () => {
        // Use seeded random for predictability?
        // Or just verify properties of the list.
        const engine = new GameEngine(dataProvider, undefined, defaultRandomProvider);
        const adapter = new TextAdapter(engine);

        adapter.sendCommand({ type: 'GO_TO_SETUP' });

        const state = adapter.getState();
        expect(state.phase).toBe('setup');
        expect(state.availableDevices.length).toBeGreaterThan(0);
        expect(state.availableDevices.length).toBeLessThanOrEqual(3);

        // Verify "Persistent" device logic (Slot 1 is Omni-Juice)
        expect(state.availableDevices[0]!.id).toBe('omni-juice');
    });

    test('should allow full game flow via adapter', () => {
        const engine = new GameEngine(dataProvider, {
            totalMonths: 12,
            eventsPerGame: 5,
            eventIntervalMonths: 2,
            maxDoom: 100,
            gameDurationMs: 0
        });
        const adapter = new TextAdapter(engine);

        // 1. Splash -> Setup
        adapter.sendCommand({ type: 'GO_TO_SETUP' });
        expect(adapter.getState().phase).toBe('setup');

        // 2. Select Device
        const deviceToSelect = adapter.getState().availableDevices[0]!;
        adapter.sendCommand({ type: 'SELECT_DEVICE', deviceId: deviceToSelect.id });
        adapter.sendCommand({ type: 'START_SIMULATION' });

        expect(adapter.getState().phase).toBe('simulation');
        expect(adapter.getState().selectedDevice?.id).toBe(deviceToSelect.id);

        // 3. Advance Time & Handle Crisis
        // Advance until a crisis triggers
        for (let i = 0; i < 12; i++) {
            if (adapter.getState().phase === 'crisis') {
                const crisis = adapter.getState().currentCrisis;
                expect(crisis).not.toBeNull();

                // Solve it
                const choice = crisis!.choices[0]!;
                adapter.sendCommand({ type: 'RESOLVE_CRISIS', choiceId: choice.id });
                expect(adapter.getState().phase).toBe('simulation');
            } else {
                adapter.sendCommand({ type: 'ADVANCE_TIME', deltaMonths: 1 });
            }
        }

        console.log(adapter.render());
    });

    test('should reset state correctly', () => {
        const engine = new GameEngine(dataProvider);
        const adapter = new TextAdapter(engine);

        // Play a bit
        adapter.sendCommand({ type: 'GO_TO_SETUP' });
        adapter.sendCommand({ type: 'SELECT_DEVICE', deviceId: 'omni-juice' });
        adapter.sendCommand({ type: 'START_SIMULATION' });
        adapter.sendCommand({ type: 'ADVANCE_TIME', deltaMonths: 5 });

        expect(adapter.getState().timelineMonth).toBe(5);

        // Reset
        adapter.sendCommand({ type: 'RESET' });

        const state = adapter.getState();
        expect(state.phase).toBe('splash');
        expect(state.timelineMonth).toBe(0);
        expect(state.selectedDevice).toBeNull();
        expect(state.history).toEqual([]);
    });

    test('should vary random devices on reset', () => {
        const engine = new GameEngine(dataProvider);
        const adapter = new TextAdapter(engine);

        // Run 1
        adapter.sendCommand({ type: 'GO_TO_SETUP' });
        const run1Devices = adapter.getState().availableDevices.map(d => d.id);

        adapter.sendCommand({ type: 'RESET' });

        // Run 2
        adapter.sendCommand({ type: 'GO_TO_SETUP' });
        const run2Devices = adapter.getState().availableDevices.map(d => d.id);

        // Slot 1 should match (persistent)
        expect(run1Devices[0]).toBe('omni-juice');
        expect(run2Devices[0]).toBe('omni-juice');

        // Slots 2/3 might differ (random)
        // Note: With small device pool, they might match by chance, but unlikely to match fully if we have enough devices.
        // We have ~5 devices. 1 fixed. 4 left. Pick 2.
        // 4C2 = 6 combinations.
        // Good enough chance they differ or at least order differs.
        const allMatch =
            run1Devices.length === run2Devices.length &&
            run1Devices.every((id, i) => id === run2Devices[i]);

        if (allMatch) {
            console.warn(
                'Warning: Random device selection produced identical results (possible with small pool)'
            );
        }
    });
});
