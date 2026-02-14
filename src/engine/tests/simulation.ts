/**
 * Game Simulation Framework
 *
 * This module runs thousands of simulated games to analyze:
 * - Win/loss rates
 * - Event distribution and balance
 * - Choice impact analysis
 * - Game length statistics
 * - Tag effectiveness
 *
 * Use this for game balancing and ensuring the game is fun/fair.
 */

import {
    GameEngine,
    createSeededRandom,
    createDataProvider,
    type Device,
    type GameEvent,
    type Choice
} from '../index';

// ============================================================================
// Types
// ============================================================================

export interface SimulationConfig {
    /** Number of games to simulate */
    numGames: number;
    /** Starting seed for reproducibility */
    baseSeed: number;
    /** Strategy for making choices during simulation */
    choiceStrategy: ChoiceStrategy;
    /** Whether to log individual game details */
    verbose: boolean;
}

export type ChoiceStrategy =
    | 'random' // Pick any choice randomly
    | 'safe' // Always pick lowest doom impact
    | 'risky' // Always pick highest doom impact
    | 'cheap' // Always pick lowest cost
    | 'expensive'; // Always pick highest cost

export interface GameResult {
    seed: number;
    deviceId: string;
    outcome: 'win' | 'loss';
    finalMonth: number;
    finalDoom: number;
    finalBudget: number;
    eventsEncountered: number;
    totalDoomAccumulated: number;
    totalSpent: number;
    eventSequence: string[];
    choiceSequence: string[];
    finalTags: string[];
    shieldDeflections: number;
}

export interface EventStats {
    eventId: string;
    title: string;
    timesTriggered: number;
    choiceDistribution: Map<string, number>;
    averageDoomContribution: number;
    averageCostContribution: number;
    gamesWithEvent: number;
    winsWithEvent: number;
    lossesWithEvent: number;
}

export interface DeviceStats {
    deviceId: string;
    name: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    averageGameLength: number;
    averageFinalDoom: number;
    averageFinalBudget: number;
    averageWinningBudget: number;
}

export interface SimulationReport {
    config: SimulationConfig;
    timestamp: string;
    duration: number;

    // Overall stats
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    overallWinRate: number;

    // Per-device breakdown
    deviceStats: DeviceStats[];

    // Event analysis
    eventStats: EventStats[];
    mostCommonEvents: string[];
    rarestEvents: string[];
    deadliestEvents: string[];
    neverTriggeredEvents: string[];

    // Game length analysis
    averageGameLength: number;
    shortestGame: GameResult;
    longestGame: GameResult;
    gameLengthDistribution: Map<number, number>;

    // Balance indicators
    balanceScore: number; // 0-100, 50 = perfectly balanced
    balanceWarnings: string[];

    // Raw results (optional, for detailed analysis)
    allResults?: GameResult[];
}

// ============================================================================
// Simulation Engine
// ============================================================================

export class GameSimulator {
    private devices: Device[];
    private events: GameEvent[];
    private dataProvider: ReturnType<typeof createDataProvider>;

    constructor(devices: Device[], events: GameEvent[]) {
        this.devices = devices;
        this.events = events;
        this.dataProvider = createDataProvider(devices, events);
    }

    /**
     * Run a single simulated game
     */
    simulateGame(deviceId: string, seed: number, strategy: ChoiceStrategy): GameResult {
        const random = createSeededRandom(seed);
        const engine = new GameEngine(this.dataProvider, undefined, random);

        // Start the game
        engine.goToSetup();
        engine.selectDevice(deviceId);
        engine.startSimulation();

        const eventSequence: string[] = [];
        const choiceSequence: string[] = [];
        let totalDoom = 0;
        let totalSpent = 0;

        // Simulate game loop
        const MAX_ITERATIONS = 1000; // Safety limit
        let iterations = 0;

        while (iterations < MAX_ITERATIONS) {
            iterations++;
            const state = engine.getState();

            // Check end conditions
            if (state.phase === 'victory' || state.phase === 'autopsy') {
                break;
            }

            // Handle crisis
            if (state.phase === 'crisis' && state.currentCrisis) {
                const choice = this.selectChoice(state.currentCrisis.choices, strategy, random);
                eventSequence.push(state.currentCrisis.id);
                choiceSequence.push(choice.id);
                totalDoom += choice.doomImpact;
                totalSpent += choice.cost;
                engine.resolveCrisis(choice.id);
                continue;
            }

            // Advance time (simulate 1 month per tick to ensure event coverage)
            engine.advanceTime(1);
        }

        const finalState = engine.getState();

        return {
            seed,
            deviceId,
            outcome: finalState.phase === 'victory' ? 'win' : 'loss',
            finalMonth: finalState.timelineMonth,
            finalDoom: finalState.doomLevel,
            finalBudget: finalState.budget,
            eventsEncountered: eventSequence.length,
            totalDoomAccumulated: totalDoom,
            totalSpent,
            eventSequence,
            choiceSequence,
            finalTags: [...finalState.activeTags],
            shieldDeflections: finalState.shieldDeflections.length
        };
    }

