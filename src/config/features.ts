/**
 * Feature Flags
 *
 * Simple feature flag system for A/B testing and gradual rollouts.
 * Flags can be overridden via localStorage for development.
 */

interface FeatureFlags {
    /** Enable PWA features (offline mode, install prompt) */
    enablePWA: boolean;

    /** Enable analytics tracking (when implemented) */
    enableAnalytics: boolean;

    /** Enable debug mode (extra logging, dev tools) */
    enableDebug: boolean;

    /** Enable experimental UI features */
    enableExperimentalUI: boolean;

    /** Enable sound effects */
    enableSound: boolean;

    /** Enable tutorial for new users */
    enableTutorial: boolean;

    /** Enable share functionality */
    enableSharing: boolean;

    /** Maximum number of devices to show in setup */
    maxDevicesInSetup: number;
}

const DEFAULT_FLAGS: FeatureFlags = {
    enablePWA: false, // Not fully implemented yet
    enableAnalytics: false,
    enableDebug: import.meta.env?.DEV ?? false,
    enableExperimentalUI: false,
    enableSound: true,
    enableTutorial: true,
    enableSharing: true,
    maxDevicesInSetup: 10
};

const STORAGE_KEY = 'hardware_feature_flags';

class FeatureFlagService {
    private flags: FeatureFlags;

    constructor() {
        this.flags = this.loadFlags();
    }

    private loadFlags(): FeatureFlags {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<FeatureFlags>;
                return { ...DEFAULT_FLAGS, ...parsed };
            }
        } catch {
            // Ignore localStorage errors
        }
        return { ...DEFAULT_FLAGS };
    }

    get<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
        return this.flags[flag];
    }

    set<K extends keyof FeatureFlags>(flag: K, value: FeatureFlags[K]): void {
        this.flags[flag] = value;
        this.persist();
    }

    isEnabled(flag: keyof FeatureFlags): boolean {
        const value = this.flags[flag];
        return typeof value === 'boolean' ? value : false;
    }

    reset(): void {
        this.flags = { ...DEFAULT_FLAGS };
        localStorage.removeItem(STORAGE_KEY);
    }

    private persist(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
        } catch {
            // Ignore localStorage errors
        }
    }

    /** Get all flags (for debugging) */
    getAll(): Readonly<FeatureFlags> {
        return { ...this.flags };
    }
}

// Singleton instance
export const featureFlags = new FeatureFlagService();

// Convenience hook for React (if needed)
export function useFeatureFlag<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
    return featureFlags.get(flag);
}

export type { FeatureFlags };
export default featureFlags;
