/**
 * Save/Load Game State Manager
 *
 * Handles serialization of game state to/from localStorage.
 * Includes version migration for backwards compatibility.
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
 * Migration functions for each version.
 * Key is the version to migrate FROM, value returns migrated save data.
 */
const migrations: Record<number, (data: SaveData) => SaveData | null> = {
    // Example for future use:
    // 1: (data) => ({ ...data, version: 2, state: { ...data.state, newField: 'default' } })
};

/**
 * Apply migrations to bring save data up to current version.
 * Returns null if migration fails or data is incompatible.
 */
function migrateSaveData(data: SaveData): SaveData | null {
    let current = data;

    while (current.version < CURRENT_VERSION) {
        const fromVersion = current.version;
        const migration = migrations[fromVersion];
        if (!migration) {
            console.warn(`[saveLoad] No migration from version ${fromVersion}, discarding save`);
            return null;
        }

        try {
            const result = migration(current);
            if (!result) {
                console.warn(`[saveLoad] Migration from version ${fromVersion} returned null`);
                return null;
            }
            current = result;
        } catch (e) {
            console.error(`[saveLoad] Migration from version ${fromVersion} failed:`, e);
            return null;
        }
    }

    if (current.version > CURRENT_VERSION) {
        console.warn(
            `[saveLoad] Save version ${current.version} is newer than current ${CURRENT_VERSION}, discarding save`
        );
        return null;
    }

    return current;
}

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
                history: state.history,
                shieldDeflections: state.shieldDeflections
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
 * Load game state from localStorage.
 * Applies migrations if needed.
 * Returns null if no save exists or if save is incompatible.
 */
export function loadGame(): SaveData | null {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) return null;

        const saveData: SaveData = JSON.parse(saved);

        // Validate version exists
        if (typeof saveData.version !== 'number') {
            console.warn('[saveLoad] Save data missing version, discarding');
            deleteSavedGame();
            return null;
        }

        // Apply migrations if needed
        if (saveData.version !== CURRENT_VERSION) {
            const migrated = migrateSaveData(saveData);
            if (!migrated) {
                deleteSavedGame();
                return null;
            }
            return migrated;
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
