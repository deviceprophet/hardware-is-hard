/**
 * Game Engine - Public API
 *
 * This is the main entry point for the game engine.
 * Import from this file to use the engine.
 */

// Core types
export type {
    GamePhase,
    Device,
    DeviceArchetype,
    Difficulty,
    Choice,
    RiskLevel,
    GameEvent,
    VisualEffect,
    TargetModule,
    HistoryEntry,
    ShieldDeflection,
    DeathCause,
    DeathAnalysis,
    GameStateSnapshot,
    GameConfig,
    SharePayload,
    RandomProvider,
    DataProvider,
    GameCommand
} from './types';

// Engine class and utilities
export { GameEngine, type StateListener } from './GameEngine';

// Random providers (extracted module)
export { defaultRandomProvider, createSeededRandom } from './random';

// Event processing (extracted module)
export {
    filterEligibleEvents,
    selectEventByProbability,
    checkEventTagRequirements,
    type EventFilterContext,
    type EventFilterResult
} from './event-processor';

// State management (extracted module)
export {
    createInitialState,
    createSnapshot,
    canTransitionPhase,
    analyzeDeathCause,
    restoreState,
    PHASE_TRANSITIONS,
    type InternalState
} from './state-manager';

// Configuration
export {
    DEFAULT_CONFIG,
    INITIAL_BUDGET,
    INITIAL_DOOM,
    INITIAL_MONTH,
    monthsPerMs
} from './constants';

// Condition parser (for testing/debugging)
export { evaluateCondition, createConditionContext } from './condition-parser';

// Data provider
export {
    createDataProvider,
    createValidatedDataProvider,
    validateDevice,
    validateEvent
} from './data-provider';
