/**
 * Blame Generator
 *
 * Analyzes game history to generate humorous blame attribution
 * for device failure, targeting different "departments".
 */

import type { HistoryEntry, GameEvent } from './types';

export type BlameDepartment =
    | 'Engineering'
    | 'Marketing'
    | 'Legal'
    | 'Supply Chain'
    | 'Finance'
    | 'Management';

export interface BlameResult {
    department: string; // Translation key: blame.departments.X
    statement: string; // Translation key: blame.statements.X.index
    emoji: string;
}

interface DepartmentScore {
    department: BlameDepartment;
    score: number;
}

const BLAME_TEMPLATES: Record<BlameDepartment, { emoji: string; count: number }[]> = {
    Engineering: [
        { emoji: '🔧', count: 0 },
        { emoji: '💻', count: 1 },
        { emoji: '🚪', count: 2 },
        { emoji: '⏰', count: 3 },
        { emoji: '🔐', count: 4 }
    ],
    Marketing: [
        { emoji: '📢', count: 0 },
        { emoji: '📅', count: 1 },
        { emoji: '🎄', count: 2 },
        { emoji: '📡', count: 3 },
        { emoji: '🚀', count: 4 }
    ],
    Legal: [
        { emoji: '⚖️', count: 0 },
        { emoji: '🇪🇺', count: 1 },
        { emoji: '📜', count: 2 },
        { emoji: '📋', count: 3 }
    ],
    'Supply Chain': [
        { emoji: '📦', count: 0 },
        { emoji: '🔌', count: 1 },
        { emoji: '⚠️', count: 2 },
        { emoji: '🛒', count: 3 }
    ],
    Finance: [
        { emoji: '💰', count: 0 },
        { emoji: '📉', count: 1 },
        { emoji: '☁️', count: 2 },
        { emoji: '💸', count: 3 }
    ],
    Management: [
        { emoji: '🔗', count: 0 },
        { emoji: '📊', count: 1 },
        { emoji: '🔄', count: 2 },
        { emoji: '🙈', count: 3 }
    ]
};

/**
 * Analyze game history to determine which "department" to blame
 */
export function generateBlame(
    history: HistoryEntry[],
    events: GameEvent[],
    seed?: number
): BlameResult {
    const scores: DepartmentScore[] = [
        { department: 'Engineering', score: 0 },
        { department: 'Marketing', score: 0 },
        { department: 'Legal', score: 0 },
        { department: 'Supply Chain', score: 0 },
        { department: 'Finance', score: 0 },
        { department: 'Management', score: 0 }
    ];

    // Analyze history to score departments
    for (const entry of history) {
        const event = events.find(e => e.id === entry.eventId);
        if (!event) continue;

        const eventId = event.id.toLowerCase();
        const title = event.title.toLowerCase();

        // Engineering issues
        if (
            eventId.includes('ransomware') ||
            eventId.includes('exploit') ||
            eventId.includes('botnet') ||
            eventId.includes('debug') ||
            eventId.includes('vuln') ||
            title.includes('security') ||
            title.includes('hack')
        ) {
            scores[0].score += 2;
        }

        // Legal/Compliance issues
        if (
            eventId.includes('cra') ||
            eventId.includes('gdpr') ||
            eventId.includes('compliance') ||
            eventId.includes('psti') ||
            eventId.includes('red_') ||
            title.includes('regulation') ||
            title.includes('enforcement')
        ) {
            scores[2].score += 2;
        }

        // Supply chain issues
        if (
            eventId.includes('supply') ||
            eventId.includes('shortage') ||
            eventId.includes('eol') ||
            eventId.includes('silicon') ||
            title.includes('chip') ||
            title.includes('component')
        ) {
            scores[3].score += 2;
        }

        // Marketing issues
        if (
            eventId.includes('marketing') ||
            eventId.includes('pivot') ||
            eventId.includes('feature') ||
            title.includes('deadline') ||
            title.includes('launch')
        ) {
            scores[1].score += 2;
        }

        // Finance issues - chose cheap option
        if (entry.cost === 0 && entry.doomIncrease > 10) {
            scores[4].score += 1;
        }

        // Large doom increase suggests management failure
        if (entry.doomIncrease >= 20) {
            scores[5].score += 1;
        }
    }

    // If no clear winner, default to Engineering (classic blame target)
    const maxScore = Math.max(...scores.map(s => s.score));
    if (maxScore === 0) {
        scores[0].score = 1; // Default to Engineering
    }

    // Find winners (could be ties)
    const winners = scores.filter(s => s.score === maxScore);

    // Use seed for deterministic selection, or random
    const random = seed !== undefined ? seededRandom(seed) : Math.random();

    const winner = winners[Math.floor(random * winners.length)];
    const templates = BLAME_TEMPLATES[winner.department];

    const templateIndex = Math.floor(
        (seed !== undefined ? seededRandom(seed + 1) : Math.random()) * templates.length
    );

    const template = templates[templateIndex];

    return {
        department: winner.department.replace(' ', '_'),
        statement: template.count.toString(),
        emoji: template.emoji
    };
}

/**
 * Simple seeded random for deterministic blame generation
 */
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

/**
 * Generate a shareable blame statement
 */
export function formatBlameForShare(blame: BlameResult): string {
    return `${blame.emoji} ${blame.department} ${blame.statement}`;
}
