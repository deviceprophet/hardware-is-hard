/**
 * useSound Hook - React integration for SoundManager
 */

import { useEffect, useCallback, useState } from 'react';
import { soundManager } from './SoundManager';
import { useGameStore } from '../react';
import { AUDIO } from '../../engine/constants';

export function useSound() {
    const [isMuted, setIsMuted] = useState(soundManager.isMuted());

    const toggleMute = useCallback(() => {
        const newState = soundManager.toggleMute();
        setIsMuted(newState);
    }, []);

    const playClick = useCallback(() => soundManager.play('click'), []);
    const playError = useCallback(() => soundManager.play('error'), []);
    const playShip = useCallback(() => soundManager.play('ship'), []);
    const playCrisis = useCallback(() => soundManager.play('crisis'), []);
    const playVictory = useCallback(() => soundManager.play('victory'), []);
    const playDefeat = useCallback(() => soundManager.play('defeat'), []);

    return {
        isMuted,
        toggleMute,
        playClick,
        playError,
        playShip,
        playCrisis,
        playVictory,
        playDefeat
    };
}

/**
 * useSoundEffects - Automatically plays sounds based on game state changes
 */
export function useSoundEffects() {
    const phase = useGameStore(state => state.phase);
    const doomLevel = useGameStore(state => state.doomLevel);
    const isPaused = useGameStore(state => state.isPaused);
    const currentCrisis = useGameStore(state => state.currentCrisis);

    // Track previous values to detect changes
    useEffect(() => {
        // Initialize audio on first user interaction
        const initAudio = () => {
            soundManager.init();
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);

        return () => {
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };
    }, []);

    // Play doom drone when doom is high
    useEffect(() => {
        if (phase === 'simulation' && doomLevel >= AUDIO.DOOM_DRONE_THRESHOLD && !isPaused) {
            const interval = setInterval(() => {
                soundManager.playDoomDrone(doomLevel);
            }, AUDIO.DOOM_DRONE_INTERVAL_MS); // Low hum every 3 seconds
            return () => clearInterval(interval);
        }
    }, [phase, doomLevel, isPaused]);

    // React to phase changes
    useEffect(() => {
        switch (phase) {
            case 'crisis':
                soundManager.playForCategory(currentCrisis?.category || 'operational');
                break;
            case 'victory':
                soundManager.play('victory');
                break;
            case 'autopsy':
                soundManager.play('defeat');
                break;
        }
    }, [phase, currentCrisis]);
}
