/**
 * Localization Integration Tests
 *
 * Verifies that text actually changes when language is switched.
 * Uses real i18next instance (not mocked) with actual translation files.
 */

import { describe, it, expect } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from '@/locales/en/translation.json';
import esTranslation from '@/locales/es/translation.json';

// Initialize a separate i18n instance for testing to avoid side-effects from the main singleton
const testI18n = i18n.createInstance();

testI18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
        en: { translation: enTranslation },
        es: { translation: esTranslation }
    },
    interpolation: {
        escapeValue: false
    }
});

describe('Localization Content', () => {
    it('should have the correct brand title for English and Spanish', async () => {
        // Check English
        await testI18n.changeLanguage('en');
        const enTitle = testI18n.t('splash.title');
        expect(enTitle).toBe('THE RECALL RUN');

        // Check Spanish
        await testI18n.changeLanguage('es');
        const esTitle = testI18n.t('splash.title');
        expect(esTitle).toBe('THE RECALL RUN');
    });

    it('should translate difficulty levels correctly', async () => {
        await testI18n.changeLanguage('en');
        expect(testI18n.t('common.hard')).toBe('Hard');

        await testI18n.changeLanguage('es');
        expect(testI18n.t('common.hard')).toBe('Dificil');
    });

    it('should have valid structure for all keys', () => {
        // Simple distinctness check for a few key areas
        const enKeys = Object.keys(enTranslation.common);
        const esKeys = Object.keys(esTranslation.common);

        expect(enKeys).toEqual(esKeys);
    });
});
