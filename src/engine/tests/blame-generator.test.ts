/**
 * Blame Generator Unit Tests
 *
 * Targeted at killing surviving Stryker mutants, especially around
 * Finance/Management scoring thresholds and boundary conditions.
 */

import { describe, it, expect } from 'vitest';
import { generateBlame, formatBlameForShare, type BlameResult } from '../blame-generator';
import { createMockEvent } from './factories';
import type { HistoryEntry, GameEvent } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A generic event that matches NO department keywords */
const neutralEvent = createMockEvent({
    id: 'neutral_event',
    title: 'Nothing Special'
});

/** Build a minimal HistoryEntry inline */
const entry = (overrides: Partial<HistoryEntry> & { eventId: string }): HistoryEntry => ({
    month: 10,
    choiceId: 'c1',
    cost: 0,
    doomIncrease: 0,
    ...overrides
});

// ---------------------------------------------------------------------------
// Finance scoring
// ---------------------------------------------------------------------------

describe('Finance scoring', () => {
    it('scores Finance when cost=0 and doomIncrease > 10', () => {
        const events: GameEvent[] = [neutralEvent];
        const history: HistoryEntry[] = [
            entry({ eventId: 'neutral_event', cost: 0, doomIncrease: 15 })
        ];
        const result = generateBlame(history, events, 42);
        // Finance is the only department that can score here (no keywords, doom < 20)
        expect(result.department).toBe('Finance');
    });

    it('does NOT score Finance when cost > 0', () => {
        const events: GameEvent[] = [neutralEvent];
        const history: HistoryEntry[] = [
            entry({ eventId: 'neutral_event', cost: 100, doomIncrease: 15 })
        ];
        const result = generateBlame(history, events, 42);
        // cost > 0 means Finance does not score; no keywords match either
        // Only default Engineering should win
        expect(result.department).toBe('Engineering');
    });

    it('does NOT score Finance when doomIncrease = 10 (boundary)', () => {
        const events: GameEvent[] = [neutralEvent];
        const history: HistoryEntry[] = [
            entry({ eventId: 'neutral_event', cost: 0, doomIncrease: 10 })
        ];
        const result = generateBlame(history, events, 42);
        // doomIncrease must be > 10, not >= 10, so Finance does not score
        expect(result.department).toBe('Engineering');
    });

    it('scores Finance when doomIncrease = 11 (just above threshold)', () => {
        const events: GameEvent[] = [neutralEvent];
        const history: HistoryEntry[] = [
            entry({ eventId: 'neutral_event', cost: 0, doomIncrease: 11 })
        ];
        const result = generateBlame(history, events, 42);
        expect(result.department).toBe('Finance');
    });
});

// ---------------------------------------------------------------------------
// Management scoring
// ---------------------------------------------------------------------------

describe('Management scoring', () => {
    it('scores Management when doomIncrease >= 20', () => {
        const events: GameEvent[] = [neutralEvent];
        const history: HistoryEntry[] = [
            entry({ eventId: 'neutral_event', cost: 500, doomIncrease: 20 })
        ];
        // cost > 0 so Finance won't score; doom >= 20 so Management scores
        const result = generateBlame(history, events, 42);
        expect(result.department).toBe('Management');
    });

    it('does NOT score Management when doomIncrease = 19', () => {
        const events: GameEvent[] = [neutralEvent];
        const history: HistoryEntry[] = [
            entry({ eventId: 'neutral_event', cost: 500, doomIncrease: 19 })
        ];
        // cost > 0 blocks Finance, doom < 20 blocks Management → default Engineering
        const result = generateBlame(history, events, 42);
        expect(result.department).toBe('Engineering');
    });

    it('scores Management when doomIncrease = 25', () => {
        const events: GameEvent[] = [neutralEvent];
        const history: HistoryEntry[] = [
            entry({ eventId: 'neutral_event', cost: 500, doomIncrease: 25 })
        ];
        const result = generateBlame(history, events, 42);
        expect(result.department).toBe('Management');
    });
});

// ---------------------------------------------------------------------------
// Keyword-based department scoring
// ---------------------------------------------------------------------------

