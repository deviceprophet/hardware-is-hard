/**
 * Game State Compression Utilities
 *
 * Uses lz-string to compress game state for URL sharing.
 * This allows sharing full game states (including history) in ~2KB URLs.
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { GameStateSnapshot } from '../engine/types';

/**
 * Compress a game state snapshot for URL sharing.
 * Returns a URL-safe compressed string.
 */
export function compressGameState(state: GameStateSnapshot): string {
    const json = JSON.stringify(state);
    const compressed = compressToEncodedURIComponent(json);
    return compressed;
}

/**
 * Decompress a game state from a URL parameter.
 * Returns the parsed state or null if invalid.
 */
export function decompressGameState(compressed: string): GameStateSnapshot | null {
    try {
        const json = decompressFromEncodedURIComponent(compressed);
        if (!json) return null;
        return JSON.parse(json) as GameStateSnapshot;
    } catch (e) {
        console.error('[decompressGameState] Failed to decompress:', e);
        return null;
    }
}

/**
 * Generate a shareable URL containing the full compressed game state.
 * @param state The game state to share
 * @param baseUrl The base URL (defaults to current origin)
 */
export function generateShareUrl(state: GameStateSnapshot, baseUrl?: string): string {
    const compressed = compressGameState(state);
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}?save=${compressed}`;
}

/**
 * Extract and decompress a game state from the current URL.
 * Returns null if no save parameter is present or if decompression fails.
 */
export function extractStateFromUrl(): GameStateSnapshot | null {
    if (typeof window === 'undefined') return null;

    const params = new URLSearchParams(window.location.search);
    const compressed = params.get('save');

    if (!compressed) return null;

    return decompressGameState(compressed);
}

/**
 * Check the size of a compressed state in bytes.
 * Useful for debugging URL length limits.
 */
export function getCompressedSize(state: GameStateSnapshot): { bytes: number; chars: number } {
    const compressed = compressGameState(state);
    return {
        bytes: new Blob([compressed]).size,
        chars: compressed.length
    };
}

// ============================================================================
// Result URL System - Lightweight shareable results
// ============================================================================

/**
 * Lightweight game result for sharing (much smaller than full save state).
 * Uses short keys to minimize URL length.
 */
export interface GameResult {
    v: 1; // Version for future compatibility
    o: 'v' | 'r'; // Outcome: victory or recall
    d: string; // Device ID (for localization)
    m: number; // Final month
    b: number; // Final budget (rounded)
    dm: number; // Final doom level (rounded)
    c: number; // Final compliance (rounded)
    l: string; // Language code
}

/**
 * Generate a result object from game state.
 */
export function createGameResult(
    state: GameStateSnapshot,
    outcome: 'victory' | 'recall',
    language: string = 'en'
): GameResult {
    return {
        v: 1,
        o: outcome === 'victory' ? 'v' : 'r',
        d: state.selectedDevice?.id || 'unknown',
        m: Math.round(state.timelineMonth),
        b: Math.round(state.budget),
        dm: Math.round(state.doomLevel),
        c: Math.round(state.complianceLevel),
        l: language
    };
}

/**
 * Compress a game result for URL sharing.
 * Much smaller than full state - typically ~50-80 chars.
 */
export function compressGameResult(result: GameResult): string {
    const json = JSON.stringify(result);
    return compressToEncodedURIComponent(json);
}

/**
 * Decompress a game result from URL parameter.
 */
export function decompressGameResult(compressed: string): GameResult | null {
    try {
        const json = decompressFromEncodedURIComponent(compressed);
        if (!json) return null;
        return JSON.parse(json) as GameResult;
    } catch (e) {
        console.error('[decompressGameResult] Failed to decompress:', e);
        return null;
    }
}

/**
 * Generate a shareable result URL (lightweight, for social sharing).
 */
export function generateResultUrl(
    state: GameStateSnapshot,
    outcome: 'victory' | 'recall',
    language: string = 'en',
    baseUrl?: string
): string {
    const result = createGameResult(state, outcome, language);
    const compressed = compressGameResult(result);
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}?result=${compressed}`;
}

/**
 * Extract result from current URL.
 */
export function extractResultFromUrl(): GameResult | null {
    if (typeof window === 'undefined') return null;

    const params = new URLSearchParams(window.location.search);
    const compressed = params.get('result');

    if (!compressed) return null;

    return decompressGameResult(compressed);
}
