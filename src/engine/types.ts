/**
 * Core Game Engine Types
 *
 * These types are framework-agnostic and represent the pure game domain.
 * No UI frameworks, no state management libraries - just data structures.
 */

// ============================================================================
// Game Phase State Machine
// ============================================================================

export type GamePhase =
    | 'splash' // Initial screen
    | 'setup' // Device selection
    | 'simulation' // Main gameplay loop
    | 'crisis' // Event decision modal
    | 'autopsy' // Game over - failed
    | 'victory' // Game over - success
    | 'shared_result'; // Viewing a shared result

// Valid phase transitions
export const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
    splash: ['setup'],
    setup: ['simulation', 'splash'],
    simulation: ['crisis', 'autopsy', 'victory'],
    crisis: ['simulation', 'autopsy'],
    autopsy: ['splash'],
    victory: ['splash'],
    shared_result: ['splash', 'setup']
};

// ============================================================================
// Device Configuration
// ============================================================================

export type DeviceArchetype = 'corporate' | 'consumer' | 'medical' | 'appliance' | 'industrial';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface Device {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly archetype: DeviceArchetype;
    readonly difficulty: Difficulty;
    readonly initialTags: readonly string[];
    readonly initialBudget: number;
    readonly monthlyMaintenanceCost: number; // Cost to keep valid
    readonly eolMonth: number; // Month when official support ends (e.g. 48)
}

// ============================================================================
// Event System
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high';
export type VisualEffect = 'glitch' | 'shake' | 'none';
export type TargetModule = 'cpu' | 'network' | 'power' | 'storage' | 'sensor';
export type EventCategory =
    | 'regulatory' // CRA, GDPR, PSTI, etc.
    | 'cyberattack' // Botnet, ransomware, APT
    | 'supply_chain' // Component EOL, shortages
    | 'operational' // Cloud issues, OTA failures
    | 'privacy' // Data breaches
    | 'ipr' // Cloning, IP theft
    | 'reputational'; // PR disasters

export interface Choice {
    readonly id: string;
    readonly text: string;
    readonly cost: number;
    readonly doomImpact: number;
    readonly addTags?: readonly string[];
    readonly removeTags?: readonly string[];
    readonly riskLevel: RiskLevel;
}

export interface GameEvent {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly category?: EventCategory;
    readonly triggerCondition?: string;
    readonly requiredTags?: readonly string[];
    readonly blockedByTags?: readonly string[];
    readonly choices: readonly Choice[];
    readonly visualEffect?: VisualEffect;
    readonly targetModule?: TargetModule;
    // Probability-based triggering
    readonly baseProb?: number; // Base probability (0.0 - 1.0)
    readonly repeatable?: boolean; // Can trigger multiple times
}

// ============================================================================
// Game History
// ============================================================================

export interface HistoryEntry {
    readonly month: number;
    readonly eventId: string;
    readonly choiceId: string;
    readonly doomIncrease: number;
    readonly cost: number;
}

export interface ShieldDeflection {
    readonly month: number;
    readonly eventId: string;
    readonly blockedByTag: string;
}

// ============================================================================
// Death Analysis (for Autopsy screen)
// ============================================================================

export type DeathCause =
    | 'doom_overflow' // Doom meter hit 100
    | 'bankruptcy' // Budget went negative (future feature)
    | 'survived'; // Made it to month 60

export interface DeathAnalysis {
    readonly cause: DeathCause;
    readonly primaryTag: string | null; // Most impactful negative tag
    readonly worstChoice: HistoryEntry | null; // Choice with highest doom
    readonly totalDoomFromChoices: number;
    readonly totalSpent: number;
    readonly finalComplianceLevel: number;
}

// ============================================================================
// Game State Snapshot (Immutable state capture)
// ============================================================================

export interface GameStateSnapshot {
    // Phase
    readonly phase: GamePhase;

    // Core metrics
    readonly budget: number;
    readonly doomLevel: number;
    readonly timelineMonth: number;

    // Session data
    readonly selectedDevice: Device | null;
    readonly availableDevices: readonly Device[];
    readonly activeTags: readonly string[];
    readonly history: readonly HistoryEntry[];
    readonly shieldDeflections: readonly ShieldDeflection[];

    // Runtime state
    readonly currentCrisis: GameEvent | null;
    readonly lastEventMonth: number;
    readonly isPaused: boolean;
    readonly complianceLevel: number; // 0-100, impacts legal risk
    readonly fundingLevel: 'full' | 'partial' | 'none'; // maintenance funding

    // Analysis (computed on demand)
    readonly deathAnalysis: DeathAnalysis | null;
}

// ============================================================================
// Engine Configuration
// ============================================================================

export interface GameConfig {
    readonly totalMonths: number;
    readonly eventsPerGame: number;
    readonly eventIntervalMonths: number;
    readonly maxDoom: number;
    readonly gameDurationMs: number;
}

// ============================================================================
// Share/Export
// ============================================================================

export interface SharePayload {
    readonly deviceId: string | null;
    readonly doomLevel: number;
    readonly eventsCount: number;
    readonly result: 'fail' | 'win' | 'playing';
    readonly finalMonth: number;
}

// ============================================================================
// Provider Interfaces (for dependency injection)
// ============================================================================

export interface RandomProvider {
    /** Returns a random number between 0 (inclusive) and 1 (exclusive) */
    random(): number;
    /** Returns a random integer between 0 and max (exclusive) */
    randomInt(max: number): number;
    /** Picks a random element from an array */
    pick<T>(array: readonly T[]): T | undefined;
}

export interface DataProvider {
    getDevices(): readonly Device[];
    getEvents(): readonly GameEvent[];
    getDevice(id: string): Device | undefined;
    getEvent(id: string): GameEvent | undefined;
}

// ============================================================================
// Engine Commands (for command pattern)
// ============================================================================

export type GameCommand =
    | { type: 'INITIALIZE' }
    | { type: 'GO_TO_SETUP' }
    | { type: 'SELECT_DEVICE'; deviceId: string }
    | { type: 'START_SIMULATION' }
    | { type: 'ADVANCE_TIME'; deltaMonths: number }
    | { type: 'TRIGGER_CRISIS'; eventId: string }
    | { type: 'RESOLVE_CRISIS'; choiceId: string }
    | { type: 'SET_FUNDING'; level: 'full' | 'partial' | 'none' }
    | { type: 'SHIP_PRODUCT' }
    | { type: 'RESET' };
