import type { GameEvent } from '../types';

/**
 * Calculate the probability of an event triggering based on game state.
 *
 * @param event The event to evaluate
 * @param activeTags Currently active tags in the game state
 * @param doomLevel Current doom level (0-100)
 * @returns Probability between 0 and 1
 */
export function calculateEventProbability(
    event: GameEvent,
    activeTags: string[],
    doomLevel: number
): number {
    // Start with base probability (default 0.3)
    let prob = event.baseProb ?? 0.3;

    // Doom accelerator: high doom attracts more events (chaos begets chaos)
    prob += doomLevel / 500; // Max +0.2 at doom=100

    // Tag modifiers - events with matching "risky" tags are more likely
    const riskyTags = [
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
    ];

    for (const tag of riskyTags) {
        if (activeTags.includes(tag)) {
            prob += 0.05; // +5% per risky tag
        }
    }

    return Math.min(0.95, prob);
}
