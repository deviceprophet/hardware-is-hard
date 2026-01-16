/**
 * Random Provider Module
 *
 * Provides random number generation with support for both
 * truly random and seeded (deterministic) modes.
 */

import type { RandomProvider } from './types';

/**
 * Default random provider using Math.random
 */
export const defaultRandomProvider: RandomProvider = {
    random: () => Math.random(),
    randomInt: (max: number) => Math.floor(Math.random() * max),
    pick: <T>(array: readonly T[]): T | undefined => {
        if (array.length === 0) return undefined;
        return array[Math.floor(Math.random() * array.length)];
    }
};

/**
 * Create a seeded random provider for deterministic testing.
 * Uses a Linear Congruential Generator (LCG) algorithm.
 *
 * @param seed - The seed value for reproducible randomness
 * @returns A RandomProvider that produces deterministic sequences
 */
export function createSeededRandom(seed: number): RandomProvider {
    let state = seed;

    const next = (): number => {
        // LCG constants from Numerical Recipes
        state = (state * 1664525 + 1013904223) % 0x100000000;
        return state / 0x100000000;
    };

    return {
        random: next,
        randomInt: (max: number) => Math.floor(next() * max),
        pick: <T>(array: readonly T[]): T | undefined => {
            if (array.length === 0) return undefined;
            return array[Math.floor(next() * array.length)];
        }
    };
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 *
 * @param array - Array to shuffle (will be mutated)
 * @param random - Random provider to use
 */
export function shuffleArray<T>(array: T[], random: RandomProvider): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = random.randomInt(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
}
