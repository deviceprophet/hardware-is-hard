/**
 * Sound Manager - Audio Adapter for The Recall Run
 *
 * Provides diegetic audio feedback for game events.
 * Uses Howler.js for cross-browser audio support.
 */

import { Howl, Howler } from 'howler';
import { AUDIO } from '../../engine/constants';

// Sound effect definitions with programmatic generation fallback
export const SOUND_CONFIGS = {
    click: {
        src: ['labs/sounds/click.ogg'],
        volume: 0.3,
        fallbackFreq: 800,
        fallbackDuration: 0.05
    },
    error: {
        src: ['labs/sounds/error.ogg'],
        volume: 0.4,
        fallbackFreq: 200,
        fallbackDuration: 0.2
    },
    ship: {
        src: ['labs/sounds/ship.ogg'],
        volume: 0.5,
        fallbackFreq: 400,
        fallbackDuration: 0.3
    },
    doom: {
        src: ['labs/sounds/doom.ogg'],
        volume: 0.2,
        fallbackFreq: 60,
        fallbackDuration: 2.0
    },
    victory: {
        src: ['labs/sounds/victory.ogg'],
        volume: 0.6,
        fallbackFreq: 523,
        fallbackDuration: 0.8
    },
    defeat: {
        src: ['labs/sounds/defeat.ogg'],
        volume: 0.5,
        fallbackFreq: 150,
        fallbackDuration: 1.0
    },
    crisis: {
        src: ['labs/sounds/crisis.ogg'],
        volume: 0.5,
        fallbackFreq: 300,
        fallbackDuration: 0.4
    }
} as const;

export type SoundName = keyof typeof SOUND_CONFIGS;

const CATEGORY_SOUND_MAP: Record<string, SoundName> = {
    cyberattack: 'crisis',
    security: 'crisis',
    privacy: 'crisis',
    regulatory: 'error',
    ipr: 'error',
    supply_chain: 'error',
    safety_recall: 'crisis',
    reputational: 'doom',
    operational: 'click',
    financial: 'click',
    business: 'click'
};

class SoundManager {
    private sounds: Map<SoundName, Howl> = new Map();
    private audioContext: AudioContext | null = null;
    private muted: boolean = true;
    private initialized: boolean = false;
    private useFallback: boolean = false;

    constructor() {
        // Don't initialize automatically - wait for user interaction
    }

    /**
     * Initialize audio system. Must be called after user interaction.
     */
    init(): void {
        if (this.initialized) return;

        // Check for stored mute preference
        const storedMute = localStorage.getItem(AUDIO.MUTE_STORAGE_KEY);
        // Default to muted (true) if not set, otherwise use stored value
        this.muted = storedMute === null ? true : storedMute === 'true';

        // Try to load Howler sounds, fallback to Web Audio API if files not found
        this.loadSounds();
        this.initialized = true;
    }

    private loadSounds(): void {
        const baseUrl = import.meta.env.BASE_URL.endsWith('/')
            ? import.meta.env.BASE_URL
            : `${import.meta.env.BASE_URL}/`;

        // Try loading each sound with Howler
        (Object.entries(SOUND_CONFIGS) as [SoundName, (typeof SOUND_CONFIGS)[SoundName]][]).forEach(
            ([name, config]) => {
                const sound = new Howl({
                    // Prepend Base URL to all source paths, ensuring correct slash usage
                    src: config.src.map(path => baseUrl + path),
                    volume: config.volume,
                    preload: true,
                    onloaderror: () => {
                        // Files not found, will use fallback
                        this.useFallback = true;
                    }
                });
                this.sounds.set(name as SoundName, sound);
            }
        );
    }

    /**
     * Play a synthesized tone using Web Audio API (fallback)
     */
    private playTone(
        frequency: number,
        duration: number,
        volume: number,
        type: OscillatorType = 'sine'
    ): void {
        if (!this.audioContext) {
            this.audioContext = new (
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext
            )();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.setValueAtTime(volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Play a named sound effect
     */
    play(name: SoundName): void {
        if (this.muted) return;
        if (!this.initialized) this.init();

        const config = SOUND_CONFIGS[name];
        const sound = this.sounds.get(name);

        // Try Howler first
        if (sound && sound.state() === 'loaded') {
            sound.play();
        } else {
            // Fallback to Web Audio synthesis
            this.playTone(
                config.fallbackFreq,
                config.fallbackDuration,
                config.volume,
                name === 'doom' ? 'sawtooth' : 'sine'
            );
        }
    }

    /**
     * Play a sound mapped to an event category
     */
    playForCategory(category: string): void {
        const sound = CATEGORY_SOUND_MAP[category] || 'crisis';
        this.play(sound);
    }

    /**
     * Play the doom drone - intensity based on doom level (0-100)
     */
    playDoomDrone(doomLevel: number): void {
        if (this.muted || doomLevel < AUDIO.DOOM_DRONE_THRESHOLD) return;
        if (!this.initialized) this.init();

        // Intensity scales with doom (50-100 -> 0-1)
        const intensity = (doomLevel - AUDIO.DOOM_DRONE_THRESHOLD) / AUDIO.DOOM_DRONE_THRESHOLD;
        const volume = intensity * AUDIO.MAX_DOOM_VOLUME; // Max 15% volume
        const frequency = AUDIO.DOOM_MIN_FREQ + intensity * AUDIO.DOOM_FREQ_RANGE; // 40-70 Hz

        this.playTone(frequency, AUDIO.DOOM_DRONE_DURATION, volume, 'sawtooth');
    }

    /**
     * Toggle mute state
     */
    toggleMute(): boolean {
        this.muted = !this.muted;
        localStorage.setItem(AUDIO.MUTE_STORAGE_KEY, String(this.muted));

        if (this.muted) {
            Howler.mute(true);
        } else {
            Howler.mute(false);
        }

        return this.muted;
    }

    /**
     * Get current mute state
     */
    isMuted(): boolean {
        return this.muted;
    }

    /**
     * Set mute state directly
     */
    setMuted(muted: boolean): void {
        this.muted = muted;
        localStorage.setItem(AUDIO.MUTE_STORAGE_KEY, String(muted));
        Howler.mute(muted);
    }
}

// Singleton instance
export const soundManager = new SoundManager();
