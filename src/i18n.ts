/**
 * i18n Configuration
 *
 * Internationalization setup using i18next.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import esTranslation from './locales/es/translation.json';

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslation },
            es: { translation: esTranslation }
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'es'],

        interpolation: {
            escapeValue: false // React already escapes
        },

        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'hardware_language'
        }
    });

export default i18n;

// Utility to change language
export const changeLanguage = (lang: 'en' | 'es') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('hardware_language', lang);
};

// Get current language
export const getCurrentLanguage = () => i18n.language;
