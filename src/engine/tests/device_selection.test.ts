import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../GameEngine';
import { createDataProvider } from '../data-provider';
import type { Device, GameEvent } from '../types';
import devices from '../../data/devices.json';
import events from '../../data/events.json';

// Mock data provider
const dataProvider = createDataProvider(
    devices as unknown as Device[],
    events as unknown as GameEvent[]
);

describe('Device Selection Logic', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine(dataProvider);
    });

    it('should default to Omni-Juice 4000 if no preference is provided', () => {
        engine.goToSetup();
        const state = engine.getState();

        expect(state.phase).toBe('setup');
        expect(state.availableDevices).toHaveLength(3);
        expect(state.availableDevices[0].id).toBe('omni-juice');
    });

    it('should prioritize the preferred device if provided', () => {
        const preferredId = 'industrial-sentinel';
        engine.goToSetup(preferredId);
        const state = engine.getState();

        expect(state.availableDevices[0].id).toBe(preferredId);
        // Ensure other devices are not the same
        expect(state.availableDevices[1].id).not.toBe(preferredId);
        expect(state.availableDevices[2].id).not.toBe(preferredId);
    });

    it('should fallback to Omni-Juice if preferred device is invalid', () => {
        engine.goToSetup('non-existent-device-id');
        const state = engine.getState();

        expect(state.availableDevices[0].id).toBe('omni-juice');
    });

    it('should fallback to Omni-Juice if preferred device is already Omni-Juice', () => {
        engine.goToSetup('omni-juice');
        const state = engine.getState();

        expect(state.availableDevices[0].id).toBe('omni-juice');
    });

    it('should have unique devices in the list', () => {
        engine.goToSetup();
        const state = engine.getState();
        const ids = state.availableDevices.map(d => d.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });
});
