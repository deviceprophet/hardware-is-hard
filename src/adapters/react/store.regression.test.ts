import { useGameStore } from './store';
import { describe, it, expect, vi } from 'vitest';
import type { Device } from '../../engine';
import * as saveLoad from '../../utils/saveLoad';
import { compressGameState } from '../../utils/compression';

// Mock saveLoad
vi.mock('../../utils/saveLoad', async importOriginal => {
    const actual = await importOriginal<typeof import('../../utils/saveLoad')>();
    return {
        ...actual,
        saveGame: vi.fn(),
        loadGame: vi.fn(),
        deleteSavedGame: vi.fn()
    };
});

describe('useGameStore Regression', () => {
    it('should not save game when in splash phase', () => {
        useGameStore.getState().initialize();
        expect(useGameStore.getState().phase).toBe('splash');

        const result = useGameStore.getState().saveCurrentGame();
        expect(result).toBe(false);
    });

    it('should save game when in simulation phase', () => {
        useGameStore.getState().initialize();
        useGameStore.getState().goToSetup();

        expect(useGameStore.getState().phase).toBe('setup');

        // selectDevice in store takes a Device object as per implementation
        useGameStore.getState().selectDevice({ id: 'omni-juice' } as Device);
        useGameStore.getState().startGame();

        expect(useGameStore.getState().phase).toBe('simulation');

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        vi.mocked(saveLoad.saveGame).mockReturnValue(true as any);
        const result = useGameStore.getState().saveCurrentGame();
        expect(result).toBe(true);
    });

    it('should not save game when in setup phase', () => {
        useGameStore.getState().initialize();
        useGameStore.getState().goToSetup();

        expect(useGameStore.getState().phase).toBe('setup');

        const result = useGameStore.getState().saveCurrentGame();
        expect(result).toBe(false);
    });

    it('should unpause simulation on load if no crisis exists', () => {
        const mockState = {
            phase: 'simulation',
            budget: 10000,
            isPaused: true,
            currentCrisis: null,
            selectedDevice: { id: 'test' },
            timelineMonth: 1
        };

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        vi.mocked(saveLoad.loadGame).mockReturnValue({ state: mockState } as any);

        const result = useGameStore.getState().loadSavedGame();
        expect(result).toBe(true);
        expect(useGameStore.getState().isPaused).toBe(false);
        expect(useGameStore.getState().phase).toBe('simulation');
    });

    it('should reset orphaned crisis phase to simulation on load', () => {
        const mockState = {
            phase: 'crisis',
            budget: 10000,
            isPaused: true,
            currentCrisis: null, // Crisis is missing!
            selectedDevice: { id: 'test' },
            timelineMonth: 1
        };

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        vi.mocked(saveLoad.loadGame).mockReturnValue({ state: mockState } as any);

        const result = useGameStore.getState().loadSavedGame();
        expect(result).toBe(true);
        expect(useGameStore.getState().phase).toBe('simulation');
        expect(useGameStore.getState().isPaused).toBe(false);
    });

    it('should load state from URL compression', () => {
        const mockState = {
            phase: 'simulation',
            budget: 42000,
            doomLevel: 5,
            timelineMonth: 10,
            selectedDevice: { id: 'omni-juice', name: 'Omni' },
            activeTags: [],
            history: [],
            isPaused: true
        };

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const compressed = compressGameState(mockState as any);

        // Mock URL search params
        const originalLocation = window.location;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        delete (window as any).location;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        (window as any).location = {
            ...originalLocation,
            search: `?save=${compressed}`,
            origin: 'http://localhost'
        };

        const result = useGameStore.getState().loadFromUrl();
        expect(result).toBe(true);
        expect(useGameStore.getState().budget).toBe(42000);
        expect(useGameStore.getState().isPaused).toBe(false); // Should have unpaused it

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        (window as any).location = originalLocation;
    });
});
