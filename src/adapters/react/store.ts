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
import {
    saveGame,
    loadGame,
    hasSavedGame,
    deleteSavedGame,
    getSaveInfo
} from '../../utils/saveLoad';
import {
    compressGameState,
    extractStateFromUrl,
    generateResultUrl,
    extractResultFromUrl,
    type GameResult
} from '../../utils/compression';

// Import game data
import devicesData from '../../data/devices.json';
import eventsData from '../../data/events.json';

// Create the data provider
const dataProvider = createDataProvider(devicesData as Device[], eventsData as GameEvent[]);

// Create the engine instance
const engine = new GameEngine(dataProvider);

// Track if we've recorded the current session stats to verify idempotency
let sessionResultRecorded = false;

// Store interface extends the snapshot with action methods
interface GameStore extends GameStateSnapshot {
    // Shared Result State
    sharedResult: GameResult | null;
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
    getShareUrl: () => string; // Full state for debug
    getResultUrl: (outcome: 'victory' | 'recall') => string; // Lightweight for social sharing

    // Direct engine access for advanced use
    getEngine: () => GameEngine;

    // Stats
    getStats: () => GameStats;

    // Save/Load
    saveCurrentGame: () => boolean;
    loadSavedGame: () => boolean;
    loadFromUrl: () => boolean;
    hasSave: () => boolean;
    getSaveInfo: () => { savedAt: string; month: number } | null;
    deleteSave: () => void;
    exitToMenu: () => void;
}

