/**
 * Event Processor Module
 *
 * Handles event filtering, eligibility checking, and probability-based selection.
 * Extracted from GameEngine for better separation of concerns.
 */

import type {
    GameEvent,
    HistoryEntry,
    ShieldDeflection,
    DataProvider,
    RandomProvider
} from './types';
import { evaluateCondition, createConditionContext } from './condition-parser';
import { calculateEventProbability } from './logic/event-logic';

/**
 * Context needed for event filtering
 */
export interface EventFilterContext {
    activeTags: readonly string[];
    history: readonly HistoryEntry[];
    timelineMonth: number;
    budget: number;
    doomLevel: number;
}

/**
 * Result of filtering events, includes deflections for tracking
 */
export interface EventFilterResult {
    eligible: GameEvent[];
    deflections: ShieldDeflection[];
}

/**
 * Filter events based on current game state.
 * Returns eligible events and any shield deflections that occurred.
 *
 * @param data - Data provider for accessing events
 * @param context - Current game context
 * @returns Eligible events and deflections
 */
export function filterEligibleEvents(
    data: DataProvider,
    context: EventFilterContext
): EventFilterResult {
    const allEvents = data.getEvents();
    const { activeTags, history, timelineMonth, budget, doomLevel } = context;

    const conditionContext = createConditionContext(
        timelineMonth,
        budget,
        doomLevel,
        activeTags.length,
        activeTags as string[]
    );

    const eligible: GameEvent[] = [];
    const deflections: ShieldDeflection[] = [];

    for (const event of allEvents) {
        // 1. Check if already happened (non-repeatable)
        if (!event.repeatable && history.some(h => h.eventId === event.id)) {
            continue;
        }

        // 2. Check trigger condition
        if (!evaluateCondition(event.triggerCondition, conditionContext)) {
            continue;
        }

        // 3. Check required tags (ALL must be present)
        if (event.requiredTags && event.requiredTags.length > 0) {
            const hasAllTags = event.requiredTags.every(tag => activeTags.includes(tag));
            if (!hasAllTags) continue;
        }

        // 4. Shield check (ANY blocking tag prevents event)
        if (event.blockedByTags && event.blockedByTags.length > 0) {
            const blockingTag = event.blockedByTags.find(tag => activeTags.includes(tag));
            if (blockingTag) {
                // Record shield deflection
                deflections.push({
                    month: timelineMonth,
                    eventId: event.id,
                    blockedByTag: blockingTag
                });
                continue;
            }
        }

        eligible.push(event);
    }

    return { eligible, deflections };
}

/**
 * Select an event using probability weighting.
 * Events must pass their probability check to be considered.
 *
 * @param events - List of eligible events
 * @param activeTags - Current active tags
 * @param doomLevel - Current doom level
 * @param random - Random provider
 * @returns Selected event or undefined
 */
export function selectEventByProbability(
    events: GameEvent[],
    activeTags: readonly string[],
    doomLevel: number,
    random: RandomProvider
): GameEvent | undefined {
    if (events.length === 0) return undefined;

    // Calculate probabilities and filter by roll
    const weighted: Array<{ event: GameEvent; prob: number }> = [];

    for (const event of events) {
        const prob = calculateEventProbability(event, activeTags as string[], doomLevel);
        // Roll against probability to filter
        if (random.random() < prob) {
            weighted.push({ event, prob });
        }
    }

    if (weighted.length === 0) {
        // Fallback: pick randomly from eligible if none passed probability check
        return random.pick(events);
    }

    // Pick randomly from events that passed probability check
    const choice = random.pick(weighted);
    return choice?.event;
}

/**
 * Check if an event is currently eligible based on tag requirements.
 *
 * @param event - Event to check
 * @param activeTags - Current active tags
 * @returns true if event's tag requirements are met
 */
export function checkEventTagRequirements(
    event: GameEvent,
    activeTags: readonly string[]
): { eligible: boolean; blockedBy?: string } {
    // Check required tags
    if (event.requiredTags && event.requiredTags.length > 0) {
        const hasAllTags = event.requiredTags.every(tag => activeTags.includes(tag));
        if (!hasAllTags) {
            return { eligible: false };
        }
    }

    // Check blocked by tags
    if (event.blockedByTags && event.blockedByTags.length > 0) {
        const blockingTag = event.blockedByTags.find(tag => activeTags.includes(tag));
        if (blockingTag) {
            return { eligible: false, blockedBy: blockingTag };
        }
    }

    return { eligible: true };
}