    /**
     * Run multiple simulations and generate a report
     */
    runSimulation(config: SimulationConfig): SimulationReport {
        const startTime = Date.now();
        const results: GameResult[] = [];

        // Run games for each device
        const gamesPerDevice = Math.ceil(config.numGames / this.devices.length);

        for (let d = 0; d < this.devices.length; d++) {
            const device = this.devices[d];

            for (let i = 0; i < gamesPerDevice; i++) {
                const seed = config.baseSeed + d * gamesPerDevice + i;
                const result = this.simulateGame(device!.id, seed, config.choiceStrategy);
                results.push(result);

                if (config.verbose && i % 100 === 0) {
                    console.log(`Device ${device!.id}: ${i}/${gamesPerDevice} games`);
                }
            }
        }

        const duration = Date.now() - startTime;
        return this.generateReport(results, config, duration);
    }

    /**
     * Run exhaustive analysis with all strategies
     */
    runExhaustiveAnalysis(
        numGamesPerStrategy: number,
        baseSeed: number
    ): Map<ChoiceStrategy, SimulationReport> {
        const strategies: ChoiceStrategy[] = ['random', 'safe', 'risky', 'cheap', 'expensive'];
        const reports = new Map<ChoiceStrategy, SimulationReport>();

        for (const strategy of strategies) {
            console.log(`Running ${strategy} strategy...`);
            const report = this.runSimulation({
                numGames: numGamesPerStrategy,
                baseSeed,
                choiceStrategy: strategy,
                verbose: false
            });
            reports.set(strategy, report);
        }

        return reports;
    }

    // ==========================================================================
    // Private Helpers
    // ==========================================================================

    private selectChoice(
        choices: readonly Choice[],
        strategy: ChoiceStrategy,
        random: ReturnType<typeof createSeededRandom>
    ): Choice {
        switch (strategy) {
            case 'random':
                return random.pick(choices) ?? choices[0]!;

            case 'safe':
                return [...choices].sort((a, b) => a.doomImpact - b.doomImpact)[0]!;

            case 'risky':
                return [...choices].sort((a, b) => b.doomImpact - a.doomImpact)[0]!;

            case 'cheap':
                return [...choices].sort((a, b) => a.cost - b.cost)[0]!;

            case 'expensive':
                return [...choices].sort((a, b) => b.cost - a.cost)[0]!;

            default:
                return choices[0]!;
        }
    }

    private generateReport(
        results: GameResult[],
        config: SimulationConfig,
        duration: number
    ): SimulationReport {
        const totalGames = results.length;
        const wins = results.filter(r => r.outcome === 'win');
        const losses = results.filter(r => r.outcome === 'loss');

        // Device stats
        const deviceStats = this.calculateDeviceStats(results);

        // Event stats
        const eventStats = this.calculateEventStats(results);

        // Game length analysis
        const gameLengths = results.map(r => r.finalMonth);
        const avgLength = gameLengths.reduce((a, b) => a + b, 0) / gameLengths.length;

        const shortestGame = results.reduce((min, r) => (r.finalMonth < min.finalMonth ? r : min));
        const longestGame = results.reduce((max, r) => (r.finalMonth > max.finalMonth ? r : max));

        const lengthDist = new Map<number, number>();
        for (const len of gameLengths) {
            const bucket = Math.floor(len / 10) * 10; // 10-month buckets
            lengthDist.set(bucket, (lengthDist.get(bucket) ?? 0) + 1);
        }

        // Event analysis
        const sortedByFreq = [...eventStats].sort((a, b) => b.timesTriggered - a.timesTriggered);
        const mostCommon = sortedByFreq.slice(0, 5).map(e => e.eventId);
        const rarest = sortedByFreq
            .filter(e => e.timesTriggered > 0)
            .slice(-5)
            .map(e => e.eventId);
        const neverTriggered = eventStats.filter(e => e.timesTriggered === 0).map(e => e.eventId);

        const sortedByDeadly = [...eventStats]
            .filter(e => e.timesTriggered > 0)
            .sort((a, b) => b.averageDoomContribution - a.averageDoomContribution);
        const deadliest = sortedByDeadly.slice(0, 5).map(e => e.eventId);

        // Balance analysis
        const { balanceScore, balanceWarnings } = this.analyzeBalance(
            wins.length / totalGames,
            deviceStats,
            eventStats
        );

        return {
            config,
            timestamp: new Date().toISOString(),
            duration,
            totalGames,
            totalWins: wins.length,
            totalLosses: losses.length,
            overallWinRate: wins.length / totalGames,
            deviceStats,
            eventStats,
            mostCommonEvents: mostCommon,
            rarestEvents: rarest,
            deadliestEvents: deadliest,
            neverTriggeredEvents: neverTriggered,
            averageGameLength: avgLength,
            shortestGame,
            longestGame,
            gameLengthDistribution: lengthDist,
            balanceScore,
            balanceWarnings,
            allResults: config.verbose ? results : undefined
        };
    }

