/**
 * Game Engine Constants
 *
 * All configurable game parameters in one place.
 * Change values here to tune game balance without touching logic code.
 */

import type { GameConfig } from './types';

// ==========================================================================
// Core Game Configuration
// ==========================================================================

export const DEFAULT_CONFIG: GameConfig = {
    totalMonths: 60, // 5 years
    eventsPerGame: 10, // Target number of events
    eventIntervalMonths: 6, // Months between events
    maxDoom: 100, // Game over threshold
    gameDurationMs: 150_000 // 150 seconds real-time
};

// ==========================================================================
// Initial State
// ==========================================================================

export const INITIAL_BUDGET = 100_000;
export const INITIAL_DOOM = 0;
export const INITIAL_MONTH = 0;
export const INITIAL_COMPLIANCE = 100;
export const NO_LAST_EVENT = -1;

// ==========================================================================
// Device Setup
// ==========================================================================

export const SETUP = {
    RANDOM_DEVICE_COUNT: 2, // Random devices shown alongside preferred
    FALLBACK_DEVICE_ID: 'omni-juice'
} as const;

// ==========================================================================
// OTA Monetization (Ship Product)
// ==========================================================================

export const OTA_MONETIZATION = {
    REWARD: 35_000,
    DOOM_PENALTY: 10,
    DOOM_THRESHOLD: 0.5, // Can't ship above 50% doom
    TIME_ADVANCE: 1 // Months consumed per shipment
} as const;

// ==========================================================================
// Financial Stress: deep debt → investor/creditor doom pressure
// Thresholds (negative budget) and doom-per-month rates are cumulative.
// ==========================================================================

export const BUDGET_STRESS_TIERS = [
    { threshold: -50_000, doomPerMonth: 1 / 12 },
    { threshold: -150_000, doomPerMonth: 1 / 6 },
    { threshold: -300_000, doomPerMonth: 1 / 3 }
] as const;

// ==========================================================================
// Event Probability
// ==========================================================================

export const EVENT_PROBABILITY = {
    DEFAULT_BASE: 0.3, // Default event trigger chance
    DOOM_DIVISOR: 500, // Doom accelerator: doomLevel / DIVISOR added to prob
    RISKY_TAG_BOOST: 0.05, // +5% per risky tag present
    MAX_PROBABILITY: 0.95 // Hard cap on event probability
} as const;

/** Tags that increase ALL event probabilities when present */
export const RISKY_TAGS = [
    'bad_flash',
    'default_password',
    'no_encryption',
    'cheap_wifi',
    'tech_debt',
    'cra_noncompliant',
    'cloud_dependency',
    'pr_disaster',
    'regulatory_debt',
    'supply_risk',
    'cloned',
    'untested_hardware'
] as const;

// ==========================================================================
// Compliance / Regulatory
// ==========================================================================

export const COMPLIANCE = {
    MAX_LEVEL: 100,
    DEFAULT_MAINTENANCE_COST: 2000,
    DEFAULT_EOL_MONTH: 48,
    LEGACY_MONTH_THRESHOLD: 36, // Costs increase after this month
    LEGACY_COST_MULTIPLIER: 1.5,

    // Funding strategies: { costMultiplier, complianceChangePerMonth, eolChangePerMonth }
    FULL_FUNDING: { costMultiplier: 1.0, change: 1, eolChange: -2 },
    PARTIAL_FUNDING: { costMultiplier: 0.5, change: -2 },
    NO_FUNDING: { costMultiplier: 0, change: -5 },

    // Tag thresholds
    REGULATORY_RISK_THRESHOLD: 50, // Below this → regulatory_risk tag
    CRITICAL_VULN_THRESHOLD: 20 // Below this → critical_vuln tag
} as const;

/** System tags managed by the compliance engine */
export const SYSTEM_TAGS = {
    EOL_DEVICE: 'eol_device',
    REGULATORY_RISK: 'regulatory_risk',
    CRITICAL_VULN: 'critical_vuln'
} as const;

// ==========================================================================
// Blame Generator
// ==========================================================================

export const BLAME = {
    CATEGORY_MATCH_SCORE: 2,
    SECONDARY_SCORE: 1,
    DEFAULT_SCORE: 1,
    FINANCE_DOOM_THRESHOLD: 10, // Cheap choice + doom > this → Finance blame
    MANAGEMENT_DOOM_THRESHOLD: 20, // Doom increase >= this → Management blame
    SEEDED_RANDOM_MULTIPLIER: 10_000
} as const;

// ==========================================================================
// Death Analysis
// ==========================================================================

/** Tags that indicate negative outcomes for death cause analysis */
export const PROBLEM_TAGS = [
    'bad_flash',
    'fake_ai',
    'data_loss',
    'cheap_wifi',
    'tech_debt',
    'no_encryption'
] as const;

// ==========================================================================
// Achievements
// ==========================================================================

export const ACHIEVEMENT_THRESHOLDS = {
    FIRST_BLOOD_GAMES: 1,
    SURVIVOR_WINS: 1,
    BUDGET_HAWK_MIN_BUDGET: 80_000,
    DOOM_DANCER_MIN_DOOM: 70,
    CLEAN_SLATE_MAX_DOOM: 10,
    VETERAN_GAMES: 10,
    UNDEFEATED_WINS: 5,
    SPEEDRUN_MAX_EVENTS: 3,
    CRISIS_VETERAN_MIN_EVENTS: 10,
    ALL_DEVICES_COUNT: 7
} as const;

// ==========================================================================
// Stats / Persistence
// ==========================================================================

export const STATS = {
    MAX_RUN_HISTORY: 10,
    STORAGE_KEY: 'hardware-is-hard-stats_v1'
} as const;

// ==========================================================================
// Audio
// ==========================================================================

export const AUDIO = {
    DOOM_DRONE_THRESHOLD: 50, // Drone starts above this doom level
    DOOM_DRONE_INTERVAL_MS: 3_000,
    MAX_DOOM_VOLUME: 0.15,
    DOOM_MIN_FREQ: 40,
    DOOM_FREQ_RANGE: 30, // 40–70 Hz
    DOOM_DRONE_DURATION: 0.5,
    MUTE_STORAGE_KEY: 'sound_muted'
} as const;

// ==========================================================================
// Game Loop
// ==========================================================================

export const GAME_LOOP = {
    FAST_SPEED_MULTIPLIER: 3.0,
    SYNC_THRESHOLD: 0.1 // Months delta before syncing accumulator
} as const;

// ==========================================================================
// Persistence (React adapter)
// ==========================================================================

export const PERSISTENCE = {
    LAST_PLAYED_DEVICE_KEY: 'lastPlayedDeviceId',
    FALLBACK_ORIGIN: 'https://www.deviceprophet.com/labs'
} as const;

// ==========================================================================
// Helpers
// ==========================================================================

export const monthsPerMs = (config: GameConfig): number =>
    config.totalMonths / config.gameDurationMs;
