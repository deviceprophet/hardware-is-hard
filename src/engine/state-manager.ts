/**
 * State Manager Module
 *
 * Handles game state creation, snapshots, and validation.
 * Extracted from GameEngine for better separation of concerns.
 */

import type {
    Device,
    GameEvent,
    GamePhase,
    GameStateSnapshot,
    HistoryEntry,
    ShieldDeflection,
    DeathAnalysis,
    DeathCause,
    GameConfig
} from './types';
import {
    INITIAL_BUDGET,
    INITIAL_DOOM,
    INITIAL_MONTH,
    INITIAL_COMPLIANCE,
    NO_LAST_EVENT,
    PROBLEM_TAGS
} from './constants';

/**
 * Create the initial game state.
 */
export interface InternalState {
    phase: GamePhase;
    budget: number;
    doomLevel: number;
    timelineMonth: number;
    selectedDevice: Device | null;
    activeTags: string[];
    history: HistoryEntry[];
    shieldDeflections: ShieldDeflection[];
    currentCrisis: GameEvent | null;
    lastEventMonth: number;
    isPaused: boolean;
    complianceLevel: number;
    fundingLevel: 'full' | 'partial' | 'none';
    availableDevices: Device[];
}

/**
 * Create the initial game state.
 */
export function createInitialState(): InternalState {
    return {
        phase: 'splash',
        budget: INITIAL_BUDGET,
        doomLevel: INITIAL_DOOM,
        timelineMonth: INITIAL_MONTH,
        selectedDevice: null,
        activeTags: [],
        history: [],
        shieldDeflections: [],
        currentCrisis: null,
        lastEventMonth: NO_LAST_EVENT,
        isPaused: false,
        complianceLevel: INITIAL_COMPLIANCE,
        fundingLevel: 'full',
        availableDevices: []
    };
}

/**
 * Create an immutable snapshot from internal state.
 * This is what gets exposed to the UI and is safe to share.
 *
 * @param state - Internal mutable state
 * @param deathAnalysis - Optional death analysis for autopsy phase
 */
export function createSnapshot(
    state: InternalState,
    deathAnalysis: DeathAnalysis | null = null
): GameStateSnapshot {
    return {
        phase: state.phase,
        budget: state.budget,
        doomLevel: state.doomLevel,
        timelineMonth: state.timelineMonth,
        selectedDevice: state.selectedDevice ? { ...state.selectedDevice } : null,
        activeTags: [...state.activeTags],
        history: [...state.history],
        shieldDeflections: [...state.shieldDeflections],
        currentCrisis: state.currentCrisis ? { ...state.currentCrisis } : null,
        lastEventMonth: state.lastEventMonth,
        isPaused: state.isPaused,
        complianceLevel: state.complianceLevel,
        fundingLevel: state.fundingLevel,
        availableDevices: [...state.availableDevices],
        deathAnalysis
    };
}

/**
 * Valid phase transitions map.
 */
export const PHASE_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
    splash: ['setup'],
    setup: ['simulation', 'splash'],
    simulation: ['crisis', 'autopsy', 'victory'],
    crisis: ['simulation', 'autopsy'],
    autopsy: ['splash'],
    victory: ['splash'],
    shared_result: ['setup', 'splash']
};

/**
 * Check if a phase transition is valid.
 *
 * @param from - Current phase
 * @param to - Target phase
 */
export function canTransitionPhase(from: GamePhase, to: GamePhase): boolean {
    const allowed = PHASE_TRANSITIONS[from];
    return allowed.includes(to);
}

/**
 * Analyze the cause of death for the autopsy screen.
 *
 * @param state - Current game state
 * @param config - Game configuration
 */
export function analyzeDeathCause(state: InternalState, config: GameConfig): DeathAnalysis {
    const { doomLevel, history, activeTags, complianceLevel, timelineMonth } = state;

    // Determine cause
    let cause: DeathCause = 'doom_overflow';
    if (doomLevel < config.maxDoom && timelineMonth >= config.totalMonths) {
        cause = 'survived';
    }

    // Find worst choice (highest doom increase)
    let worstChoice: HistoryEntry | null = null;
    let maxDoom = 0;
    for (const entry of history) {
        if (entry.doomIncrease > maxDoom) {
            maxDoom = entry.doomIncrease;
            worstChoice = entry;
        }
    }

    // Total calculations
    const totalDoomFromChoices = history.reduce((sum, e) => sum + e.doomIncrease, 0);
    const totalSpent = history.reduce((sum, e) => sum + e.cost, 0);

    // Find most impactful negative tag
    const problemTags = activeTags.filter(tag =>
        PROBLEM_TAGS.includes(tag as (typeof PROBLEM_TAGS)[number])
    );
    const primaryTag = problemTags.length > 0 ? problemTags[0]! : null;

    return {
        cause,
        primaryTag,
        worstChoice,
        totalDoomFromChoices,
        totalSpent,
        finalComplianceLevel: complianceLevel
    };
}

/**
 * Restore state from a partial snapshot (for loading saved games).
 *
 * @param current - Current internal state
 * @param saved - Partial saved state to restore
 */
export function restoreState(
    current: InternalState,
    saved: Partial<GameStateSnapshot>
): InternalState {
    return {
        ...current,
        phase: saved.phase ?? current.phase,
        budget: saved.budget ?? current.budget,
        doomLevel: saved.doomLevel ?? current.doomLevel,
        timelineMonth: saved.timelineMonth ?? current.timelineMonth,
        selectedDevice: saved.selectedDevice ?? current.selectedDevice,
        activeTags: saved.activeTags ? [...saved.activeTags] : current.activeTags,
        history: saved.history ? [...saved.history] : current.history,
        shieldDeflections: saved.shieldDeflections
            ? [...saved.shieldDeflections]
            : current.shieldDeflections,
        currentCrisis: saved.currentCrisis ?? current.currentCrisis,
        lastEventMonth: saved.lastEventMonth ?? current.lastEventMonth,
        isPaused: saved.isPaused ?? current.isPaused,
        complianceLevel: saved.complianceLevel ?? current.complianceLevel,
        fundingLevel: saved.fundingLevel ?? current.fundingLevel,
        availableDevices: saved.availableDevices
            ? [...saved.availableDevices]
            : current.availableDevices
    };
}
