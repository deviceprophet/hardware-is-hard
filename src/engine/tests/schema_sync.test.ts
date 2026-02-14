/**
 * Schema Sync Integrity Test
 *
 * Ensures TypeScript types, Zod schemas, and actual game data
 * are in sync. Catches drift between these three sources of truth.
 */

import { describe, it, expect } from 'vitest';
import { GameEventSchema, DeviceSchema } from '../data-provider';
import events from '../../data/events.json';
import devices from '../../data/devices.json';

describe('Schema Sync: Game data matches Zod schemas', () => {
    it('should validate every event in events.json against GameEventSchema', () => {
        const failures: string[] = [];

        events.forEach((event, i) => {
            const result = GameEventSchema.safeParse(event);
            if (!result.success) {
                failures.push(
                    `Event ${i} "${event.id}": ${result.error.issues.map(iss => `${iss.path.join('.')}: ${iss.message}`).join('; ')}`
                );
            }
        });

        expect(failures).toEqual([]);
    });

    it('should validate every device in devices.json against DeviceSchema', () => {
        const failures: string[] = [];

        devices.forEach((device, i) => {
            const result = DeviceSchema.safeParse(device);
            if (!result.success) {
                failures.push(
                    `Device ${i} "${device.id}": ${result.error.issues.map(iss => `${iss.path.join('.')}: ${iss.message}`).join('; ')}`
                );
            }
        });

        expect(failures).toEqual([]);
    });
});
