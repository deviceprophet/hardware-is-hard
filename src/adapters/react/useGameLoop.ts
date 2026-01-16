/**
 * React Adapter - Game Loop Hook
 *
 * Handles the real-time game loop using requestAnimationFrame.
 * Converts wall-clock time to game time and dispatches to the engine.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from './store';
import { monthsPerMs, DEFAULT_CONFIG } from '../../engine';

const MONTHS_PER_MS = monthsPerMs(DEFAULT_CONFIG);

export const useGameLoop = () => {
    const tick = useGameStore(state => state.tick);
    const phase = useGameStore(state => state.phase);
    const timelineMonth = useGameStore(state => state.timelineMonth);
    const isPaused = useGameStore(state => state.isPaused);

    const gameSpeed = useGameStore(state => state.gameSpeed);

    const lastTimeRef = useRef<number>(0);
    const accumulatedTimeRef = useRef<number>(0);
    const requestRef = useRef<number>(0);

    const loop = (time: number) => {
        if (lastTimeRef.current !== 0) {
            const deltaTime = time - lastTimeRef.current;
            const multiplier = gameSpeed === 'fast' ? 3.0 : 1.0;

            if (!isPaused && phase === 'simulation') {
                accumulatedTimeRef.current += deltaTime * multiplier;
                const currentMonth = accumulatedTimeRef.current * MONTHS_PER_MS;
                tick(currentMonth);
            }
        }

        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(loop);
    };

    // Sync accumulator with store time when loading a game or switching phases
    // This prevents the "stuck game" issue where accumulator starts at 0 while timelineMonth is > 0
    useEffect(() => {
        if (phase === 'simulation') {
            const currentInternalMonth = accumulatedTimeRef.current * MONTHS_PER_MS;
            // If store time is significantly ahead of internal time (e.g. loaded save), sync up
            if (timelineMonth > currentInternalMonth + 0.1) {
                accumulatedTimeRef.current = timelineMonth / MONTHS_PER_MS;
            }
        }
    }, [phase, timelineMonth]);

    useEffect(() => {
        // Start loop
        requestRef.current = requestAnimationFrame(loop);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [phase, isPaused, tick, gameSpeed]);

    // Reset accumulator when returning to setup/splash
    useEffect(() => {
        if (phase === 'setup' || phase === 'splash') {
            accumulatedTimeRef.current = 0;
            lastTimeRef.current = 0;
        }
    }, [phase]);
};
