import { GameEngine, type GameStateSnapshot, type GameCommand, type Choice } from '../../engine';
import { formatBudget, formatCost } from '../../utils/format';

export class TextAdapter {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    getState(): GameStateSnapshot {
        return this.engine.getState();
    }

    sendCommand(command: GameCommand): void {
        this.engine.dispatch(command);
    }

    // Helper to render state mainly for debugging or CLI output
    render(): string {
        const state = this.engine.getState();
        let output = `Phase: ${state.phase}\n`;
        output += `Month: ${state.timelineMonth}\n`;
        output += `Budget: ${formatBudget(state.budget)}\n`;
        output += `Doom: ${state.doomLevel}%\n`;
        output += `Compliance: ${state.complianceLevel.toFixed(1)}%\n`;

        if (state.phase === 'setup') {
            output += `\nAvailable Devices:\n`;
            state.availableDevices.forEach((d, i) => {
                output += `${i + 1}. ${d.name} [${d.id}]\n`;
            });
        }

        if (state.phase === 'simulation') {
            output += `Active Tags: ${state.activeTags.join(', ') || 'None'}\n`;
        }

        if (state.phase === 'crisis' && state.currentCrisis) {
            output += `\nCRISIS: ${state.currentCrisis.title}\n`;
            output += `${state.currentCrisis.description}\n`;
            state.currentCrisis.choices.forEach((c: Choice, i: number) => {
                output += `${i + 1}. ${c.text} (${formatCost(c.cost)})\n`;
            });
        }

        return output;
    }
}
