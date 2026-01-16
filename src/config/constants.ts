/**
 * Centralized Constants
 *
 * All magic numbers and configuration values in one place.
 * Makes it easy to tune game balance and understand system limits.
 */

// ============================================================================
// Game Configuration
// ============================================================================

/** Total months in a full game (5 years) */
export const GAME_TOTAL_MONTHS = 60;

/** Maximum doom level before game over */
export const MAX_DOOM_LEVEL = 100;

/** Base interval between events (in game months) */
export const EVENT_INTERVAL_MONTHS = 4;

/** Real-time duration for full game in development (ms) */
export const GAME_DURATION_MS_DEV = 180000; // 3 minutes

/** Real-time duration for full game in production (ms) */
export const GAME_DURATION_MS_PROD = 300000; // 5 minutes

// ============================================================================
// UI Configuration
// ============================================================================

/** Animation durations (ms) */
export const ANIMATION = {
    FADE_IN: 300,
    FADE_OUT: 200,
    TRANSITION_DEFAULT: 200,
    PULSE_INTERVAL: 1000,
    CONFETTI_DURATION: 3000
} as const;

/** Breakpoints for responsive design (matches Tailwind defaults) */
export const BREAKPOINTS = {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536
} as const;

/** Z-index layers */
export const Z_INDEX = {
    BASE: 0,
    OVERLAY: 10,
    MODAL: 20,
    TOOLTIP: 30,
    FOOTER: 40,
    TOAST: 50
} as const;

// ============================================================================
// Gameplay Balance
// ============================================================================

/** Doom level thresholds for color coding */
export const DOOM_THRESHOLDS = {
    SAFE: 40,
    WARNING: 60,
    DANGER: 80,
    CRITICAL: 100
} as const;

/** Compliance level thresholds */
export const COMPLIANCE_THRESHOLDS = {
    POOR: 40,
    ACCEPTABLE: 70,
    EXCELLENT: 90
} as const;

/** Budget thresholds for color coding */
export const BUDGET_THRESHOLDS = {
    CRITICAL: 0,
    LOW: 50000,
    HEALTHY: 100000
} as const;

/** Ship product thresholds */
export const SHIP_THRESHOLDS = {
    MAX_DOOM_TO_SHIP: 50, // Can't ship if doom > 50
    SHIP_COST: 20000,
    SHIP_REVENUE: 50000,
    SHIP_DOOM_PENALTY: 5
} as const;

// ============================================================================
// Social Sharing
// ============================================================================

export const SHARE = {
    HASHTAGS: ['TheRecallRun', 'HardwareIsHard', 'EmbeddedHorror'],
    TWITTER_URL: 'https://twitter.com/intent/tweet',
    LINKEDIN_URL: 'https://www.linkedin.com/sharing/share-offsite/'
} as const;

// ============================================================================
// Local Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
    GAME_SAVE: 'hardware_game_save',
    HIGH_SCORES: 'hardware_high_scores',
    TUTORIAL_COMPLETED: 'hardware_tutorial_completed',
    SOUND_MUTED: 'hardware_sound_muted',
    LANGUAGE: 'hardware_language'
} as const;

// ============================================================================
// API / External URLs
// ============================================================================

export const URLS = {
    WEBSITE: 'https://deviceprophet.com',
    PRIVACY: 'https://deviceprophet.com/privacy',
    GITHUB: 'https://github.com/deviceprophet/hardware-is-hard',
    LABS: 'https://www.deviceprophet.com/labs'
} as const;
