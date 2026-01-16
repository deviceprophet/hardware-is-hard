import type { Device, GameEvent, Choice } from '../types';

export const createMockChoice = (overrides?: Partial<Choice>): Choice => ({
    id: 'choice-default',
    text: 'Default Choice',
    cost: 100,
    doomImpact: 5,
    riskLevel: 'medium',
    ...overrides
});

export const createMockEvent = (overrides?: Partial<GameEvent>): GameEvent => ({
    id: 'event-default',
    title: 'Default Event',
    description: 'A default event description',
    choices: [createMockChoice()],
    ...overrides
});

export const createMockDevice = (overrides?: Partial<Device>): Device => ({
    id: 'device-default',
    name: 'Default Device',
    description: 'A default device description',
    archetype: 'consumer',
    difficulty: 'medium',
    initialTags: [],
    initialBudget: 50000,
    monthlyMaintenanceCost: 200,
    eolMonth: 48,
    ...overrides
});
