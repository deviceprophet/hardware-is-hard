/**
 * Save/Load Game State Manager
 *
 * Handles serialization of game state to/from localStorage.
 */

import type { GameStateSnapshot } from '../engine/types';

const SAVE_KEY = 'hardware_game_save';

export interface SaveData {
    state: Partial<GameStateSnapshot>;
    savedAt: string;
    version: number;
}

const CURRENT_VERSION = 1;

/**
 * Save current game state to localStorage
 */
export function saveGame(state: GameStateSnapshot): boolean {
    try {
        const saveData: SaveData = {
            state: {
                phase: state.phase,
                budget: state.budget,
                doomLevel: state.doomLevel,
                complianceLevel: state.complianceLevel,
                timelineMonth: state.timelineMonth,
                activeTags: state.activeTags,
                fundingLevel: state.fundingLevel,
                isPaused: state.isPaused,
                selectedDevice: state.selectedDevice,
                history: state.history
            },
            savedAt: new Date().toISOString(),
            version: CURRENT_VERSION
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        return true;
    } catch (e) {
        console.error('Failed to save game:', e);
        return false;
    }
}

/**
 * Load game state from localStorage
 */
export function loadGame(): SaveData | null {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) return null;

        const saveData: SaveData = JSON.parse(saved);

        // Version check for future migrations
        if (saveData.version !== CURRENT_VERSION) {
            console.warn('Save version mismatch, may need migration');
        }

        return saveData;
    } catch (e) {
        console.error('Failed to load game:', e);
        return null;
    }
}

/**
 * Check if a saved game exists
 */
export function hasSavedGame(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
}

/**
 * Delete saved game
 */
export function deleteSavedGame(): void {
    localStorage.removeItem(SAVE_KEY);
}

/**
 * Get save metadata without full state
 */
export function getSaveInfo(): { savedAt: string; month: number } | null {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) return null;

        const saveData: SaveData = JSON.parse(saved);
        return {
            savedAt: saveData.savedAt,
            month: saveData.state.timelineMonth || 0
        };
    } catch {
        return null;
    }
}
