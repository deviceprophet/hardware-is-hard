/**
 * Content Translation Hook
 *
 * Provides translated game content (events, devices) based on current language.
 * Keeps logic data in original JSON files, uses i18next for display text.
 */

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

// Import content translations
import enContent from '../locales/en/content.json';
import esContent from '../locales/es/content.json';

type ContentItem = {
    title?: string;
    name?: string;
    description?: string;
    choices?: Record<string, string>;
};

const contentByLang: Record<string, Record<string, ContentItem>> = {
    en: enContent as unknown as Record<string, ContentItem>,
    es: esContent as unknown as Record<string, ContentItem>
};

// Available languages for extensibility (used for future dynamic language detection)

/**
 * Get language code from i18n, dynamically matching available content.
 * Falls back to 'en' if no match found.
 */
function getCurrentLanguage(i18nLanguage: string): string {
    // Try exact match first
    if (contentByLang[i18nLanguage]) {
        return i18nLanguage;
    }

    // Try language prefix (e.g., 'es-MX' -> 'es')
    const prefix = i18nLanguage.split('-')[0]!;
    if (contentByLang[prefix]) {
        return prefix;
    }

    // Default to English
    return 'en';
}

interface TranslatedEvent {
    title: string;
    description: string;
    getChoiceText: (choiceId: string) => string;
}

interface TranslatedDevice {
    name: string;
    description: string;
}

/**
 * Hook to get translated event content
 */
export function useTranslatedEvent(eventId: string): TranslatedEvent {
    const { i18n } = useTranslation();
    const lang = getCurrentLanguage(i18n.language);

    return useMemo(() => {
        const content = (contentByLang[lang] || contentByLang.en)!;
        const eventContent = content[eventId] ?? {
            title: eventId,
            description: '',
            choices: {}
        };

        return {
            title: eventContent.title || eventId,
            description: eventContent.description || '',
            getChoiceText: (choiceId: string) => eventContent.choices?.[choiceId] || choiceId
        };
    }, [eventId, lang]);
}

/**
 * Hook to get translated device content
 */
export function useTranslatedDevice(deviceId: string): TranslatedDevice {
    const { i18n } = useTranslation();
    const lang = getCurrentLanguage(i18n.language);

    return useMemo(() => {
        const content = (contentByLang[lang] || contentByLang.en)!;
        const deviceContent = content[deviceId] ?? { name: deviceId, description: '' };

        return {
            name: deviceContent.name || deviceId,
            description: deviceContent.description || ''
        };
    }, [deviceId, lang]);
}

/**
 * Hook to get all translated events for a list
 */
export function useTranslatedEvents(eventIds: string[]): Map<string, TranslatedEvent> {
    const { i18n } = useTranslation();
    const lang = getCurrentLanguage(i18n.language);

    return useMemo(() => {
        const content = (contentByLang[lang] || contentByLang.en)!;
        const result = new Map<string, TranslatedEvent>();

        for (const eventId of eventIds) {
            const eventContent = content[eventId] ?? {
                title: eventId,
                description: '',
                choices: {}
            };
            result.set(eventId, {
                title: eventContent.title || eventId,
                description: eventContent.description || '',
                getChoiceText: (choiceId: string) => eventContent.choices?.[choiceId] || choiceId
            });
        }

        return result;
    }, [eventIds, lang]);
}

/**
 * Hook to get all translated devices for a list
 */
export function useTranslatedDevices(deviceIds: string[]): Map<string, TranslatedDevice> {
    const { i18n } = useTranslation();
    const lang = getCurrentLanguage(i18n.language);

    return useMemo(() => {
        const content = (contentByLang[lang] || contentByLang.en)!;
        const result = new Map<string, TranslatedDevice>();

        for (const deviceId of deviceIds) {
            const deviceContent = content[deviceId] ?? { name: deviceId, description: '' };
            result.set(deviceId, {
                name: deviceContent.name || deviceId,
                description: deviceContent.description || ''
            });
        }

        return result;
    }, [deviceIds, lang]);
}
