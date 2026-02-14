/**
 * React Adapter - Zustand Store
 *
 * This bridges the pure GameEngine with React/Zustand.
 * It's a thin wrapper that delegates all logic to the engine.
 */

import { create } from 'zustand';
import {
    GameEngine,
    createDataProvider,
    type GameStateSnapshot,
    type Device,
    type Choice,
    type GameEvent
} from '../../engine';
import { recordGameResult, loadStats, type GameStats } from '../../engine/stats-tracker';
import { createPersistenceSlice, type PersistenceSlice } from './persistence';
import { PERSISTENCE } from '../../engine/constants';

// Import game data
import devicesData from '../../data/devices.json';
import eventsData from '../../data/events.json';

// Create the data provider
const dataProvider = createDataProvider(devicesData as Device[], eventsData as GameEvent[]);

// Create the engine instance
const engine = new GameEngine(dataProvider);

// Track if we've recorded the current session stats to verify idempotency
let sessionResultRecorded = false;

/** Record game result if the game just ended (victory or autopsy). Idempotent per session. */
const recordSessionIfEnded = (newState: GameStateSnapshot): void => {
    if (sessionResultRecorded) return;
    if (newState.phase !== 'victory' && newState.phase !== 'autopsy') return;

    sessionResultRecorded = true;
    const won = newState.phase === 'victory';
    recordGameResult(
        won,
        newState.timelineMonth,
        newState.selectedDevice?.id || '',
        newState.selectedDevice?.name || 'Unknown Device',
        {
            budget: newState.budget,
            doom: newState.doomLevel,
            compliance: newState.complianceLevel
        },
        newState
    );
};

// Store interface extends the snapshot with action methods
interface GameStore extends GameStateSnapshot, PersistenceSlice {
    gameSpeed: 'normal' | 'fast';

    // Actions (delegated to engine)
    initialize: () => void;
    goToSetup: () => void;
    selectDevice: (device: Device) => void;
    startGame: () => void;
    tick: (monthsPassed: number) => void;
    triggerCrisis: (event: GameEvent) => void;
    resolveCrisis: (choice: Choice) => void;

    setFundingLevel: (level: 'full' | 'partial' | 'none') => void;
    shipProduct: () => void;
    toggleGameSpeed: () => void;
    reset: () => void;

    // Direct engine access for advanced use
    getEngine: () => GameEngine;

    // Stats
    getStats: () => GameStats;
}

// Create the Zustand store
export const useGameStore = create<GameStore>((set, get) => {
    // Subscribe to engine state changes
    engine.subscribe(snapshot => {
        set(snapshot);
    });

    // Get initial state from engine
    const initialState = engine.getState();

    // Wrap exitToMenu to also reset sessionResultRecorded
    const persistence = createPersistenceSlice(engine, set, get);
    const wrappedExitToMenu = () => {
        sessionResultRecorded = false;
        persistence.exitToMenu();
    };

    return {
        ...initialState,
        ...persistence,
        exitToMenu: wrappedExitToMenu,
        gameSpeed: 'normal',

        // Actions
        initialize: () => {
            sessionResultRecorded = false;
            engine.initialize();
        },

        goToSetup: () => {
            let preferredId: string | undefined;
            try {
                if (typeof window !== 'undefined') {
                    preferredId =
                        localStorage.getItem(PERSISTENCE.LAST_PLAYED_DEVICE_KEY) || undefined;
                }
            } catch (e) {
                console.warn('Failed to read from localStorage', e);
            }
            engine.goToSetup(preferredId);
        },

        selectDevice: (device: Device) => {
            engine.selectDevice(device.id);
        },

        startGame: () => {
            const state = engine.getState();
            try {
                if (state.selectedDevice && typeof window !== 'undefined') {
                    localStorage.setItem(
                        PERSISTENCE.LAST_PLAYED_DEVICE_KEY,
                        state.selectedDevice.id
                    );
                }
            } catch (e) {
                console.warn('Failed to save to localStorage', e);
            }
            engine.startSimulation();
        },

        tick: (monthsPassed: number) => {
            const state = engine.getState();
            const delta = monthsPassed - state.timelineMonth;
            if (delta > 0) {
                engine.advanceTime(delta);
                recordSessionIfEnded(engine.getState());
            }
        },

        triggerCrisis: (event: GameEvent) => {
            engine.triggerCrisis(event.id);
        },

        resolveCrisis: (choice: Choice) => {
            engine.resolveCrisis(choice.id);
            recordSessionIfEnded(engine.getState());
        },

        setFundingLevel: (level: 'full' | 'partial' | 'none') => {
            engine.setFundingLevel(level);
        },

        shipProduct: () => {
            engine.shipProduct();
        },

        toggleGameSpeed: () => {
            set(state => ({
                gameSpeed: state.gameSpeed === 'normal' ? 'fast' : 'normal'
            }));
        },

        reset: () => {
            sessionResultRecorded = false;
            engine.reset();
        },

        getEngine: () => engine,

        getStats: () => loadStats()
    };
});

// Export the engine instance for direct access if needed
export { engine };
