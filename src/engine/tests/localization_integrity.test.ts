/**
 * Localization Integrity Tests
 *
 * Ensures that all translation keys exist in all supported languages
 * and that content is actually translated (not just English placeholders).
 */

import { describe, it, expect } from 'vitest';
import enTranslation from '../../locales/en/translation.json';
import esTranslation from '../../locales/es/translation.json';
import enContent from '../../locales/en/content.json';
import esContent from '../../locales/es/content.json';
import eventsData from '../../data/events.json';
import type { GameEvent } from '../types';

// Helper to get all keys from a nested object
function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            keys.push(...getAllKeys(value as Record<string, unknown>, fullKey));
        }
    }
    return keys;
}

// Helper to get a value by dot-notation path
function getByPath(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
        if (
            current &&
            typeof current === 'object' &&
            part in (current as Record<string, unknown>)
        ) {
            current = (current as Record<string, unknown>)[part];
        } else {
            return undefined;
        }
    }
    return current;
}

describe('Localization Integrity', () => {
    describe('Translation Files (translation.json)', () => {
        it('should have all English keys in Spanish translation', () => {
            const enKeys = getAllKeys(enTranslation as Record<string, unknown>);
            const esKeys = getAllKeys(esTranslation as Record<string, unknown>);

            const missingInEs = enKeys.filter(key => !esKeys.includes(key));

            if (missingInEs.length > 0) {
                console.log('Missing keys in Spanish translation.json:', missingInEs);
            }

            expect(missingInEs).toEqual([]);
        });

        it('should have all Spanish keys in English translation', () => {
            const enKeys = getAllKeys(enTranslation as Record<string, unknown>);
            const esKeys = getAllKeys(esTranslation as Record<string, unknown>);

            const missingInEn = esKeys.filter(key => !enKeys.includes(key));

            if (missingInEn.length > 0) {
                console.log(
                    'Extra keys in Spanish translation.json (not in English):',
                    missingInEn
                );
            }

            expect(missingInEn).toEqual([]);
        });

        it('should have translated values (not identical to English) for leaf nodes', () => {
            const enKeys = getAllKeys(enTranslation as Record<string, unknown>);

            // Get leaf keys only (strings, not objects)
            const leafKeys = enKeys.filter(key => {
                const val = getByPath(enTranslation as Record<string, unknown>, key);
                return typeof val === 'string';
            });

            // Some keys are intentionally the same (like "NOMINAL", brand names, department names)
            const allowedSameValues = [
                'strategies.full.label', //
                'strategies.none.label', // YOLO Deploy is same
                'simulation.nominal',
                'system.status.nominal',
                'splash.title',
                'blame.departments.Marketing',
                'blame.departments.Legal'
            ];

            const untranslated: string[] = [];

            for (const key of leafKeys) {
                if (allowedSameValues.includes(key)) continue;

                const enVal = getByPath(enTranslation as Record<string, unknown>, key);
                const esVal = getByPath(esTranslation as Record<string, unknown>, key);

                if (enVal === esVal && typeof enVal === 'string' && enVal.length > 3) {
                    untranslated.push(key);
                }
            }

            if (untranslated.length > 0) {
                console.log(
                    'Potentially untranslated keys in translation.json:',
                    untranslated.slice(0, 10)
                );
            }

            // Allow some tolerance - we don't want to fail on brand names etc
            expect(untranslated.length).toBeLessThan(5);
        });
    });

    describe('Content Files (content.json)', () => {
        it('should have all English event keys in Spanish content', () => {
            const enKeys = Object.keys(enContent);
            const esKeys = Object.keys(esContent);

            const missingInEs = enKeys.filter(key => !esKeys.includes(key));

            if (missingInEs.length > 0) {
                console.log('Missing event keys in Spanish content.json:', missingInEs);
            }

            expect(missingInEs).toEqual([]);
        });

        it('should have matching structure for each event', () => {
            const enKeys = Object.keys(enContent);
            const structureMismatches: string[] = [];

            for (const eventId of enKeys) {
                const enEvent = (enContent as Record<string, Record<string, unknown>>)[eventId];
                const esEvent = (esContent as Record<string, Record<string, unknown>>)[eventId];

                if (!esEvent || !enEvent) continue; // Already caught by previous test

                // Check that title exists if English has it
                if (enEvent.title && !esEvent.title) {
                    structureMismatches.push(`${eventId}.title`);
                }

                // Check that description exists if English has it
                if (enEvent.description && !esEvent.description) {
                    structureMismatches.push(`${eventId}.description`);
                }

                // Check choices
                if (enEvent.choices && typeof enEvent.choices === 'object') {
                    const enChoices = Object.keys(enEvent.choices as Record<string, string>);
                    const esChoices = esEvent.choices
                        ? Object.keys(esEvent.choices as Record<string, string>)
                        : [];

                    for (const choiceId of enChoices) {
                        if (!esChoices.includes(choiceId)) {
                            structureMismatches.push(`${eventId}.choices.${choiceId}`);
                        }
                    }
                }
            }

            if (structureMismatches.length > 0) {
                console.log(
                    'Structure mismatches in content.json:',
                    structureMismatches.slice(0, 10)
                );
            }

            expect(structureMismatches).toEqual([]);
        });

        it('should have translated event titles (not identical to English)', () => {
            const enKeys = Object.keys(enContent);
            const untranslatedTitles: string[] = [];

            // Device names are allowed to be the same (brand names)
            const deviceIds = [
                'omni-juice',
                'industrial-sentinel',
                'smart-lock',
                'snuggle-bot',
                'zen-cage',
                'smart-fridge',
                'health-tracker',
                'cuddlebot-ai',
                'eco-thermo',
                'asset-beacon'
            ];

            // UI sections that might have same values
            const uiSections = ['system', 'logs'];

            for (const eventId of enKeys) {
                // Skip devices and UI sections
                if (deviceIds.includes(eventId) || uiSections.includes(eventId)) continue;

                const enEvent = (enContent as Record<string, Record<string, unknown>>)[eventId];
                const esEvent = (esContent as Record<string, Record<string, unknown>>)[eventId];

                if (!esEvent || !enEvent) continue;

                // Check if title is translated
                if (enEvent.title === esEvent.title && typeof enEvent.title === 'string') {
                    untranslatedTitles.push(`${eventId}: "${enEvent.title}"`);
                }
            }

            if (untranslatedTitles.length > 0) {
                console.log('Untranslated event titles:', untranslatedTitles);
            }

            expect(untranslatedTitles).toEqual([]);
        });
    });

    describe('Content Sync with Events Data', () => {
        it('should have a translation entry for every event in events.json', () => {
            const eventIds = (eventsData as GameEvent[]).map((e: GameEvent) => e.id);
            const enContentKeys = Object.keys(enContent);

            const missingInEn = eventIds.filter(id => !enContentKeys.includes(id));

            if (missingInEn.length > 0) {
                console.log('Missing event translations in en/content.json:', missingInEn);
            }

            expect(missingInEn).toEqual([]);
        });

        it('should have a translation for every choice in every event', () => {
            const missingChoices: string[] = [];
            const enContentTyped = enContent as Record<string, unknown>;

            for (const event of eventsData as unknown as GameEvent[]) {
                const enEvent = enContentTyped[event.id] as
                    | { choices?: Record<string, unknown> }
                    | undefined;
                if (!enEvent) continue; // Already handled by previous test

                for (const choice of event.choices) {
                    if (!enEvent.choices || !enEvent.choices[choice.id]) {
                        missingChoices.push(`${event.id}.${choice.id}`);
                    }
                }
            }

            if (missingChoices.length > 0) {
                console.log('Missing choice translations in en/content.json:', missingChoices);
            }

            expect(missingChoices).toEqual([]);
        });
    });
});
