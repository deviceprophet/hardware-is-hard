import * as readline from 'readline';
import i18next from 'i18next';
import {
    GameEngine,
    createDataProvider,
    type Device,
    type GameEvent,
    type GameConfig,
    DEFAULT_CONFIG
} from '../../engine';
import { formatBudget, formatCost, formatGameDate } from '../../utils/format';
import { SHARE } from '../../config/constants';

// Import translations
import enTranslation from '../../locales/en/translation.json';
import esTranslation from '../../locales/es/translation.json';
import enContent from '../../locales/en/content.json';
import esContent from '../../locales/es/content.json';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m'
};

function color(text: string, ...codes: string[]): string {
    return codes.join('') + text + colors.reset;
}

const BOX_CHARS = {
    tl: '┏',
    tr: '┓',
    bl: '┗',
    br: '┛',
    h: '━',
    v: '┃',
    t: '┳',
    b: '┻',
    l: '┣',
    r: '┫',
    c: '╋'
};

export class ConsoleGame {
    private engine: GameEngine;
    private rl: readline.Interface;
    private devices: Device[];
    private events: GameEvent[];
    private config: GameConfig;
    private gameSpeed: number = 0.5; // Seconds per tick
    private language: 'en' | 'es' = 'en';

    constructor(devices: Device[], events: GameEvent[], config: GameConfig = DEFAULT_CONFIG) {
        this.devices = devices;
        this.events = events;
        this.config = config;

        const dataProvider = createDataProvider(devices, events);
        this.engine = new GameEngine(dataProvider, config);

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start(): Promise<void> {
        // Initial i18n setup
        await i18next.init({
            lng: 'en',
            resources: {
                en: { translation: enTranslation, content: enContent },
                es: { translation: esTranslation, content: esContent }
            }
        });

        this.clearScreen();
        await this.showLanguageSelection();

        this.clearScreen();
        this.showSplash();
        await this.waitForEnter();

        await this.gameLoop();
    }

    private async showLanguageSelection(): Promise<void> {
        console.log('\n  Select Language / Seleccionar Idioma:');
        console.log('  1. English');
        console.log('  2. Español');
        console.log('');
        const choice = await this.prompt('Choice (1-2): ');
        if (choice === '2') {
            this.language = 'es';
            await i18next.changeLanguage('es');
        } else {
            this.language = 'en';
            await i18next.changeLanguage('en');
        }
    }

    private clearScreen(): void {
        process.stdout.write('\x1Bc');
    }

    /**
     * Helper to draw a box around text
     */
    private drawBox(lines: string[], borderColor: string = colors.cyan, title?: string): void {
        // Calculate width based on content (stripping ANSI codes for length)
        const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');
        const maxWidth =
            Math.max(
                title ? stripAnsi(title).length + 4 : 0,
                ...lines.map(line => stripAnsi(line).length)
            ) + 4;

        const top = title
            ? BOX_CHARS.tl +
              BOX_CHARS.h +
              ' ' +
              title +
              ' ' +
              BOX_CHARS.h.repeat(maxWidth - stripAnsi(title).length - 3) +
              BOX_CHARS.tr
            : BOX_CHARS.tl + BOX_CHARS.h.repeat(maxWidth) + BOX_CHARS.tr;

        console.log(color(top, borderColor));

        lines.forEach(line => {
            const contentLen = stripAnsi(line).length;
            const padding = ' '.repeat(maxWidth - contentLen);
            console.log(
                color(BOX_CHARS.v, borderColor) +
                    '  ' +
                    line +
                    padding.slice(2) +
                    color(BOX_CHARS.v, borderColor)
            );
        });

        console.log(color(BOX_CHARS.bl + BOX_CHARS.h.repeat(maxWidth) + BOX_CHARS.br, borderColor));
    }

    private showSplash(): void {
        const t = i18next.t.bind(i18next);
        this.drawBox(
            [
                '',
                color(t('splash.title'), colors.green, colors.bright),
                '',
                color(t('splash.subtitle'), colors.yellow, colors.bright),
                '',
                BOX_CHARS.h.repeat(20),
                '',
                `${t('splash.winRate')}:   ` + color('12%', colors.green),
                `${t('splash.attempts')}:  ` + color('42', colors.magenta),
                '',
                color(t('splash.recentLogs'), colors.dim),
                color('  - Year 3: ' + t('autopsy.doomOverload'), colors.dim),
                color('  - Year 5: ' + t('victory.title'), colors.dim),
                '',
                color(t('splash.startButton'), colors.cyan, colors.bright)
            ],
            colors.cyan
        );
    }

    private async gameLoop(): Promise<void> {
        while (true) {
            const state = this.engine.getState();

            switch (state.phase) {
                case 'splash':
                    this.engine.goToSetup();
                    break;
                case 'setup':
                    await this.showDeviceSelection();
                    break;
                case 'simulation':
                    await this.runSimulation();
                    break;
                case 'crisis':
                    await this.showCrisis();
                    break;
                case 'autopsy':
                    await this.showAutopsy();
                    // Return to splash instead of exiting
                    this.engine.reset();
                    break;
                case 'victory':
                    await this.showVictory();
                    // Return to splash instead of exiting
                    this.engine.reset();
                    break;
            }
        }
    }

    private async showDeviceSelection(): Promise<void> {
        const t = i18next.t.bind(i18next);
        this.clearScreen();

        console.log(
            '\n  ' +
                color(t('setup.chooseDevice'), colors.green, colors.bright, colors.white) +
                '\n'
        );

        this.devices.forEach((device, index) => {
            const diffKey = `common.${device.difficulty}`;
            const difficultyColor =
                device.difficulty === 'easy'
                    ? colors.green
                    : device.difficulty === 'medium'
                      ? colors.yellow
                      : colors.red;

            const name = i18next.t(`content:${device.id}.name`) || device.name;
            const desc = i18next.t(`content:${device.id}.description`) || device.description;

            console.log(color(`  [${index + 1}] ${name}`, colors.bright));
            console.log(color(`      ${desc}`, colors.dim));
            console.log(
                `      ${t('common.difficulty')}: ${color(t(diffKey).toUpperCase(), difficultyColor)}`
            );
            console.log(
                `      ${t('setup.initialBudget')}: ${color(formatBudget(device.initialBudget), colors.green)}`
            );
            console.log(
                `      Tags: ${device.initialTags.map(t => color('#' + t, colors.magenta)).join(' ')}`
            );
            console.log('');
        });

        const choice = await this.prompt(
            `${t('common.selectDevice')} (1-${this.devices.length}): `
        );
        const index = parseInt(choice) - 1;

        if (index >= 0 && index < this.devices.length) {
            this.engine.selectDevice(this.devices[index].id);
            this.engine.startSimulation();
        }
    }

    private async runSimulation(): Promise<void> {
        const t = i18next.t.bind(i18next);
        this.clearScreen();
        this.showGameStatus();

        console.log('\n  ' + color(t('simulation.releaseManagement'), colors.cyan, colors.bright));
        const shipLabel = t('simulation.deployUpdate');
        const waitLabel = t('common.continue');
        const stratLabel = t('simulation.engineeringStrategy');

        const state = this.engine.getState();
        const canShip = state.doomLevel < 50;

        console.log(`    [ENTER] ${waitLabel} (4 ${t('common.months')})`);
        if (canShip) {
            console.log(`    [S]     ${shipLabel} (+12K, +15 ${t('common.doom')})`);
        } else {
            console.log(
                `    [S]     ${color(t('simulation.qaFailed'), colors.red)} (${t('simulation.stabilityWarning')})`
            );
        }
        console.log(`    [1/2/3] ${stratLabel}`);
        console.log('');

        const action = await this.prompt(`${t('common.strategy')}/${t('common.start')}: `);

        if (action.toLowerCase() === 's' && canShip) {
            console.log(color('\n  ' + t('simulation.shipFirmware'), colors.yellow));
            this.engine.dispatch({ type: 'SHIP_PRODUCT' });
            await this.sleep(1000);
        } else if (action === '1') {
            this.engine.setFundingLevel('full');
        } else if (action === '2') {
            this.engine.setFundingLevel('partial');
        } else if (action === '3') {
            this.engine.setFundingLevel('none');
        } else if (action === '') {
            console.log(color('\n  ' + t('common.continue') + '...', colors.dim));
            await this.sleep(this.gameSpeed * 1000);
            this.engine.advanceTime(4);
        }
    }

    private showGameStatus(): void {
        const t = i18next.t.bind(i18next);
        const state = this.engine.getState();
        const device = state.selectedDevice;
        const deviceName = i18next.t(`content:${device?.id}.name`) || device?.name || 'Unknown';

        const header = `${deviceName} - Year ${Math.floor(state.timelineMonth / 12) + 1}`;

        // Progress bars
        const drawBar = (
            val: number,
            max: number,
            width: number,
            char: string,
            activeColor: string
        ) => {
            const filled = Math.max(0, Math.min(width, Math.floor((val / max) * width)));
            return (
                color(char.repeat(filled), activeColor) +
                color('░'.repeat(width - filled), colors.gray)
            );
        };

        const timelineBar = drawBar(state.timelineMonth, 60, 40, '█', colors.blue);
        const doomColor =
            state.doomLevel < 30 ? colors.green : state.doomLevel < 60 ? colors.yellow : colors.red;
        const doomBar = drawBar(state.doomLevel, 100, 40, '█', doomColor);

        const statusLines = [
            `${t('common.month')}:  ${timelineBar} ${formatGameDate(state.timelineMonth)}`,
            `${t('common.doom')}:   ${doomBar} ${state.doomLevel}%`,
            `${t('common.budget')}: ${color(formatBudget(state.budget), state.budget > 20000 ? colors.green : colors.red)}`,
            '',
            `${t('common.strategy')}: ${color(t(`strategies.${state.fundingLevel}.label`), colors.bright, colors.cyan)}`,
            `${color(t(`strategies.${state.fundingLevel}.desc`), colors.dim)}`,
            '',
            color(t('simulation.systemArchitecture'), colors.white, colors.bright),
            ...this.getArchitectureStatus()
        ];

        this.drawBox(statusLines, colors.cyan, header);

        if (state.history.length > 0) {
            console.log('\n  ' + color(t('simulation.systemLogs'), colors.dim, colors.bright));
            state.history.slice(-3).forEach(entry => {
                const title = i18next.t(`content:${entry.eventId}.title`);
                console.log(color(`    - ${title}`, colors.dim));
            });
        }
    }

    private getArchitectureStatus(): string[] {
        const state = this.engine.getState();
        const t = i18next.t.bind(i18next);

        // Match nodes from SystemArchitecture.tsx
        const nodes = [
            {
                label: 'Cloud',
                tags: [
                    'cloud_dependency',
                    'gdpr_violation',
                    'server_crash',
                    'privacy_risk',
                    'ai_gap_data_sheet_missing'
                ]
            },
            { label: 'Network', tags: ['cheap_wifi', 'no_encryption', 'default_password'] },
            {
                label: 'Silicon',
                tags: ['cheapest_mcu', 'cloned', 'tech_debt', 'ai_gap_transparency_missing']
            },
            { label: 'Storage', tags: ['bad_flash', 'data_loss', 'unencrypted_fs'] },
            {
                label: 'Safety',
                tags: ['thermal_issues', 'cheap_battery', 'battery_risk', 'children_safety']
            },
            {
                label: 'Security',
                tags: [
                    'critical_vuln',
                    'expired_cert',
                    'root_shell',
                    'regulatory_risk',
                    'legal_liability'
                ]
            }
        ];

        return nodes.map(n => {
            const isCritical = n.tags.some(tag => state.activeTags.includes(tag));
            const status = isCritical
                ? color(t('simulation.warning'), colors.red, colors.bright)
                : color(t('simulation.nominal'), colors.green);
            return `    ${n.label.padEnd(10)} [ ${status} ]`;
        });
    }

    private async showCrisis(): Promise<void> {
        const t = i18next.t.bind(i18next);
        const state = this.engine.getState();
        const crisis = state.currentCrisis;
        if (!crisis) return;

        const title = i18next.t(`content:${crisis.id}.title`);
        const desc = i18next.t(`content:${crisis.id}.description`);

        this.clearScreen();
        console.log('\n');
        this.drawBox(
            ['', color('  ⚠  ' + t('crisis.title') + '  ⚠  ', colors.red, colors.bright), ''],
            colors.red
        );

        console.log(`\n  ${color(title, colors.yellow, colors.bright)}`);
        console.log(`\n  ${desc}\n`);

        console.log('  ' + BOX_CHARS.h.repeat(60) + '\n');

        crisis.choices.forEach((choice, index) => {
            const riskColor =
                choice.riskLevel === 'low'
                    ? colors.green
                    : choice.riskLevel === 'medium'
                      ? colors.yellow
                      : colors.red;

            const choiceText = i18next.t(`content:${crisis.id}.choices.${choice.id}`);

            console.log(color(`  [${index + 1}] ${choiceText}`, colors.bright));
            console.log(
                `      ${t('crisis.cost')}: ${color(formatCost(choice.cost), colors.red)}  Risk: ${color(choice.riskLevel.toUpperCase(), riskColor)}`
            );
            console.log('');
        });

        const choiceStr = await this.prompt(
            `${t('crisis.chooseAction')} (1-${crisis.choices.length}): `
        );
        const index = parseInt(choiceStr) - 1;

        if (index >= 0 && index < crisis.choices.length) {
            this.engine.resolveCrisis(crisis.choices[index].id);
        }
    }

    private async showAutopsy(): Promise<void> {
        const t = i18next.t.bind(i18next);
        const state = this.engine.getState();

        this.clearScreen();
        console.log('\n');
        this.drawBox(
            [
                '',
                color(t('autopsy.title'), colors.red, colors.bright),
                color(t('autopsy.gameOver').toUpperCase(), colors.red, colors.bright),
                ''
            ],
            colors.red
        );

        console.log(
            `\n  ${t('autopsy.causeOfDeath')}: ${color(state.deathAnalysis?.cause || 'Unknown', colors.red)}`
        );
        console.log(`  ${t('common.budget')}: ${formatBudget(state.budget)}`);
        console.log(`  ${t('common.months')}: ${state.timelineMonth}`);

        console.log('\n  ' + color(t('victory.shareResult'), colors.yellow));
        this.printShareResult();

        console.log('\n  ' + color(t('autopsy.tryAgain'), colors.cyan));
        await this.waitForEnter();
    }

    private async showVictory(): Promise<void> {
        const t = i18next.t.bind(i18next);
        const state = this.engine.getState();

        this.clearScreen();
        console.log('\n');
        this.drawBox(
            [
                '',
                color(t('victory.title'), colors.green, colors.bright),
                color(t('victory.survived').toUpperCase(), colors.green, colors.bright),
                ''
            ],
            colors.green
        );

        console.log(`\n  ${t('common.budget')}: ${formatBudget(state.budget)}`);
        console.log(`  ${t('common.doom')}: ${state.doomLevel}%`);

        console.log('\n  ' + color(t('victory.shareResult'), colors.yellow));
        this.printShareResult();

        console.log('\n  ' + color(t('victory.playAgain'), colors.cyan));
        await this.waitForEnter();
    }

    private printShareResult(): void {
        const payload = this.engine.getSharePayload();
        const shareText = `📉 Device Prophet Labs: ${payload.result === 'win' ? 'SURVIVED' : 'RECALLED'}
🚀 Device: ${payload.deviceId}
📅 Lifetime: ${payload.finalMonth} months
💀 Doom: ${payload.doomLevel}%
#${SHARE.HASHTAGS.join(' #')}`;

        this.drawBox(shareText.split('\n'), colors.gray);
    }

    private prompt(question: string): Promise<string> {
        return new Promise(resolve => {
            this.rl.question(color(question, colors.cyan), answer => resolve(answer.trim()));
        });
    }

    private waitForEnter(): Promise<void> {
        return new Promise(resolve => this.rl.question('', () => resolve()));
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    close(): void {
        this.rl.close();
    }
}