// Create the Zustand store
export const useGameStore = create<GameStore>(set => {
    // Subscribe to engine state changes
    engine.subscribe(snapshot => {
        set(snapshot);
    });

    // Get initial state from engine
    const initialState = engine.getState();

    return {
        ...initialState,
        sharedResult: null,
        gameSpeed: 'normal',

        // Actions
        initialize: () => {
            sessionResultRecorded = false;
            engine.initialize();
        },

        exitToMenu: () => {
            const state = engine.getState();
            saveGame(state);
            sessionResultRecorded = false;
            engine.reset();
        },

        goToSetup: () => {
            engine.goToSetup();
        },

        selectDevice: (device: Device) => {
            engine.selectDevice(device.id);
        },

        startGame: () => {
            engine.startSimulation();
        },

        tick: (monthsPassed: number) => {
            const state = engine.getState();
            // Calculate delta from previous month
            const delta = monthsPassed - state.timelineMonth;
            if (delta > 0) {
                engine.advanceTime(delta);

                // Check if time advance caused victory
                const newState = engine.getState();
                if (
                    !sessionResultRecorded &&
                    (newState.phase === 'victory' || newState.phase === 'autopsy')
                ) {
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
                        }
                    );
                }
            }
        },

        triggerCrisis: (event: GameEvent) => {
            engine.triggerCrisis(event.id);
        },

        resolveCrisis: (choice: Choice) => {
            engine.resolveCrisis(choice.id);

            // Check for game end and record stats
            const newState = engine.getState();
            if (
                !sessionResultRecorded &&
                (newState.phase === 'victory' || newState.phase === 'autopsy')
            ) {
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
                    }
                );
            }
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

        getShareUrl: () => {
            // Use full state compression for complete game sharing (debug)
            const state = engine.getState();
            const compressed = compressGameState(state);
            const origin =
                typeof window !== 'undefined'
                    ? window.location.href.split('?')[0]
                    : 'https://www.deviceprophet.com/labs';
            return `${origin}?save=${compressed}`;
        },

        getResultUrl: (outcome: 'victory' | 'recall') => {
            const state = engine.getState();
            // Get current language from i18n if available
            const lang =
                typeof window !== 'undefined' ? document.documentElement.lang || 'en' : 'en';
            const origin =
                typeof window !== 'undefined'
                    ? window.location.href.split('?')[0]
                    : 'https://www.deviceprophet.com/labs';
            return generateResultUrl(state, outcome, lang, origin);
        },

        getEngine: () => engine,

        getStats: () => loadStats(),

        // Save/Load implementations
        saveCurrentGame: () => {
            const state = engine.getState();
            // Only save if in a playable phase
            if (state.phase !== 'simulation' && state.phase !== 'crisis') {
                return false;
            }
            return saveGame(state);
        },

        loadSavedGame: () => {
            try {
                const saved = loadGame();
                if (!saved) {
                    console.warn('[loadSavedGame] No saved game found');
                    return false;
                }

                if (!saved.state) {
                    console.warn('[loadSavedGame] Saved game has no state');
                    return false;
                }

                // Validate critical saved state properties
                if (!saved.state.phase || saved.state.budget === undefined) {
                    console.error('[loadSavedGame] Corrupted save detected, clearing...');
                    deleteSavedGame();
                    return false;
                }

                // Fix orphaned crisis phase: If in crisis phase but no currentCrisis, reset to simulation
                if (saved.state.phase === 'crisis' && !saved.state.currentCrisis) {
                    console.warn(
                        '[loadSavedGame] Orphaned crisis phase detected, resetting to simulation'
                    );
                    (saved.state as { phase: string }).phase = 'simulation';
                    (saved.state as { isPaused: boolean }).isPaused = false;
                }

                // Always unpause when loading a game in simulation phase (unless there's an active crisis)
                if (saved.state.phase === 'simulation' && saved.state.isPaused) {
                    if (!saved.state.currentCrisis) {
                        console.log('[loadSavedGame] Unpausing game (no active crisis)');
                        (saved.state as { isPaused: boolean }).isPaused = false;
                    }
                }

                // Validate device selection is intact for simulation/crisis phases
                if (
                    (saved.state.phase === 'simulation' || saved.state.phase === 'crisis') &&
                    !saved.state.selectedDevice
                ) {
                    console.error('[loadSavedGame] No device in save, corrupted state');
                    deleteSavedGame();
                    return false;
                }

                engine.restoreState(saved.state);
                console.log('[loadSavedGame] Game restored successfully', {
                    phase: saved.state.phase,
                    month: saved.state.timelineMonth,
                    isPaused: saved.state.isPaused
                });
                return true;
            } catch (error) {
                console.error('[loadSavedGame] Error loading game:', error);
                // Clear corrupted save
                try {
                    deleteSavedGame();
                } catch {
                    // Ignore deletion errors
                }
                return false;
            }
        },

        hasSave: () => hasSavedGame(),

        getSaveInfo: () => getSaveInfo(),

        loadFromUrl: () => {
            try {
                // Check for lightweight result first
                const result = extractResultFromUrl();
                if (result) {
                    console.log('[loadFromUrl] Found shared result', result);

                    // Store the result
                    useGameStore.setState({ sharedResult: result });

                    // Force engine phase to shared_result
                    // We directly modify the state to inject the phase
                    // This is safe because we're overriding the initial state
                    const currentState = engine.getState();
                    engine.restoreState({
                        ...currentState,
                        phase: 'shared_result'
                    });

                    // Clear keys
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, '', window.location.pathname);
                    }
                    return true;
                }

                const urlState = extractStateFromUrl();
                if (!urlState) {
                    return false;
                }

                // Validate the extracted state
                if (!urlState.phase || urlState.budget === undefined || !urlState.selectedDevice) {
                    console.error('[loadFromUrl] Invalid state in URL');
                    return false;
                }

                // Apply the same fixes as loadSavedGame
                if (urlState.phase === 'crisis' && !urlState.currentCrisis) {
                    (urlState as { phase: string }).phase = 'simulation';
                    (urlState as { isPaused: boolean }).isPaused = false;
                }
                if (
                    urlState.phase === 'simulation' &&
                    urlState.isPaused &&
                    !urlState.currentCrisis
                ) {
                    (urlState as { isPaused: boolean }).isPaused = false;
                }

                engine.restoreState(urlState);
                console.log('[loadFromUrl] Game loaded from URL', {
                    phase: urlState.phase,
                    month: urlState.timelineMonth
                });

                // Clear the URL parameter to avoid confusion on reload
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, '', window.location.pathname);
                }

                return true;
            } catch (error) {
                console.error('[loadFromUrl] Error loading from URL:', error);
                return false;
            }
        },

        deleteSave: () => {
            deleteSavedGame();
        }
    };
});

// Export the engine instance for direct access if needed
export { engine };
