import { GameEngine } from '../src/engine/GameEngine';
import { createValidatedDataProvider } from '../src/engine/data-provider';
import devicesData from '../src/data/devices.json';
import eventsData from '../src/data/events.json';
import type { Choice } from '../src/engine/types';

const dataProvider = createValidatedDataProvider(devicesData, eventsData);

function simulateGame(strategy: 'safe' | 'risky' | 'random'): {
    won: boolean;
    month: number;
    doom: number;
    budget: number;
} {
    const engine = new GameEngine(dataProvider);

    // 1. Setup
    engine.dispatch({ type: 'GO_TO_SETUP' });

    // Pick a random device
    const devices = engine.getState().availableDevices;
    const device = devices[Math.floor(Math.random() * devices.length)]!;
    engine.dispatch({ type: 'SELECT_DEVICE', deviceId: device.id });

    engine.dispatch({ type: 'START_SIMULATION' });

    let state = engine.getState();

    while (state.phase === 'simulation' || state.phase === 'crisis') {
        if (state.phase === 'crisis' && state.currentCrisis) {
            // Resolve Crisis
            const choices = state.currentCrisis.choices;
            let choice: Choice;

            if (strategy === 'safe') {
                // Pick lowest doom impact
                choice = [...choices].sort((a, b) => a.doomImpact - b.doomImpact)[0]!;
            } else if (strategy === 'risky') {
                // Pick lowest cost
                choice = [...choices].sort((a, b) => a.cost - b.cost)[0]!;
            } else {
                choice = choices[Math.floor(Math.random() * choices.length)]!;
            }

            engine.dispatch({ type: 'RESOLVE_CRISIS', choiceId: choice.id });
        } else {
            // Simulation Loop

            // Strategy: Ship Product?
            // "Safe": Only ship if doom is low (<20) and budget low (<10k)
            // "Risky": Ship if doom < 40

            if (strategy === 'risky' && state.doomLevel < 40) {
                engine.dispatch({ type: 'SHIP_PRODUCT' });
            } else if (strategy === 'safe' && state.budget < 20000 && state.doomLevel < 20) {
                engine.dispatch({ type: 'SHIP_PRODUCT' });
            }

            // Normal Tick
            engine.dispatch({ type: 'ADVANCE_TIME', deltaMonths: 1 });
        }

        state = engine.getState();
        if (state.phase === 'victory' || state.phase === 'autopsy') break;
    }

    return {
        won: state.phase === 'victory',
        month: state.timelineMonth,
        doom: state.doomLevel,
        budget: state.budget
    };
}

// Run Monte Carlo
const RUNS = 10000;
console.log(`Running ${RUNS} simulations...`);

const stats = {
    wins: 0,
    losses: 0,
    deathsByDoom: 0,
    deathsByBudget: 0,
    avgMonths: 0,
    deviceStats: {} as Record<string, { plays: number; wins: number }>
};

const errors: string[] = [];

for (let i = 0; i < RUNS; i++) {
    try {
        const r = simulateGame('random'); // Use random to test edge cases

        // Update Stats
        if (r.won) stats.wins++;
        else stats.losses++;

        stats.avgMonths += r.month;

        if (!r.won) {
            if (r.doom >= 100) stats.deathsByDoom++;
            else if (r.budget <= 0) stats.deathsByBudget++;
        }

        // Device Stats (Need to return device ID from simulate)
        // Note: Modified simulateGame to return deviceId would be better, but we can't easily here without rewriting function.
        // Skipping device breakdown for now to keep it simple, checking global stability.
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push(message);
        if (errors.length > 10) break; // Stop if too many errors
    }
}

console.log('--- Stress Test Results ---');
console.log(`Runs: ${RUNS}`);
console.log(`Win Rate: ${((stats.wins / RUNS) * 100).toFixed(2)}%`);
console.log(`Avg Lifespan: ${(stats.avgMonths / RUNS).toFixed(1)} months`);
console.log(
    `Cause of Death: Doom ${((stats.deathsByDoom / stats.losses) * 100).toFixed(1)}% | Budget ${((stats.deathsByBudget / stats.losses) * 100).toFixed(1)}%`
);
if (errors.length > 0) {
    console.error('Errors encountered:');
    errors.forEach(e => console.error(`- ${e}`));
} else {
    console.log('No crashes detected.');
}
