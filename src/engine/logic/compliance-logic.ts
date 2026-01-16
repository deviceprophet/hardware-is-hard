import type { Device } from '../types';

export interface ComplianceResult {
    cost: number;
    complianceChange: number;
    newTagsToAdd: string[];
    tagsToRemove: string[];
}

/**
 * processRegulatoryCompliance
 * Calculates the maintenance cost, compliance change, and tag updates for a month.
 */
export function calculateComplianceUpdates(
    device: Device,
    monthsPassed: number,
    timelineMonth: number,
    fundingLevel: 'full' | 'partial' | 'none',
    activeTags: string[],
    currentComplianceLevel: number
): ComplianceResult {
    // Base Maintenance Cost
    const baseCost = device.monthlyMaintenanceCost || 2000;
    const eol = device.eolMonth || 48;
    const isEOL = timelineMonth >= eol;

    // "Legacy Mode" / Tech Debt: Costs increase by 50% after 3 years (Month 36)
    const isLegacy = timelineMonth > 36;
    const legacyMultiplier = isLegacy ? 1.5 : 1.0;

    // Strategy Logic
    let costMultiplier = 1.0;
    let complianceChange = 0;

    switch (fundingLevel) {
        case 'full':
            // "DevSecOps" - Expensive but safe
            costMultiplier = 1.0;
            complianceChange = isEOL ? -2 : 1; // Can't improve post-EOL, only slow decay
            break;
        case 'partial':
            // "Feature-first" - Cheaper, slow decay
            costMultiplier = 0.5;
            complianceChange = -2;
            break;
        case 'none':
            // "Skeleton Crew" - Free, rapid decay
            costMultiplier = 0;
            complianceChange = -5;
            break;
    }

    const totalCost = baseCost * costMultiplier * legacyMultiplier * monthsPassed;

    // Calculate new compliance level (clamped 0-100) locally
    // but return the *change* so engine can apply it.
    // Wait, the logic used current level to decide tags.
    // So we need to simulate the new level to decide tags.

    const potentialNewLevel = Math.max(
        0,
        Math.min(100, currentComplianceLevel + complianceChange * monthsPassed)
    );

    const newTagsToAdd: string[] = [];
    const tagsToRemove: string[] = [];

    // Tag Logic
    // 1. EOL Tag
    if (isEOL && !activeTags.includes('eol_device')) {
        newTagsToAdd.push('eol_device');
    }

    // 2. Regulatory Risk (Threshold: < 50%)
    if (potentialNewLevel < 50 && !activeTags.includes('regulatory_risk')) {
        newTagsToAdd.push('regulatory_risk');
    }
    if (potentialNewLevel >= 50 && activeTags.includes('regulatory_risk')) {
        tagsToRemove.push('regulatory_risk');
    }

    // 3. Critical Vulnerability (Threshold: < 20%)
    if (potentialNewLevel < 20 && !activeTags.includes('critical_vuln')) {
        newTagsToAdd.push('critical_vuln');
    }
    if (potentialNewLevel >= 20 && activeTags.includes('critical_vuln')) {
        tagsToRemove.push('critical_vuln');
    }

    return {
        cost: totalCost,
        complianceChange: complianceChange * monthsPassed,
        newTagsToAdd,
        tagsToRemove
    };
}
