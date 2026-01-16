/**
 * Data Provider Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
    createDataProvider,
    validateDevice,
    validateEvent,
    createValidatedDataProvider
} from '../data-provider';
import type { Device, GameEvent } from '../types';

describe('createDataProvider', () => {
    const mockDevices: Device[] = [
        {
            id: 'test-device-1',
            name: 'Test Device 1',
            description: 'A test device',
            archetype: 'corporate',
            difficulty: 'easy',
            initialTags: ['tag1', 'tag2'],
            initialBudget: 100000,
            monthlyMaintenanceCost: 1000,
            eolMonth: 48
        },
        {
            id: 'test-device-2',
            name: 'Test Device 2',
            description: 'Another test device',
            archetype: 'consumer',
            difficulty: 'hard',
            initialTags: ['tag3'],
            initialBudget: 50000,
            monthlyMaintenanceCost: 2000,
            eolMonth: 36
        }
    ];

    const mockEvents: GameEvent[] = [
        {
            id: 'test-event-1',
            title: 'Test Event',
            description: 'A test event',
            choices: [
                {
                    id: 'choice-1',
                    text: 'Choice 1',
                    cost: 1000,
                    doomImpact: 5,
                    riskLevel: 'low'
                }
            ]
        }
    ];

    it('should return all devices', () => {
        const provider = createDataProvider(mockDevices, mockEvents);
        expect(provider.getDevices()).toHaveLength(2);
        expect(provider.getDevices()).toEqual(mockDevices);
    });

    it('should return all events', () => {
        const provider = createDataProvider(mockDevices, mockEvents);
        expect(provider.getEvents()).toHaveLength(1);
    });

    it('should get device by id', () => {
        const provider = createDataProvider(mockDevices, mockEvents);
        const device = provider.getDevice('test-device-1');
        expect(device).toBeDefined();
        expect(device?.name).toBe('Test Device 1');
    });

    it('should return undefined for non-existent device', () => {
        const provider = createDataProvider(mockDevices, mockEvents);
        expect(provider.getDevice('non-existent')).toBeUndefined();
    });

    it('should get event by id', () => {
        const provider = createDataProvider(mockDevices, mockEvents);
        const event = provider.getEvent('test-event-1');
        expect(event).toBeDefined();
        expect(event?.title).toBe('Test Event');
    });

    it('should return undefined for non-existent event', () => {
        const provider = createDataProvider(mockDevices, mockEvents);
        expect(provider.getEvent('non-existent')).toBeUndefined();
    });
});

describe('validateDevice', () => {
    it('should validate a correct device', () => {
        const device = {
            id: 'test',
            name: 'Test',
            description: 'Desc',
            archetype: 'corporate',
            difficulty: 'easy',
            initialTags: [],
            initialBudget: 100000,
            monthlyMaintenanceCost: 1000,
            eolMonth: 48
        };
        expect(validateDevice(device)).toBe(true);
    });

    it('should reject device with missing id', () => {
        const device = {
            name: 'Test',
            description: 'Desc',
            archetype: 'corporate',
            difficulty: 'easy',
            initialTags: [],
            initialBudget: 100000
        };
        expect(validateDevice(device)).toBe(false);
    });

    it('should reject device with invalid archetype', () => {
        const device = {
            id: 'test',
            name: 'Test',
            description: 'Desc',
            archetype: 'invalid',
            difficulty: 'easy',
            initialTags: [],
            initialBudget: 100000
        };
        expect(validateDevice(device)).toBe(false);
    });

    it('should reject device with invalid difficulty', () => {
        const device = {
            id: 'test',
            name: 'Test',
            description: 'Desc',
            archetype: 'corporate',
            difficulty: 'impossible',
            initialTags: [],
            initialBudget: 100000
        };
        expect(validateDevice(device)).toBe(false);
    });

    it('should reject null', () => {
        expect(validateDevice(null)).toBe(false);
    });

    it('should reject non-objects', () => {
        expect(validateDevice('string')).toBe(false);
        expect(validateDevice(123)).toBe(false);
    });
});

describe('validateEvent', () => {
    it('should validate a correct event', () => {
        const event = {
            id: 'test',
            title: 'Test',
            description: 'Desc',
            choices: [{ id: 'c1', text: 'Choice', cost: 1000, doomImpact: 5, riskLevel: 'low' }]
        };
        expect(validateEvent(event)).toBe(true);
    });

    it('should reject event with missing choices', () => {
        const event = {
            id: 'test',
            title: 'Test',
            description: 'Desc'
        };
        expect(validateEvent(event)).toBe(false);
    });

    it('should reject event with invalid choice riskLevel', () => {
        const event = {
            id: 'test',
            title: 'Test',
            description: 'Desc',
            choices: [{ id: 'c1', text: 'Choice', cost: 1000, doomImpact: 5, riskLevel: 'extreme' }]
        };
        expect(validateEvent(event)).toBe(false);
    });
});

describe('createValidatedDataProvider', () => {
    it('should filter out invalid devices and events', () => {
        const devicesData = [
            {
                id: 'valid',
                name: 'Valid',
                description: 'Valid device',
                archetype: 'corporate',
                difficulty: 'easy',
                initialTags: [],
                initialBudget: 100000,
                monthlyMaintenanceCost: 1000,
                eolMonth: 48
            },
            { invalid: true } // Invalid
        ];

        const eventsData = [
            {
                id: 'valid',
                title: 'Valid',
                description: 'Valid event',
                choices: [{ id: 'c1', text: 'Choice', cost: 0, doomImpact: 0, riskLevel: 'low' }]
            },
            { also: 'invalid' } // Invalid
        ];

        const provider = createValidatedDataProvider(devicesData, eventsData);
        expect(provider.getDevices()).toHaveLength(1);
        expect(provider.getEvents()).toHaveLength(1);
    });
});
