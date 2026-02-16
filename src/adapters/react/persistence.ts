/**
 * React Adapter - Persistence Slice
 *
 * Handles save/load, URL sharing, and result viewing.
 * Extracted from store.ts for maintainability.
 */

import type { GameEngine } from '../../engine';
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
import { PERSISTENCE } from '../../engine/constants';
import type { GameStateSnapshot, Device } from '../../engine';

export interface PersistenceSlice {
    sharedResult: GameResult | null;

    getShareUrl: () => string;
    getResultUrl: (outcome: 'victory' | 'recall') => string;

    saveCurrentGame: () => boolean;
    loadSavedGame: () => boolean;
    loadFromUrl: () => boolean;
    hasSave: () => boolean;
    getSaveInfo: () => { savedAt: string; month: number } | null;
    deleteSave: () => void;
    exitToMenu: () => void;
}

/** Get the base URL (without query string) for sharing */
const getBaseUrl = (): string => {
    if (typeof window === 'undefined') return PERSISTENCE.FALLBACK_ORIGIN;
    return window.location.href.split('?')[0] ?? PERSISTENCE.FALLBACK_ORIGIN;
};

/** Fix orphaned crisis/pause states from corrupted saves */
const repairOrphanedState = (state: Partial<GameStateSnapshot>): void => {
    if (state.phase === 'crisis' && !state.currentCrisis) {
        (state as { phase: string }).phase = 'simulation';
        (state as { isPaused: boolean }).isPaused = false;
    }
    if (state.phase === 'simulation' && state.isPaused && !state.currentCrisis) {
        (state as { isPaused: boolean }).isPaused = false;
    }
};

export function createPersistenceSlice(
    engine: GameEngine,
    set: (partial: Partial<PersistenceSlice> | Record<string, unknown>) => void,
    _get: () => unknown
): PersistenceSlice {
    return {
        sharedResult: null,

        exitToMenu: () => {
            const state = engine.getState();
            saveGame(state);
            // sessionResultRecorded is reset in the store wrapper
            engine.reset();
        },

        getShareUrl: () => {
            const state = engine.getState();
            const compressed = compressGameState(state);
            return `${getBaseUrl()}?save=${compressed}`;
        },

        getResultUrl: (outcome: 'victory' | 'recall') => {
            const state = engine.getState();
            const lang =
                typeof window !== 'undefined' ? document.documentElement.lang || 'en' : 'en';
            return generateResultUrl(state, outcome, lang, getBaseUrl());
        },

        saveCurrentGame: () => {
            const state = engine.getState();
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

                if (!saved.state.phase || saved.state.budget === undefined) {
                    deleteSavedGame();
                    return false;
                }

                repairOrphanedState(saved.state);

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
                const result = extractResultFromUrl();
                if (result) {
                    set({ sharedResult: result });

                    engine.restoreState({
                        phase: 'shared_result',
                        budget: result.b,
                        doomLevel: result.dm,
                        complianceLevel: result.c,
                        timelineMonth: result.m,
                        selectedDevice: { id: result.d } as unknown as Device // Partial device for display
                    });

                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, '', window.location.pathname);
                    }
                    return true;
                }

                const urlState = extractStateFromUrl();
                if (!urlState) {
                    return false;
                }

                if (!urlState.phase || urlState.budget === undefined || !urlState.selectedDevice) {
                    console.error('[loadFromUrl] Invalid state in URL');
                    return false;
                }

                repairOrphanedState(urlState);

                engine.restoreState(urlState);
                console.log('[loadFromUrl] Game loaded from URL', {
                    phase: urlState.phase,
                    month: urlState.timelineMonth
                });

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
}
