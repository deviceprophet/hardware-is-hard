import type { Device } from '../types';
import { COMPLIANCE, SYSTEM_TAGS } from '../constants';

export interface ComplianceResult {
    cost: number;
    complianceChange: number;
    newTagsToAdd: string[];
    tagsToRemove: string[];
}

/**
 * Calculates maintenance cost, compliance change, and tag updates for a time step.
 */
export const calculateComplianceUpdates = (
    device: Device,
    monthsPassed: number,
    timelineMonth: number,
    fundingLevel: 'full' | 'partial' | 'none',
    activeTags: string[],
    currentComplianceLevel: number
): ComplianceResult => {
    const baseCost = device.monthlyMaintenanceCost || COMPLIANCE.DEFAULT_MAINTENANCE_COST;
    const eol = device.eolMonth || COMPLIANCE.DEFAULT_EOL_MONTH;
    const isEOL = timelineMonth >= eol;
    const isLegacy = timelineMonth > COMPLIANCE.LEGACY_MONTH_THRESHOLD;
    const legacyMultiplier = isLegacy ? COMPLIANCE.LEGACY_COST_MULTIPLIER : 1.0;

    let costMultiplier: number;
    let complianceChange: number;

    switch (fundingLevel) {
        case 'full':
            costMultiplier = COMPLIANCE.FULL_FUNDING.costMultiplier;
            complianceChange = isEOL
                ? COMPLIANCE.FULL_FUNDING.eolChange
                : COMPLIANCE.FULL_FUNDING.change;
            break;
        case 'partial':
            costMultiplier = COMPLIANCE.PARTIAL_FUNDING.costMultiplier;
            complianceChange = COMPLIANCE.PARTIAL_FUNDING.change;
            break;
        case 'none':
            costMultiplier = COMPLIANCE.NO_FUNDING.costMultiplier;
            complianceChange = COMPLIANCE.NO_FUNDING.change;
            break;
    }

    const totalCost = baseCost * costMultiplier * legacyMultiplier * monthsPassed;

    const potentialNewLevel = Math.max(
        0,
        Math.min(COMPLIANCE.MAX_LEVEL, currentComplianceLevel + complianceChange * monthsPassed)
    );

    const newTagsToAdd: string[] = [];
    const tagsToRemove: string[] = [];

    if (isEOL && !activeTags.includes(SYSTEM_TAGS.EOL_DEVICE)) {
        newTagsToAdd.push(SYSTEM_TAGS.EOL_DEVICE);
    }

    if (
        potentialNewLevel < COMPLIANCE.REGULATORY_RISK_THRESHOLD &&
        !activeTags.includes(SYSTEM_TAGS.REGULATORY_RISK)
    ) {
        newTagsToAdd.push(SYSTEM_TAGS.REGULATORY_RISK);
    }
    if (
        potentialNewLevel >= COMPLIANCE.REGULATORY_RISK_THRESHOLD &&
        activeTags.includes(SYSTEM_TAGS.REGULATORY_RISK)
    ) {
        tagsToRemove.push(SYSTEM_TAGS.REGULATORY_RISK);
    }

    if (
        potentialNewLevel < COMPLIANCE.CRITICAL_VULN_THRESHOLD &&
        !activeTags.includes(SYSTEM_TAGS.CRITICAL_VULN)
    ) {
        newTagsToAdd.push(SYSTEM_TAGS.CRITICAL_VULN);
    }
    if (
        potentialNewLevel >= COMPLIANCE.CRITICAL_VULN_THRESHOLD &&
        activeTags.includes(SYSTEM_TAGS.CRITICAL_VULN)
    ) {
        tagsToRemove.push(SYSTEM_TAGS.CRITICAL_VULN);
    }

    return {
        cost: totalCost,
        complianceChange: complianceChange * monthsPassed,
        newTagsToAdd,
        tagsToRemove
    };
};
