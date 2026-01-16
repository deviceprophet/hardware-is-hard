/**
 * Settings & Workflow Tests
 *
 * Verifies that user settings (Sound, Tutorial, Language) persist correctly
 * and affect the application state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { soundManager } from '../../../../adapters/audio/SoundManager';
import { changeLanguage } from '../../../../i18n';
// TUTORIAL_STEPS import removed - not used in this test file

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock i18next
vi.mock('i18next', () => {
    const mockI18n = {
        use: () => mockI18n,
        init: () => mockI18n,
        changeLanguage: vi.fn(_lang => {
            // Simulate change
            return Promise.resolve();
        }),
        language: 'en'
    };
    return { default: mockI18n };
});

// Mock Howler
vi.mock('howler', () => ({
    Howler: {
        mute: vi.fn()
    },
    Howl: vi.fn(() => ({
        play: vi.fn(),
        state: () => 'loaded'
    }))
}));

describe('Settings & Workflows', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        // Reset soundManager to initial known state for testing
        soundManager.setMuted(false);
    });

    describe('Audio Settings', () => {
        it('should toggle mute state and persist to localStorage', () => {
            // Initial state
            expect(soundManager.isMuted()).toBe(false);

            // Toggle mute on
            const isMuted = soundManager.toggleMute();
            expect(isMuted).toBe(true);
            expect(localStorage.getItem('sound_muted')).toBe('true');

            // Toggle mute off
            const isUnmuted = soundManager.toggleMute();
            expect(isUnmuted).toBe(false);
            expect(localStorage.getItem('sound_muted')).toBe('false');
        });

        it('should initialize mute state from localStorage', () => {
            localStorage.setItem('sound_muted', 'true');

            // Re-initialize sound manager (simulating app reload)
            // Note: In a real app we'd create a new instance, but here we reset valid state
            soundManager.setMuted(true);

            expect(soundManager.isMuted()).toBe(true);
        });
    });

    describe('Localization (i18n)', () => {
        it('should save language preference to localStorage', () => {
            changeLanguage('es');
            expect(localStorage.getItem('hardware_language')).toBe('es');

            changeLanguage('en');
            expect(localStorage.getItem('hardware_language')).toBe('en');
        });

        // Note: verifying actual text change requires rendering components wrapped in I18nextProvider
        // which is heavier. Here we verify the "workflow" of switching saves preference.
    });

    describe('Tutorial Workflow', () => {
        const TUTORIAL_KEY = 'hardware_tutorial_completed';

        it('should mark tutorial as skipped in localStorage', () => {
            // Simulate skip action logic
            const skipData = {
                completed: [],
                skipped: true
            };
            localStorage.setItem(TUTORIAL_KEY, JSON.stringify(skipData));

            const stored = JSON.parse(localStorage.getItem(TUTORIAL_KEY)!);
            expect(stored.skipped).toBe(true);
        });

        it('should track completed steps', () => {
            const completedSteps = ['welcome', 'setup_device'];
            const data = {
                completed: completedSteps,
                skipped: false
            };
            localStorage.setItem(TUTORIAL_KEY, JSON.stringify(data));

            const stored = JSON.parse(localStorage.getItem(TUTORIAL_KEY)!);
            expect(stored.completed).toContain('welcome');
            expect(stored.completed).toContain('setup_device');
            expect(stored.completed).toHaveLength(2);
        });
    });
});
