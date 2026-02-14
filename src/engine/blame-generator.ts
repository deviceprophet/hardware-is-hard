/**
 * Blame Generator
 *
 * Analyzes game history to generate humorous blame attribution
 * for device failure, targeting different "departments".
 */

import type { HistoryEntry, GameEvent } from './types';
import { BLAME } from './constants';

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

/** Keywords that map events to responsible departments */
const DEPARTMENT_KEYWORDS: { department: BlameDepartment; ids: string[]; titles: string[] }[] = [
    {
        department: 'Engineering',
        ids: ['ransomware', 'exploit', 'botnet', 'debug', 'vuln'],
        titles: ['security', 'hack']
    },
    {
        department: 'Marketing',
        ids: ['marketing', 'pivot', 'feature'],
        titles: ['deadline', 'launch']
    },
    {
        department: 'Legal',
        ids: ['cra', 'gdpr', 'compliance', 'psti', 'red_'],
        titles: ['regulation', 'enforcement']
    },
    {
        department: 'Supply Chain',
        ids: ['supply', 'shortage', 'eol', 'silicon'],
        titles: ['chip', 'component']
    }
];

/** Score each department based on event history */
const scoreDepartments = (history: HistoryEntry[], events: GameEvent[]): DepartmentScore[] => {
    const scores: DepartmentScore[] = [
        { department: 'Engineering', score: 0 },
        { department: 'Marketing', score: 0 },
        { department: 'Legal', score: 0 },
        { department: 'Supply Chain', score: 0 },
        { department: 'Finance', score: 0 },
        { department: 'Management', score: 0 }
    ];

    const scoreMap = new Map(scores.map(s => [s.department, s]));

    for (const entry of history) {
        const event = events.find(e => e.id === entry.eventId);
        if (!event) continue;

        const eventId = event.id.toLowerCase();
        const title = event.title.toLowerCase();

        // Match keyword-based departments
        for (const { department, ids, titles } of DEPARTMENT_KEYWORDS) {
            if (ids.some(k => eventId.includes(k)) || titles.some(k => title.includes(k))) {
                scoreMap.get(department)!.score += BLAME.CATEGORY_MATCH_SCORE;
            }
        }

        // Finance: chose cheap option with high doom
        if (entry.cost === 0 && entry.doomIncrease > BLAME.FINANCE_DOOM_THRESHOLD) {
            scoreMap.get('Finance')!.score += BLAME.SECONDARY_SCORE;
        }

        // Management: large doom increases
        if (entry.doomIncrease >= BLAME.MANAGEMENT_DOOM_THRESHOLD) {
            scoreMap.get('Management')!.score += BLAME.SECONDARY_SCORE;
        }
    }

    // Default to Engineering if no department scored
    const maxScore = Math.max(...scores.map(s => s.score));
    if (maxScore === 0) {
        scores[0]!.score = BLAME.DEFAULT_SCORE;
    }

    return scores;
};

/** Pick a winning department from scores, breaking ties with RNG */
const selectWinner = (scores: DepartmentScore[], seed?: number): BlameDepartment => {
    const maxScore = Math.max(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === maxScore);
    const random = seed !== undefined ? seededRandom(seed) : Math.random();
    return winners[Math.floor(random * winners.length)]!.department;
};

/** Pick a random blame template for the winning department */
const selectTemplate = (
    department: BlameDepartment,
    seed?: number
): { emoji: string; count: number } => {
    const templates = BLAME_TEMPLATES[department];
    const random = seed !== undefined ? seededRandom(seed + 1) : Math.random();
    return templates[Math.floor(random * templates.length)]!;
};

/**
 * Analyze game history to determine which "department" to blame
 */
export const generateBlame = (
    history: HistoryEntry[],
    events: GameEvent[],
    seed?: number
): BlameResult => {
    const scores = scoreDepartments(history, events);
    const department = selectWinner(scores, seed);
    const template = selectTemplate(department, seed);

    return {
        department: department.replace(' ', '_'),
        statement: template.count.toString(),
        emoji: template.emoji
    };
};

/**
 * Simple seeded random for deterministic blame generation
 */
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * BLAME.SEEDED_RANDOM_MULTIPLIER;
    return x - Math.floor(x);
}

/**
 * Generate a shareable blame statement
 */
export function formatBlameForShare(blame: BlameResult): string {
    return `${blame.emoji} ${blame.department} ${blame.statement}`;
}
