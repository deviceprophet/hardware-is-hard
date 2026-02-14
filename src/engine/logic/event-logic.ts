import type { GameEvent } from '../types';
import { EVENT_PROBABILITY, RISKY_TAGS } from '../constants';

/**
 * Calculate the probability of an event triggering based on game state.
 */
export const calculateEventProbability = (
    event: GameEvent,
    activeTags: string[],
    doomLevel: number
): number => {
    let prob = event.baseProb ?? EVENT_PROBABILITY.DEFAULT_BASE;

    // Doom accelerator: high doom attracts more events
    prob += doomLevel / EVENT_PROBABILITY.DOOM_DIVISOR;

    // Tag modifiers - risky tags increase probability
    for (const tag of RISKY_TAGS) {
        if (activeTags.includes(tag)) {
            prob += EVENT_PROBABILITY.RISKY_TAG_BOOST;
        }
    }

    return Math.min(EVENT_PROBABILITY.MAX_PROBABILITY, prob);
};
