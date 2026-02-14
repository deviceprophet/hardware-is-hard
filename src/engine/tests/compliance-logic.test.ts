/**
 * Compliance Logic Unit Tests
 *
 * Tests calculateComplianceUpdates for all funding levels,
 * EOL/legacy states, and regulatory tag thresholds.
 */

import { describe, it, expect } from 'vitest';
import { calculateComplianceUpdates } from '../logic/compliance-logic';
import { COMPLIANCE, SYSTEM_TAGS } from '../constants';
import { createMockDevice } from './factories';

const device = createMockDevice({
    monthlyMaintenanceCost: 2000,
    eolMonth: 48
});

describe('calculateComplianceUpdates', () => {
    describe('funding levels', () => {
        it('full funding: costs 100% and increases compliance', () => {
            const result = calculateComplianceUpdates(device, 1, 10, 'full', [], 50);
            expect(result.cost).toBe(2000); // baseCost * 1.0 * 1.0 * 1 month
            expect(result.complianceChange).toBe(COMPLIANCE.FULL_FUNDING.change);
        });

        it('partial funding: costs 50% and decreases compliance', () => {
            const result = calculateComplianceUpdates(device, 1, 10, 'partial', [], 50);
            expect(result.cost).toBe(1000); // baseCost * 0.5
            expect(result.complianceChange).toBe(COMPLIANCE.PARTIAL_FUNDING.change);
        });

        it('no funding: costs nothing and rapidly decreases compliance', () => {
            const result = calculateComplianceUpdates(device, 1, 10, 'none', [], 50);
            expect(result.cost).toBe(0);
            expect(result.complianceChange).toBe(COMPLIANCE.NO_FUNDING.change);
        });
    });

    describe('time scaling', () => {
        it('scales cost and compliance change with months passed', () => {
            const result = calculateComplianceUpdates(device, 3, 10, 'full', [], 50);
            expect(result.cost).toBe(6000); // 2000 * 1.0 * 1.0 * 3
            expect(result.complianceChange).toBe(COMPLIANCE.FULL_FUNDING.change * 3);
        });

        it('handles fractional months', () => {
            const result = calculateComplianceUpdates(device, 0.5, 10, 'full', [], 50);
            expect(result.cost).toBe(1000); // 2000 * 0.5
        });
    });

    describe('EOL behavior', () => {
        it('full funding after EOL decreases compliance instead of increasing', () => {
            const result = calculateComplianceUpdates(device, 1, 50, 'full', [], 80);
            // After EOL (month 50 >= eolMonth 48), full funding uses eolChange
            expect(result.complianceChange).toBe(COMPLIANCE.FULL_FUNDING.eolChange);
        });

        it('adds eol_device tag when past EOL', () => {
            const result = calculateComplianceUpdates(device, 1, 50, 'full', [], 80);
            expect(result.newTagsToAdd).toContain(SYSTEM_TAGS.EOL_DEVICE);
        });

        it('does not duplicate eol_device tag if already present', () => {
            const result = calculateComplianceUpdates(
                device,
                1,
                50,
                'full',
                [SYSTEM_TAGS.EOL_DEVICE],
                80
            );
            expect(result.newTagsToAdd).not.toContain(SYSTEM_TAGS.EOL_DEVICE);
        });

        it('does not add eol_device before EOL month', () => {
            const result = calculateComplianceUpdates(device, 1, 40, 'full', [], 80);
            expect(result.newTagsToAdd).not.toContain(SYSTEM_TAGS.EOL_DEVICE);
        });
    });

    describe('legacy cost multiplier', () => {
        it('applies 1.5x cost after legacy threshold (month 36)', () => {
            const result = calculateComplianceUpdates(device, 1, 37, 'full', [], 50);
            expect(result.cost).toBe(2000 * COMPLIANCE.LEGACY_COST_MULTIPLIER);
        });

        it('does not apply legacy multiplier before threshold', () => {
            const result = calculateComplianceUpdates(device, 1, 36, 'full', [], 50);
            expect(result.cost).toBe(2000); // No multiplier at exactly month 36
        });
    });

    describe('regulatory tag thresholds', () => {
        it('adds regulatory_risk tag when compliance drops below 50', () => {
            const result = calculateComplianceUpdates(device, 1, 10, 'none', [], 40);
            // compliance = max(0, min(100, 40 + (-5)*1)) = 35 < 50
            expect(result.newTagsToAdd).toContain(SYSTEM_TAGS.REGULATORY_RISK);
        });

        it('removes regulatory_risk tag when compliance rises above 50', () => {
            const result = calculateComplianceUpdates(
                device,
                1,
                10,
                'full',
                [SYSTEM_TAGS.REGULATORY_RISK],
                55
            );
            // compliance = min(100, 55 + 1) = 56 >= 50
            expect(result.tagsToRemove).toContain(SYSTEM_TAGS.REGULATORY_RISK);
        });

        it('does not add regulatory_risk if already present', () => {
            const result = calculateComplianceUpdates(
                device,
                1,
                10,
                'none',
                [SYSTEM_TAGS.REGULATORY_RISK],
                40
            );
            expect(result.newTagsToAdd).not.toContain(SYSTEM_TAGS.REGULATORY_RISK);
        });

        it('adds critical_vuln tag when compliance drops below 20', () => {
            const result = calculateComplianceUpdates(device, 1, 10, 'none', [], 15);
            // compliance = max(0, min(100, 15 + (-5))) = 10 < 20
            expect(result.newTagsToAdd).toContain(SYSTEM_TAGS.CRITICAL_VULN);
        });

        it('removes critical_vuln tag when compliance rises above 20', () => {
            const result = calculateComplianceUpdates(
                device,
                1,
                10,
                'full',
                [SYSTEM_TAGS.CRITICAL_VULN],
                22
            );
            // compliance = min(100, 22 + 1) = 23 >= 20
            expect(result.tagsToRemove).toContain(SYSTEM_TAGS.CRITICAL_VULN);
        });

        it('does not add critical_vuln if already present', () => {
            const result = calculateComplianceUpdates(
                device,
                1,
                10,
                'none',
                [SYSTEM_TAGS.CRITICAL_VULN],
                15
            );
            expect(result.newTagsToAdd).not.toContain(SYSTEM_TAGS.CRITICAL_VULN);
        });
    });

    describe('compliance clamping', () => {
        it('compliance change does not push above MAX_LEVEL', () => {
            const result = calculateComplianceUpdates(device, 1, 10, 'full', [], 100);
            // potentialNewLevel = min(100, 100 + 1) = 100, capped
            expect(result.complianceChange).toBe(1);
        });

        it('compliance change does not push below 0', () => {
            const result = calculateComplianceUpdates(device, 1, 10, 'none', [], 3);
            // potentialNewLevel = max(0, 3 + (-5)) = 0, floored
            expect(result.complianceChange).toBe(-5); // Raw change, clamping is in engine
        });
    });

    describe('device defaults', () => {
        it('uses default maintenance cost when device has none', () => {
            const noMaintenanceDevice = createMockDevice({
                monthlyMaintenanceCost: undefined as unknown as number
            });
            const result = calculateComplianceUpdates(noMaintenanceDevice, 1, 10, 'full', [], 50);
            expect(result.cost).toBe(COMPLIANCE.DEFAULT_MAINTENANCE_COST);
        });

        it('uses default EOL month when device has none', () => {
            const noEolDevice = createMockDevice({
                eolMonth: undefined as unknown as number
            });
            // Default EOL is 48, so month 50 should be past EOL
            const result = calculateComplianceUpdates(noEolDevice, 1, 50, 'full', [], 80);
            expect(result.newTagsToAdd).toContain(SYSTEM_TAGS.EOL_DEVICE);
        });
    });

    describe('combined scenarios', () => {
        it('EOL + legacy + partial funding produces correct cost', () => {
            // Month 50: past EOL (48) and legacy (36)
            const result = calculateComplianceUpdates(device, 1, 50, 'partial', [], 50);
            const expected = 2000 * 0.5 * COMPLIANCE.LEGACY_COST_MULTIPLIER;
            expect(result.cost).toBe(expected);
        });

        it('low compliance triggers both regulatory and critical tags', () => {
            const result = calculateComplianceUpdates(device, 1, 10, 'none', [], 10);
            // potentialNewLevel = max(0, 10 + (-5)) = 5 < 20 and < 50
            expect(result.newTagsToAdd).toContain(SYSTEM_TAGS.REGULATORY_RISK);
            expect(result.newTagsToAdd).toContain(SYSTEM_TAGS.CRITICAL_VULN);
        });

        it('recovering compliance removes both tags', () => {
            const result = calculateComplianceUpdates(
                device,
                1,
                10,
                'full',
                [SYSTEM_TAGS.REGULATORY_RISK, SYSTEM_TAGS.CRITICAL_VULN],
                55
            );
            // potentialNewLevel = 56, above both thresholds
            expect(result.tagsToRemove).toContain(SYSTEM_TAGS.REGULATORY_RISK);
            expect(result.tagsToRemove).toContain(SYSTEM_TAGS.CRITICAL_VULN);
        });
    });
});
