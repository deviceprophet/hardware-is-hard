/**
 * Core Game Engine
 *
 * This is the heart of the game logic, completely framework-agnostic.
 * It can be used with React, Vue, CLI, or any other interface.
 *
 * Design principles:
 * - Immutable state updates (via snapshots)
 * - Dependency injection for testability
 * - Event-driven state changes
 * - Pure computation functions (in extracted modules)
 *
 * Module structure:
 * - random.ts: Random providers (default + seeded)
 * - event-processor.ts: Event filtering and selection
 * - state-manager.ts: State creation and snapshots
 * - logic/event-logic.ts: Event probability calculations
 * - logic/compliance-logic.ts: Regulatory compliance calculations
 */

import type {
    GameEvent,
    GameStateSnapshot,
    SharePayload,
    GameConfig,
    RandomProvider,
    DataProvider,
    GameCommand
} from './types';

import { DEFAULT_CONFIG, OTA_MONETIZATION_CONFIG } from './constants';

// Extracted modules
import { defaultRandomProvider } from './random';
import {
    filterEligibleEvents,
    selectEventByProbability,
    type EventFilterContext
} from './event-processor';
import {
    createInitialState,
    createSnapshot,
    canTransitionPhase,
    analyzeDeathCause,
    restoreState,
    type InternalState
} from './state-manager';
import { calculateComplianceUpdates } from './logic/compliance-logic';

// Re-export for backwards compatibility
export { defaultRandomProvider, createSeededRandom } from './random';

// ============================================================================
// Game Engine Class
// ============================================================================

export type StateListener = (state: GameStateSnapshot) => void;

export class GameEngine {
    private state: InternalState;
    private listeners: Set<StateListener> = new Set();
    private readonly config: GameConfig;
    private readonly random: RandomProvider;
    private readonly data: DataProvider;
    private cachedSnapshot: GameStateSnapshot | null = null;

    constructor(
        dataProvider: DataProvider,
        config: GameConfig = DEFAULT_CONFIG,
        randomProvider: RandomProvider = defaultRandomProvider
    ) {
        this.config = config;
        this.random = randomProvider;
        this.data = dataProvider;
        this.state = createInitialState();
    }

    // ==========================================================================
    // Public API - Queries
    // ==========================================================================

    /** Get a readonly snapshot of the current state */
    getState(): GameStateSnapshot {
        if (!this.cachedSnapshot) {
            const deathAnalysis =
                this.state.phase === 'autopsy' ? analyzeDeathCause(this.state, this.config) : null;
            this.cachedSnapshot = createSnapshot(this.state, deathAnalysis);
        }
        return this.cachedSnapshot;
    }

    /** Get the game configuration */
    getConfig(): GameConfig {
        return { ...this.config };
    }

    /** Get all eligible events for current state (for debugging/testing) */
    getEligibleEvents(): readonly GameEvent[] {
        const context = this.createEventFilterContext();
        const { eligible } = filterEligibleEvents(this.data, context);
        return eligible;
    }

    /** Get data for sharing */
    getSharePayload(): SharePayload {
        const { selectedDevice, doomLevel, history, timelineMonth, phase } = this.state;

        let result: 'fail' | 'win' | 'playing';
        if (phase === 'autopsy') result = 'fail';
        else if (phase === 'victory') result = 'win';
        else result = 'playing';

        return {
            deviceId: selectedDevice?.id ?? null,
            doomLevel,
            eventsCount: history.length,
            result,
            finalMonth: timelineMonth
        };
    }

    // ==========================================================================
    // Public API - Commands
    // ==========================================================================