    private calculateDeviceStats(results: GameResult[]): DeviceStats[] {
        const stats: DeviceStats[] = [];

        for (const device of this.devices) {
            const deviceResults = results.filter(r => r.deviceId === device.id);
            const wins = deviceResults.filter(r => r.outcome === 'win');

            stats.push({
                deviceId: device.id,
                name: device.name,
                gamesPlayed: deviceResults.length,
                wins: wins.length,
                losses: deviceResults.length - wins.length,
                winRate: deviceResults.length > 0 ? wins.length / deviceResults.length : 0,
                averageGameLength:
                    deviceResults.length > 0
                        ? deviceResults.reduce((sum, r) => sum + r.finalMonth, 0) /
                          deviceResults.length
                        : 0,
                averageFinalDoom:
                    deviceResults.length > 0
                        ? deviceResults.reduce((sum, r) => sum + r.finalDoom, 0) /
                          deviceResults.length
                        : 0,
                averageFinalBudget:
                    deviceResults.length > 0
                        ? deviceResults.reduce((sum, r) => sum + r.finalBudget, 0) /
                          deviceResults.length
                        : 0,
                averageWinningBudget:
                    wins.length > 0
                        ? wins.reduce((sum, r) => sum + r.finalBudget, 0) / wins.length
                        : 0
            });
        }

        return stats;
    }

    private calculateEventStats(results: GameResult[]): EventStats[] {
        const stats: EventStats[] = [];

        for (const event of this.events) {
            const gamesWithEvent = results.filter(r => r.eventSequence.includes(event.id));
            const timesTriggered = results.reduce(
                (count, r) => count + r.eventSequence.filter(e => e === event.id).length,
                0
            );

            // Calculate choice distribution
            const choiceDist = new Map<string, number>();
            let totalDoom = 0;
            let totalCost = 0;
            let choiceCount = 0;

            for (const result of results) {
                for (let i = 0; i < result.eventSequence.length; i++) {
                    if (result.eventSequence[i] === event.id) {
                        const choiceId = result.choiceSequence[i]!;
                        choiceDist.set(choiceId, (choiceDist.get(choiceId) ?? 0) + 1);

                        // Find the choice to get doom/cost
                        const choice = event.choices.find(c => c.id === choiceId);
                        if (choice) {
                            totalDoom += choice.doomImpact;
                            totalCost += choice.cost;
                            choiceCount++;
                        }
                    }
                }
            }

            const winsWithEvent = gamesWithEvent.filter(r => r.outcome === 'win').length;

            stats.push({
                eventId: event.id,
                title: event.title,
                timesTriggered,
                choiceDistribution: choiceDist,
                averageDoomContribution: choiceCount > 0 ? totalDoom / choiceCount : 0,
                averageCostContribution: choiceCount > 0 ? totalCost / choiceCount : 0,
                gamesWithEvent: gamesWithEvent.length,
                winsWithEvent,
                lossesWithEvent: gamesWithEvent.length - winsWithEvent
            });
        }

        return stats;
    }

