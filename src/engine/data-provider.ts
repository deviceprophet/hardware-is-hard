/**
 * JSON Data Provider with Zod Validation
 *
 * Implementation of DataProvider that loads game data from JSON files.
 * Uses Zod for robust runtime schema validation.
 */

import { z } from 'zod';
import type { DataProvider, Device, GameEvent } from './types';

// ============================================================================
// Zod Schemas
// ============================================================================

export const DeviceSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    archetype: z.enum(['corporate', 'consumer', 'medical', 'appliance', 'industrial']),
    difficulty: z.enum(['easy', 'medium', 'hard', 'extreme']),
    initialTags: z.array(z.string()),
    initialBudget: z.number(),
    monthlyMaintenanceCost: z.number(),
    eolMonth: z.number()
});

export const ChoiceSchema = z.object({
    id: z.string(),
    text: z.string(),
    cost: z.number(),
    doomImpact: z.number(),
    addTags: z.array(z.string()).optional(),
    removeTags: z.array(z.string()).optional(),
    riskLevel: z.enum(['low', 'medium', 'high'])
});

export const GameEventSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    category: z
        .enum([
            'regulatory',
            'cyberattack',
            'supply_chain',
            'operational',
            'privacy',
            'ipr',
            'reputational'
        ])
        .optional(),
    triggerCondition: z.string().optional(),
    requiredTags: z.array(z.string()).optional(),
    blockedByTags: z.array(z.string()).optional(),
    choices: z.array(ChoiceSchema),
    visualEffect: z.enum(['glitch', 'shake', 'pulse-red', 'confetti', 'none']).optional(),
    targetModule: z
        .enum([
            'cpu',
            'network',
            'power',
            'storage',
            'sensor',
            'security',
            'cloud',
            'control',
            'encryption'
        ])
        .optional(),
    baseProb: z.number().optional(),
    repeatable: z.boolean().optional()
});

// ============================================================================
// Implementation
// ============================================================================

/**
 * Creates a DataProvider from pre-loaded JSON data.
 * Use this when you have the JSON already loaded (e.g., in a bundler).
 */
export function createDataProvider(
    devices: readonly Device[],
    events: readonly GameEvent[]
): DataProvider {
    const deviceMap = new Map<string, Device>();
    const eventMap = new Map<string, GameEvent>();

    for (const device of devices) {
        deviceMap.set(device.id, device);
    }

    for (const event of events) {
        eventMap.set(event.id, event);
    }

    return {
        getDevices: () => devices,
        getEvents: () => events,
        getDevice: (id: string) => deviceMap.get(id),
        getEvent: (id: string) => eventMap.get(id)
    };
}

/**
 * Validates device data structure using Zod
 */
export function validateDevice(data: unknown): data is Device {
    const result = DeviceSchema.safeParse(data);
    if (!result.success) {
        // console.warn('Device validation failed:', result.error);
        return false;
    }
    return true;
}

/**
 * Validates event data structure using Zod
 */
export function validateEvent(data: unknown): data is GameEvent {
    const result = GameEventSchema.safeParse(data);
    if (!result.success) {
        // console.warn('Event validation failed:', result.error);
        return false;
    }
    return true;
}

/**
 * Creates a DataProvider with validation
 */
export function createValidatedDataProvider(
    devicesData: unknown[],
    eventsData: unknown[]
): DataProvider {
    const devices: Device[] = [];
    const events: GameEvent[] = [];

    devicesData.forEach((d, i) => {
        const result = DeviceSchema.safeParse(d);
        if (result.success) {
            devices.push(result.data as Device);
        } else {
            console.warn(`Invalid device data at index ${i}:`, result.error.format());
        }
    });

    eventsData.forEach((e, i) => {
        const result = GameEventSchema.safeParse(e);
        if (result.success) {
            events.push(result.data as GameEvent);
        } else {
            console.warn(`Invalid event data at index ${i}:`, result.error.format());
        }
    });

    return createDataProvider(devices, events);
}