    /** Subscribe to state changes */
    subscribe(listener: StateListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /** Process a game command */
    dispatch(command: GameCommand): void {
        switch (command.type) {
            case 'INITIALIZE':
                this.initialize();
                break;
            case 'GO_TO_SETUP':
                this.goToSetup();
                break;
            case 'SELECT_DEVICE':
                this.selectDevice(command.deviceId);
                break;
            case 'START_SIMULATION':
                this.startSimulation();
                break;
            case 'ADVANCE_TIME':
                this.advanceTime(command.deltaMonths);
                break;
            case 'SET_FUNDING':
                this.setFundingLevel(command.level);
                break;
            case 'TRIGGER_CRISIS':
                this.triggerCrisis(command.eventId);
                break;
            case 'RESOLVE_CRISIS':
                this.resolveCrisis(command.choiceId);
                break;
            case 'RESET':
                this.reset();
                break;
            case 'SHIP_PRODUCT':
                this.shipProduct();
                break;
        }
    }

    // ==========================================================================
    // Command Implementations
    // ==========================================================================

    initialize(): void {
        this.state = createInitialState();
        this.notify();
    }

    goToSetup(preferredDeviceId?: string): void {
        if (!canTransitionPhase(this.state.phase, 'setup')) {
            console.warn(`Invalid phase transition: ${this.state.phase} -> setup`);
            return;
        }

        this.state.phase = 'setup';

        // Generate random device options
        const allDevices = this.data.getDevices();

        // Determine persistent device (preferred or fallback to omni-juice)
        const targetId = preferredDeviceId || 'omni-juice';
        let persistent = allDevices.find(d => d.id === targetId);

        // Fallback if preferred ID is invalid or not found
        if (!persistent && targetId !== 'omni-juice') {
            persistent = allDevices.find(d => d.id === 'omni-juice');
        }

        const others = allDevices.filter(d => d.id !== persistent?.id);

        // Shuffle and pick 2 random others
        const pool = [...others];
        for (let i = pool.length - 1; i > 0; i--) {
            const j = this.random.randomInt(i + 1);
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        const randomPicks = pool.slice(0, 2);
        this.state.availableDevices = persistent ? [persistent, ...randomPicks] : randomPicks;

        this.notify();
    }

    selectDevice(deviceId: string): void {
        const device = this.data.getDevice(deviceId);
        if (!device) {
            console.warn(`Device not found: ${deviceId}`);
            return;
        }

        this.state.selectedDevice = device;
        this.state.budget = device.initialBudget;
        this.state.activeTags = [...device.initialTags];
        this.state.complianceLevel = 100;
        this.state.fundingLevel = 'full';
        this.notify();
    }

    startSimulation(): void {
        if (!this.state.selectedDevice) {
            console.warn('Cannot start simulation without selecting a device');
            return;
        }

        if (!canTransitionPhase(this.state.phase, 'simulation')) {
            console.warn(`Invalid phase transition: ${this.state.phase} -> simulation`);
            return;
        }

        this.state.phase = 'simulation';
        this.state.timelineMonth = 0;
        this.state.lastEventMonth = -1;
        this.state.isPaused = false;
        this.notify();
    }

    advanceTime(deltaMonths: number): void {
        if (this.state.phase !== 'simulation' || this.state.isPaused) {
            return;
        }

        // Process compliance and costs
        this.processRegulatoryCompliance(deltaMonths);

        // Update timeline
        const newMonth = Math.min(this.config.totalMonths, this.state.timelineMonth + deltaMonths);
        this.state.timelineMonth = newMonth;

        // Check win condition
        if (newMonth >= this.config.totalMonths) {
            this.state.phase = 'victory';
            this.notify();
            return;
        }

        // Check doom (lose condition)
        if (this.state.doomLevel >= this.config.maxDoom) {
            this.state.phase = 'autopsy';
            this.notify();
            return;
        }

        // Event trigger check
        if (newMonth > this.state.lastEventMonth + this.config.eventIntervalMonths - 1) {
            this.tryTriggerEvent(newMonth);
        }

        this.notify();
    }

    setFundingLevel(level: 'full' | 'partial' | 'none'): void {
        this.state.fundingLevel = level;
        this.notify();
    }

    shipProduct(): void {
        if (this.state.phase !== 'simulation' || this.state.isPaused) {
            return;
        }

        // Quality Gate: Cannot ship if Doom > 50%
        if (this.state.doomLevel >= this.config.maxDoom * 0.5) {
            return;
        }

        this.state.budget += OTA_MONETIZATION_CONFIG.REWARD;
        this.state.doomLevel += OTA_MONETIZATION_CONFIG.DOOM_PENALTY;
        this.advanceTime(1);
    }

    triggerCrisis(eventId: string): void {
        if (this.state.phase !== 'simulation') {
            console.warn(`Cannot trigger crisis in phase: ${this.state.phase}`);
            return;
        }

        const event = this.data.getEvent(eventId);
        if (!event) {
            console.warn(`Event not found: ${eventId}`);
            return;
        }

        this.state.currentCrisis = event;
        this.state.phase = 'crisis';
        this.state.isPaused = true;
        this.notify();
    }

    resolveCrisis(choiceId: string): void {
        const { currentCrisis } = this.state;
        if (!currentCrisis) {
            console.warn('No active crisis to resolve');
            return;
        }

        const choice = currentCrisis.choices.find(c => c.id === choiceId);
        if (!choice) {
            console.warn(`Choice not found: ${choiceId}`);
            return;
        }

        // Apply effects
        this.state.budget -= choice.cost;
        this.state.doomLevel = Math.min(
            this.config.maxDoom,
            this.state.doomLevel + choice.doomImpact
        );

        // Apply tag changes
        if (choice.addTags) {
            for (const tag of choice.addTags) {
                if (!this.state.activeTags.includes(tag)) {
                    this.state.activeTags.push(tag);
                }
            }
        }
        if (choice.removeTags) {
            this.state.activeTags = this.state.activeTags.filter(
                t => !choice.removeTags?.includes(t)
            );
        }

        // Record history
        this.state.history.push({
            month: this.state.timelineMonth,
            eventId: currentCrisis.id,
            choiceId: choice.id,
            doomIncrease: choice.doomImpact,
            cost: choice.cost
        });

        // Check for immediate doom
        if (this.state.doomLevel >= this.config.maxDoom) {
            this.state.currentCrisis = null;
            this.state.phase = 'autopsy';
            this.notify();
            return;
        }

        // Return to simulation
        this.state.currentCrisis = null;
        this.state.phase = 'simulation';
        this.state.isPaused = false;
        this.notify();
    }

    reset(): void {
        this.initialize();
    }

    restoreState(savedState: Partial<GameStateSnapshot>): void {
        this.state = restoreState(this.state, savedState);
        this.notify();
    }

    // ==========================================================================
    // Private Helpers
    // ==========================================================================

    private createEventFilterContext(): EventFilterContext {
        return {
            activeTags: this.state.activeTags,
            history: this.state.history,
            timelineMonth: this.state.timelineMonth,
            budget: this.state.budget,
            doomLevel: this.state.doomLevel
        };
    }

    private tryTriggerEvent(currentMonth: number): void {
        const context = this.createEventFilterContext();
        const { eligible, deflections } = filterEligibleEvents(this.data, context);

        // Record deflections
        this.state.shieldDeflections.push(...deflections);

        if (eligible.length > 0) {
            const event = selectEventByProbability(
                eligible,
                this.state.activeTags,
                this.state.doomLevel,
                this.random
            );
            if (event) {
                this.state.currentCrisis = event;
                this.state.phase = 'crisis';
                this.state.isPaused = true;
                this.state.lastEventMonth = currentMonth;
            }
        }
    }

    private processRegulatoryCompliance(monthsPassed: number): void {
        if (!this.state.selectedDevice) return;

        const result = calculateComplianceUpdates(
            this.state.selectedDevice,
            monthsPassed,
            this.state.timelineMonth,
            this.state.fundingLevel,
            this.state.activeTags,
            this.state.complianceLevel
        );

        this.state.budget -= result.cost;
        this.state.complianceLevel = Math.max(
            0,
            Math.min(100, this.state.complianceLevel + result.complianceChange)
        );

        for (const tag of result.newTagsToAdd) {
            if (!this.state.activeTags.includes(tag)) {
                this.state.activeTags.push(tag);
            }
        }

        if (result.tagsToRemove.length > 0) {
            this.state.activeTags = this.state.activeTags.filter(
                t => !result.tagsToRemove.includes(t)
            );
        }
    }

    private notify(): void {
        const deathAnalysis =
            this.state.phase === 'autopsy' ? analyzeDeathCause(this.state, this.config) : null;
        this.cachedSnapshot = createSnapshot(this.state, deathAnalysis);
        const snapshot = this.cachedSnapshot;

        for (const listener of this.listeners) {
            try {
                listener(snapshot);
            } catch (e) {
                console.error('Error in state listener:', e);
            }
        }
    }
}