    private analyzeBalance(
        overallWinRate: number,
        deviceStats: DeviceStats[],
        eventStats: EventStats[]
    ): { balanceScore: number; balanceWarnings: string[] } {
        const warnings: string[] = [];

        // Win rate balance (ideal: 30-50% for a challenging game)
        let winRateScore = 100;
        if (overallWinRate < 0.1) {
            warnings.push('Game is too hard: win rate below 10%');
            winRateScore = 30;
        } else if (overallWinRate < 0.2) {
            warnings.push('Game is quite difficult: win rate 10-20%');
            winRateScore = 60;
        } else if (overallWinRate > 0.7) {
            warnings.push('Game is too easy: win rate above 70%');
            winRateScore = 40;
        } else if (overallWinRate > 0.5) {
            warnings.push('Game might be too easy: win rate above 50%');
            winRateScore = 70;
        }

        // Device balance (all devices should have similar win rates)
        const winRates = deviceStats.map(d => d.winRate);
        const maxDiff = Math.max(...winRates) - Math.min(...winRates);
        let deviceBalance = 100;
        if (maxDiff > 0.4) {
            warnings.push(`Large win rate gap between devices: ${(maxDiff * 100).toFixed(1)}%`);
            deviceBalance = 50;
        } else if (maxDiff > 0.2) {
            warnings.push(`Moderate win rate gap between devices: ${(maxDiff * 100).toFixed(1)}%`);
            deviceBalance = 75;
        }

        // Event coverage (all events should trigger sometimes)
        const neverTriggered = eventStats.filter(e => e.timesTriggered === 0);
        let eventCoverage = 100;
        if (neverTriggered.length > 0) {
            warnings.push(
                `${neverTriggered.length} events never triggered: ${neverTriggered.map(e => e.eventId).join(', ')}`
            );
            eventCoverage = 100 - (neverTriggered.length / eventStats.length) * 50;
        }

        // Dominant events check
        const totalTriggers = eventStats.reduce((sum, e) => sum + e.timesTriggered, 0);
        const dominantEvents = eventStats.filter(e => e.timesTriggered > totalTriggers * 0.3);
        let eventVariety = 100;
        if (dominantEvents.length > 0) {
            warnings.push(
                `Dominant events (>30% of all triggers): ${dominantEvents.map(e => e.eventId).join(', ')}`
            );
            eventVariety = 70;
        }

        // Calculate overall balance score
        const balanceScore = Math.round(
            winRateScore * 0.4 + deviceBalance * 0.2 + eventCoverage * 0.2 + eventVariety * 0.2
        );

        return { balanceScore, balanceWarnings: warnings };
    }
}

// ============================================================================
// Report Formatting
// ============================================================================

export function formatReport(report: SimulationReport): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('GAME SIMULATION REPORT');
    lines.push('='.repeat(60));
    lines.push('');

    lines.push(`Timestamp: ${report.timestamp}`);
    lines.push(`Duration: ${report.duration}ms`);
    lines.push(`Strategy: ${report.config.choiceStrategy}`);
    lines.push('');

    lines.push('--- OVERALL STATISTICS ---');
    lines.push(`Total Games: ${report.totalGames}`);
    lines.push(`Wins: ${report.totalWins} (${(report.overallWinRate * 100).toFixed(1)}%)`);
    lines.push(`Losses: ${report.totalLosses}`);
    lines.push(`Average Game Length: ${report.averageGameLength.toFixed(1)} months`);
    lines.push('');

    lines.push('--- BALANCE SCORE ---');
    lines.push(`Score: ${report.balanceScore}/100`);
    if (report.balanceWarnings.length > 0) {
        lines.push('Warnings:');
        for (const warning of report.balanceWarnings) {
            lines.push(`  - ${warning}`);
        }
    } else {
        lines.push('No balance issues detected!');
    }
    lines.push('');

    lines.push('--- DEVICE BREAKDOWN ---');
    for (const device of report.deviceStats) {
        lines.push(`${device.name} (${device.deviceId}):`);
        lines.push(`  Win Rate: ${(device.winRate * 100).toFixed(1)}%`);
        lines.push(`  Avg Length: ${device.averageGameLength.toFixed(1)} months`);
        lines.push(`  Avg Doom: ${device.averageFinalDoom.toFixed(1)}`);
        lines.push(`  Avg Budget: $${device.averageFinalBudget.toFixed(0)}`);
        lines.push(`  Avg Win Budget: $${device.averageWinningBudget.toFixed(0)}`);
    }
    lines.push('');

    lines.push('--- EVENT ANALYSIS ---');
    lines.push(`Most Common: ${report.mostCommonEvents.join(', ')}`);
    lines.push(`Deadliest: ${report.deadliestEvents.join(', ')}`);
    if (report.neverTriggeredEvents.length > 0) {
        lines.push(`Never Triggered: ${report.neverTriggeredEvents.join(', ')}`);
    }
    lines.push('');

    lines.push('--- GAME LENGTH DISTRIBUTION ---');
    const sortedBuckets = [...report.gameLengthDistribution.entries()].sort((a, b) => a[0] - b[0]);
    for (const [bucket, count] of sortedBuckets) {
        const bar = '#'.repeat(Math.ceil((count / report.totalGames) * 50));
        lines.push(
            `  ${bucket.toString().padStart(2)}-${(bucket + 9).toString().padStart(2)} months: ${bar} (${count})`
        );
    }

    lines.push('');
    lines.push('='.repeat(60));

    return lines.join('\n');
}
