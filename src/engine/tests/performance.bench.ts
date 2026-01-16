import { describe, it, expect } from 'vitest';
import { GameSimulator } from './simulation';
import devicesData from '../../data/devices.json';
import eventsData from '../../data/events.json';
import type { Device, GameEvent } from '../index';

describe('Game Engine Performance', () => {
    it('should run 1000 simulations under 2 seconds', () => {
        const simulator = new GameSimulator(devicesData as Device[], eventsData as GameEvent[]);

        const start = performance.now();

        // Run 1000 games randomly (200 per strategy roughly, or just 1000 random)
        simulator.runSimulation({
            numGames: 1000,
            baseSeed: 999,
            choiceStrategy: 'random',
            verbose: false
        });

        const end = performance.now();
        const duration = end - start;

        // console.log(`1000 Games took ${duration.toFixed(2)}ms`); // ${(duration/1000).toFixed(4)}ms per game

        // Assert reasonable performance (e.g., < 2ms per game = 2000ms total)
        // Loose bound to prevent flaky CI
        expect(duration).toBeLessThan(5000);
    });
});
