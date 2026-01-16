/**
 * Game Engine Constants
 *
 * All configurable game parameters in one place.
 */

import type { GameConfig } from './types';

// Default game configuration
export const DEFAULT_CONFIG: GameConfig = {
    totalMonths: 60, // 5 years
    eventsPerGame: 10, // Target number of events (reduced for balance)
    eventIntervalMonths: 6, // Roughly 60/10 - more breathing room
    maxDoom: 100, // Game over threshold
    gameDurationMs: 150_000 // 150 seconds real-time (slower default)
};

// Initial state values
export const INITIAL_BUDGET = 100_000;
export const INITIAL_DOOM = 0;
export const INITIAL_MONTH = 0;

// Calculation helpers
export const monthsPerMs = (config: GameConfig): number =>
    config.totalMonths / config.gameDurationMs;

// OTA Monetization Settings
export const OTA_MONETIZATION_CONFIG = {
    REWARD: 35000,
    DOOM_PENALTY: 10
};
