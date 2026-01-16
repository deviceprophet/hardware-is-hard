#!/usr/bin/env node
/**
 * The Recall Run - CLI Game
 *
 * Play the IoT Doom Simulator in your terminal!
 *
 * Usage: npx hardware-is-hard
 *   or:  pnpm dlx hardware-is-hard
 *   or:  node dist/cli.js
 */

import { ConsoleGame } from './adapters/console';
import type { Device, GameEvent } from './engine';

// Load game data
import devicesData from './data/devices.json';
import eventsData from './data/events.json';

async function main() {
    const game = new ConsoleGame(devicesData as Device[], eventsData as GameEvent[]);

    try {
        await game.start();
    } catch (error) {
        if ((error as Error).message?.includes('readline was closed')) {
            // User pressed Ctrl+C, exit gracefully
            console.log('\n\nGame interrupted. Goodbye!');
        } else {
            throw error;
        }
    } finally {
        game.close();
        process.exit(0);
    }
}

main().catch(console.error);