describe('Keyword-based scoring', () => {
    it('scores Engineering for event id containing "ransomware"', () => {
        const events: GameEvent[] = [
            createMockEvent({ id: 'ransomware_attack', title: 'Bad Day' })
        ];
        const history: HistoryEntry[] = [
            entry({ eventId: 'ransomware_attack', cost: 500, doomIncrease: 5 })
        ];
        const result = generateBlame(history, events, 42);
        expect(result.department).toBe('Engineering');
    });

    it('scores Marketing for event id containing "marketing"', () => {
        const events: GameEvent[] = [createMockEvent({ id: 'marketing_push', title: 'Big Push' })];
        const history: HistoryEntry[] = [
            entry({ eventId: 'marketing_push', cost: 500, doomIncrease: 5 })
        ];
        const result = generateBlame(history, events, 42);
        expect(result.department).toBe('Marketing');
    });

    it('scores Legal for event id containing "gdpr"', () => {
        const events: GameEvent[] = [createMockEvent({ id: 'gdpr_fine', title: 'Big Fine' })];
        const history: HistoryEntry[] = [
            entry({ eventId: 'gdpr_fine', cost: 500, doomIncrease: 5 })
        ];
        const result = generateBlame(history, events, 42);
        expect(result.department).toBe('Legal');
    });

    it('scores Supply Chain for event id containing "supply"', () => {
        const events: GameEvent[] = [createMockEvent({ id: 'supply_crisis', title: 'Crisis' })];
        const history: HistoryEntry[] = [
            entry({ eventId: 'supply_crisis', cost: 500, doomIncrease: 5 })
        ];
        const result = generateBlame(history, events, 42);
        expect(result.department).toBe('Supply_Chain');
    });

    it('scores Engineering for event title containing "security"', () => {
        const events: GameEvent[] = [
            createMockEvent({ id: 'some_event_xyz', title: 'A security breach occurred' })
        ];
        const history: HistoryEntry[] = [
            entry({ eventId: 'some_event_xyz', cost: 500, doomIncrease: 5 })
        ];
        const result = generateBlame(history, events, 42);
        expect(result.department).toBe('Engineering');
    });
});

// ---------------------------------------------------------------------------
// Default behavior
// ---------------------------------------------------------------------------

describe('Default behavior', () => {
    it('defaults to Engineering with empty history', () => {
        const result = generateBlame([], [neutralEvent], 42);
        expect(result.department).toBe('Engineering');
    });

    it('defaults to Engineering when no keywords match and doom is low', () => {
        const events: GameEvent[] = [neutralEvent];
        const history: HistoryEntry[] = [
            entry({ eventId: 'neutral_event', cost: 500, doomIncrease: 5 })
        ];
        // cost > 0 blocks Finance, doom < 20 blocks Management, no keywords
        const result = generateBlame(history, events, 42);
        expect(result.department).toBe('Engineering');
    });
});

// ---------------------------------------------------------------------------
// generateBlame output format
// ---------------------------------------------------------------------------

describe('generateBlame output format', () => {
    it('replaces spaces with underscores in department key', () => {
        const events: GameEvent[] = [createMockEvent({ id: 'supply_crisis', title: 'Crisis' })];
        const history: HistoryEntry[] = [
            entry({ eventId: 'supply_crisis', cost: 500, doomIncrease: 5 })
        ];
        const result = generateBlame(history, events, 42);
        expect(result.department).toBe('Supply_Chain');
        expect(result.department).not.toContain(' ');
    });

    it('statement is a numeric string index', () => {
        const result = generateBlame([], [neutralEvent], 42);
        expect(typeof result.statement).toBe('string');
        expect(Number.isNaN(Number(result.statement))).toBe(false);
    });

    it('emoji is a non-empty string', () => {
        const result = generateBlame([], [neutralEvent], 42);
        expect(typeof result.emoji).toBe('string');
        expect(result.emoji.length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// formatBlameForShare
// ---------------------------------------------------------------------------

describe('formatBlameForShare', () => {
    it('formats as "emoji department statement"', () => {
        const blame: BlameResult = {
            department: 'Engineering',
            statement: '2',
            emoji: '🔧'
        };
        expect(formatBlameForShare(blame)).toBe('🔧 Engineering 2');
    });

    it('includes all three fields separated by spaces', () => {
        const blame: BlameResult = {
            department: 'Supply_Chain',
            statement: '0',
            emoji: '📦'
        };
        const formatted = formatBlameForShare(blame);
        expect(formatted).toBe('📦 Supply_Chain 0');
    });
});

// ---------------------------------------------------------------------------
// Deterministic seeded behavior
// ---------------------------------------------------------------------------

describe('Deterministic seeded behavior', () => {
    it('produces identical results with the same seed', () => {
        const events: GameEvent[] = [neutralEvent];
        const history: HistoryEntry[] = [
            entry({ eventId: 'neutral_event', cost: 0, doomIncrease: 15 })
        ];

        const result1 = generateBlame(history, events, 99);
        const result2 = generateBlame(history, events, 99);

        expect(result1.department).toBe(result2.department);
        expect(result1.statement).toBe(result2.statement);
        expect(result1.emoji).toBe(result2.emoji);
    });

    it('different seeds can produce different results in a tie scenario', () => {
        // With empty history, Engineering gets default score 1. All other depts 0.
        // Not a true multi-way tie, so let's create a tie between Finance and Management.
        // cost=0, doomIncrease=25 → Finance scores +1 (cost==0, doom>10),
        //                           Management scores +1 (doom>=20). Tie at 1 each.
        const events: GameEvent[] = [neutralEvent];
        const history: HistoryEntry[] = [
            entry({ eventId: 'neutral_event', cost: 0, doomIncrease: 25 })
        ];

        const results = new Set<string>();
        // Try many seeds to find divergence
        for (let seed = 0; seed < 200; seed++) {
            results.add(generateBlame(history, events, seed).department);
        }
        // With enough seeds, a tie between Finance and Management should produce both
        expect(results.size).toBeGreaterThanOrEqual(2);
    });
});
