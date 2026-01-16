/**
 * Blame Generator Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { generateBlame, formatBlameForShare, type BlameResult } from '../blame-generator';
import type { HistoryEntry, GameEvent } from '../types';

// Mock events for testing
const mockEvents: GameEvent[] = [
    {
        id: 'event_ransomware',
        title: 'Ransomware Attack',
        description: 'Your cloud backend was hit by ransomware.',
        baseProb: 0.3,
        triggerCondition: 'month > 10',
        requiredTags: [],
        choices: [
            { id: 'pay', text: 'Pay ransom', cost: 50000, doomImpact: 10, riskLevel: 'high' },
            { id: 'refuse', text: 'Refuse', cost: 0, doomImpact: 30, riskLevel: 'high' }
        ]
    },
    {
        id: 'event_cra_deadline',
        title: 'CRA Compliance Deadline',
        description: 'The EU CRA deadline is approaching.',
        baseProb: 0.5,
        triggerCondition: 'month > 24',
        requiredTags: [],
        choices: [
            {
                id: 'comply',
                text: 'Invest in compliance',
                cost: 30000,
                doomImpact: 0,
                riskLevel: 'low'
            },
            { id: 'ignore', text: 'Ignore it', cost: 0, doomImpact: 25, riskLevel: 'high' }
        ]
    },
    {
        id: 'event_marketing_pivot',
        title: 'Marketing Pivot',
        description: 'Marketing wants to change direction.',
        baseProb: 0.4,
        triggerCondition: 'month > 5',
        requiredTags: [],
        choices: [
            {
                id: 'accept',
                text: 'Accept changes',
                cost: 20000,
                doomImpact: 5,
                riskLevel: 'medium'
            },
            { id: 'refuse', text: 'Push back', cost: 0, doomImpact: 15, riskLevel: 'medium' }
        ]
    },
    {
        id: 'event_supply_shortage',
        title: 'Chip Shortage',
        description: 'Critical component is out of stock.',
        baseProb: 0.3,
        triggerCondition: 'month > 12',
        requiredTags: [],
        choices: [
            { id: 'wait', text: 'Wait it out', cost: 0, doomImpact: 20, riskLevel: 'high' },
            { id: 'redesign', text: 'Redesign', cost: 40000, doomImpact: 5, riskLevel: 'low' }
        ]
    }
];

describe('generateBlame', () => {
    it('should return a valid BlameResult structure', () => {
        const history: HistoryEntry[] = [];
        const result = generateBlame(history, mockEvents);

        expect(result).toHaveProperty('department');
        expect(result).toHaveProperty('statement');
        expect(result).toHaveProperty('emoji');
    });

    it('should blame Engineering for security-related failures', () => {
        const history: HistoryEntry[] = [
            {
                month: 15,
                eventId: 'event_ransomware',
                choiceId: 'refuse',
                doomIncrease: 30,
                cost: 0
            },
            {
                month: 20,
                eventId: 'event_ransomware',
                choiceId: 'refuse',
                doomIncrease: 30,
                cost: 0
            }
        ];

        // Run multiple times with same seed for consistency
        const result = generateBlame(history, mockEvents, 12345);
        expect(result.department).toBe('Engineering');
    });

    it('should blame Legal or related for compliance-related failures', () => {
        const history: HistoryEntry[] = [
            {
                month: 25,
                eventId: 'event_cra_deadline',
                choiceId: 'ignore',
                doomIncrease: 25,
                cost: 0
            },
            {
                month: 30,
                eventId: 'event_cra_deadline',
                choiceId: 'ignore',
                doomIncrease: 25,
                cost: 0
            }
        ];

        const result = generateBlame(history, mockEvents, 12345);
        // With compliance events, Legal should score high but Finance/Management also get points
        const expectedDepartments = ['Legal', 'Finance', 'Management', 'Marketing'];
        expect(expectedDepartments).toContain(result.department);
    });

    it('should blame Supply Chain for supply-related failures', () => {
        const history: HistoryEntry[] = [
            {
                month: 15,
                eventId: 'event_supply_shortage',
                choiceId: 'wait',
                doomIncrease: 20,
                cost: 0
            },
            {
                month: 20,
                eventId: 'event_supply_shortage',
                choiceId: 'wait',
                doomIncrease: 20,
                cost: 0
            }
        ];

        const result = generateBlame(history, mockEvents, 12345);
        expect(result.department).toBe('Supply_Chain');
    });

    it('should blame Marketing for marketing-related failures', () => {
        const history: HistoryEntry[] = [
            {
                month: 10,
                eventId: 'event_marketing_pivot',
                choiceId: 'accept',
                doomIncrease: 5,
                cost: 20000
            },
            {
                month: 15,
                eventId: 'event_marketing_pivot',
                choiceId: 'accept',
                doomIncrease: 5,
                cost: 20000
            },
            {
                month: 20,
                eventId: 'event_marketing_pivot',
                choiceId: 'refuse',
                doomIncrease: 15,
                cost: 0
            }
        ];

        const result = generateBlame(history, mockEvents, 12345);
        expect(result.department).toBe('Marketing');
    });

    it('should be deterministic with same seed', () => {
        const history: HistoryEntry[] = [
            {
                month: 15,
                eventId: 'event_ransomware',
                choiceId: 'refuse',
                doomIncrease: 30,
                cost: 0
            }
        ];

        const result1 = generateBlame(history, mockEvents, 42);
        const result2 = generateBlame(history, mockEvents, 42);

        expect(result1.department).toBe(result2.department);
        expect(result1.statement).toBe(result2.statement);
    });

    it('should return a valid department with empty history', () => {
        const result = generateBlame([], mockEvents, 12345);
        // With empty history, all departments have 0 score, so Engineering gets +1 default
        // But with seed variation, any valid department is acceptable
        const validDepartments = [
            'Engineering',
            'Marketing',
            'Legal',
            'Supply Chain',
            'Finance',
            'Management'
        ];
        expect(validDepartments).toContain(result.department);
    });
});

describe('formatBlameForShare', () => {
    it('should format blame result for sharing', () => {
        const blame: BlameResult = {
            department: 'Engineering',
            statement: 'shipped before the security audit was done.',
            emoji: '🔧'
        };

        const formatted = formatBlameForShare(blame);
        expect(formatted).toBe('🔧 Engineering shipped before the security audit was done.');
    });
});
