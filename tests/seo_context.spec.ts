import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * SEO Context Generator E2E Test
 *
 * This test navigates through all game states and generates a comprehensive
 * markdown file containing:
 * - All meta headers (title, description, OG tags, Twitter cards, etc.)
 * - Visible text content from each game state
 * - Screenshots of each state
 * - Structured data and accessibility info
 *
 * The output can be fed to an LLM for SEO analysis and recommendations.
 */

// Output directory for the context file and screenshots
const OUTPUT_DIR = path.join(process.cwd(), 'test-results', 'seo-context');

interface MetaInfo {
    title: string;
    description: string;
    charset: string;
    viewport: string;
    generator: string;
    canonical?: string;
    ogTags: Record<string, string>;
    twitterTags: Record<string, string>;
    otherMeta: Record<string, string>;
    links: { rel: string; href: string; type?: string }[];
    structuredData: object[];
}

interface PageState {
    name: string;
    url: string;
    screenshotPath: string;
    visibleText: string;
    headings: { level: number; text: string }[];
    buttons: string[];
    links: { text: string; href: string }[];
    ariaLabels: string[];
    landmarks: string[];
}

async function extractMetaInfo(page: Page): Promise<MetaInfo> {
    return await page.evaluate(() => {
        const getMeta = (name: string, attr: string = 'name'): string => {
            const el = document.querySelector(`meta[${attr}="${name}"]`);
            return el?.getAttribute('content') || '';
        };

        // Collect OG tags
        const ogTags: Record<string, string> = {};
        document.querySelectorAll('meta[property^="og:"]').forEach(el => {
            const property = el.getAttribute('property') || '';
            ogTags[property] = el.getAttribute('content') || '';
        });

        // Collect Twitter tags
        const twitterTags: Record<string, string> = {};
        document.querySelectorAll('meta[name^="twitter:"]').forEach(el => {
            const name = el.getAttribute('name') || '';
            twitterTags[name] = el.getAttribute('content') || '';
        });

        // Collect other meta tags
        const otherMeta: Record<string, string> = {};
        document.querySelectorAll('meta[name]').forEach(el => {
            const name = el.getAttribute('name') || '';
            if (
                !name.startsWith('twitter:') &&
                name !== 'description' &&
                name !== 'viewport' &&
                name !== 'generator'
            ) {
                otherMeta[name] = el.getAttribute('content') || '';
            }
        });

        // Collect link tags
        const links: { rel: string; href: string; type?: string }[] = [];
        document.querySelectorAll('link[rel]').forEach(el => {
            links.push({
                rel: el.getAttribute('rel') || '',
                href: el.getAttribute('href') || '',
                type: el.getAttribute('type') || undefined
            });
        });

        // Collect structured data (JSON-LD)
        const structuredData: object[] = [];
        document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
            try {
                structuredData.push(JSON.parse(el.textContent || '{}'));
            } catch {
                // Ignore parse errors
            }
        });

        // Get canonical URL
        const canonicalEl = document.querySelector('link[rel="canonical"]');
        const canonical = canonicalEl?.getAttribute('href') || undefined;

        return {
            title: document.title,
            description: getMeta('description'),
            charset: document.characterSet,
            viewport: getMeta('viewport'),
            generator: getMeta('generator'),
            canonical,
            ogTags,
            twitterTags,
            otherMeta,
            links,
            structuredData
        };
    });
}

async function extractPageState(page: Page, stateName: string): Promise<PageState> {
    // Take screenshot
    const screenshotFilename = `${stateName.toLowerCase().replace(/\s+/g, '-')}.png`;
    const screenshotPath = path.join(OUTPUT_DIR, screenshotFilename);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Extract page content
    const pageData = await page.evaluate(() => {
        // Get all visible text (excluding scripts and styles)
        const getVisibleText = (): string => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
                acceptNode: node => {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    const tag = parent.tagName.toLowerCase();
                    if (tag === 'script' || tag === 'style' || tag === 'noscript') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Check if element is visible
                    const style = window.getComputedStyle(parent);
                    if (style.display === 'none' || style.visibility === 'hidden') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    const text = node.textContent?.trim();
                    if (!text) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            });

            const texts: string[] = [];
            let node: Node | null;
            while ((node = walker.nextNode())) {
                const text = node.textContent?.trim();
                if (text) texts.push(text);
            }
            return Array.from(new Set(texts)).join('\n');
        };

        // Get headings
        const headings: { level: number; text: string }[] = [];
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
            const text = el.textContent?.trim();
            if (text) {
                headings.push({
                    level: parseInt(el.tagName[1]),
                    text
                });
            }
        });

        // Get buttons
        const buttons: string[] = [];
        document.querySelectorAll('button, [role="button"]').forEach(el => {
            const text =
                el.textContent?.trim() ||
                el.getAttribute('aria-label') ||
                el.getAttribute('title') ||
                '';
            if (text) buttons.push(text);
        });

        // Get links
        const links: { text: string; href: string }[] = [];
        document.querySelectorAll('a[href]').forEach(el => {
            links.push({
                text: el.textContent?.trim() || el.getAttribute('aria-label') || '',
                href: el.getAttribute('href') || ''
            });
        });

        // Get aria labels
        const ariaLabels: string[] = [];
        document.querySelectorAll('[aria-label]').forEach(el => {
            const label = el.getAttribute('aria-label');
            if (label) ariaLabels.push(label);
        });

        // Get landmarks
        const landmarks: string[] = [];
        const landmarkRoles = [
            'banner',
            'navigation',
            'main',
            'complementary',
            'contentinfo',
            'search',
            'form',
            'region'
        ];
        landmarkRoles.forEach(role => {
            const roleToTag: Record<string, string> = {
                banner: 'header',
                contentinfo: 'footer',
                navigation: 'nav',
                main: 'main',
                complementary: 'aside'
            };
            const tag = roleToTag[role];
            const selector = tag ? `[role="${role}"], ${tag}` : `[role="${role}"]`;
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) landmarks.push(role);
        });

        return {
            visibleText: getVisibleText(),
            headings,
            buttons,
            links,
            ariaLabels,
            landmarks
        };
    });

    return {
        name: stateName,
        url: page.url(),
        screenshotPath: screenshotFilename,
        ...pageData
    };
}

function generateMarkdown(metaInfo: MetaInfo, states: PageState[], timestamp: string): string {
    let md = `# SEO Context Report - Hardware is Hard

> Generated: ${timestamp}
> URL: ${states[0]?.url || 'N/A'}

This document contains comprehensive SEO-related information extracted from the "Hardware is Hard" game website.
Use this context to analyze and provide SEO recommendations.

---

## Meta Information

### Basic Meta Tags

| Tag | Value |
|-----|-------|
| **Title** | ${metaInfo.title} |
| **Description** | ${metaInfo.description} |
| **Charset** | ${metaInfo.charset} |
| **Viewport** | ${metaInfo.viewport} |
| **Generator** | ${metaInfo.generator} |
${metaInfo.canonical ? `| **Canonical** | ${metaInfo.canonical} |` : ''}

### Open Graph Tags

| Property | Value |
|----------|-------|
${Object.entries(metaInfo.ogTags)
    .map(([k, v]) => `| ${k} | ${v} |`)
    .join('\n')}

### Twitter Card Tags

| Name | Value |
|------|-------|
${Object.entries(metaInfo.twitterTags)
    .map(([k, v]) => `| ${k} | ${v} |`)
    .join('\n')}

${
    Object.keys(metaInfo.otherMeta).length > 0
        ? `
### Other Meta Tags

| Name | Value |
|------|-------|
${Object.entries(metaInfo.otherMeta)
    .map(([k, v]) => `| ${k} | ${v} |`)
    .join('\n')}
`
        : ''
}

### Link Tags

| Rel | Href | Type |
|-----|------|------|
${metaInfo.links.map(l => `| ${l.rel} | ${l.href} | ${l.type || 'N/A'} |`).join('\n')}

${
    metaInfo.structuredData.length > 0
        ? `
### Structured Data (JSON-LD)

\`\`\`json
${JSON.stringify(metaInfo.structuredData, null, 2)}
\`\`\`
`
        : ''
}

---

## Page States & Content

The game has multiple states/views. Here's the content extracted from each:

`;

    for (const state of states) {
        md += `
### ${state.name}

**Screenshot:** \`${state.screenshotPath}\`

#### Heading Structure

${state.headings.length > 0 ? state.headings.map(h => `${'  '.repeat(h.level - 1)}- **H${h.level}:** ${h.text}`).join('\n') : '_No headings found_'}

#### Interactive Elements

**Buttons (${state.buttons.length}):**
${state.buttons.length > 0 ? state.buttons.map(b => `- ${b}`).join('\n') : '_None_'}

**Links (${state.links.length}):**
${state.links.length > 0 ? state.links.map(l => `- [${l.text || 'No text'}](${l.href})`).join('\n') : '_None_'}

#### Accessibility

**ARIA Labels:**
${state.ariaLabels.length > 0 ? state.ariaLabels.map(l => `- ${l}`).join('\n') : '_None found_'}

**Landmarks:**
${state.landmarks.length > 0 ? state.landmarks.map(l => `- ${l}`).join('\n') : '_None found_'}

#### Visible Text Content

\`\`\`
${state.visibleText.substring(0, 3000)}${state.visibleText.length > 3000 ? '\n\n[... truncated for brevity ...]' : ''}
\`\`\`

---
`;
    }

    md += `
## Analysis Prompts

Here are some questions to consider for SEO analysis:

1. **Title & Description**: Is the title compelling and within optimal length (50-60 chars)? Is the description engaging and within 150-160 chars?

2. **Open Graph & Twitter Cards**: Are all required OG tags present? Is the image optimized for social sharing?

3. **Heading Structure**: Is there proper H1-H6 hierarchy? Are headings descriptive and keyword-rich?

4. **Accessibility**: Are there sufficient ARIA labels? Are landmarks properly used?

5. **Content**: Is the visible text content keyword-optimized? Are there opportunities for additional SEO-relevant content?

6. **Technical SEO**: Is there a canonical URL? Are there any missing meta tags?

7. **Mobile**: Is the viewport configured correctly? Does the content work well on mobile?

8. **Structured Data**: Would JSON-LD structured data benefit this page (e.g., SoftwareApplication, Game)?

---

## Raw Data Export

The following files were generated:

${states.map(s => `- \`${s.screenshotPath}\` - Screenshot of ${s.name}`).join('\n')}
- \`seo-context.md\` - This report
- \`seo-context.json\` - Raw JSON data for programmatic analysis
`;

    return md;
}

test.describe('SEO Context Generator', () => {
    test.beforeEach(async ({ page }) => {
        // Clear local storage and disable tutorial
        await page.addInitScript(() => {
            localStorage.clear();
            localStorage.setItem(
                'hardware_tutorial_completed',
                JSON.stringify({
                    completed: [
                        'welcome',
                        'setup_device',
                        'setup_budget',
                        'sim_doom',
                        'sim_ship',
                        'sim_events'
                    ],
                    skipped: true
                })
            );

            // Remove Astro toolbar
            const observer = new MutationObserver(() => {
                const toolbar = document.querySelector('astro-dev-toolbar');
                if (toolbar) toolbar.remove();
            });
            observer.observe(document, { childList: true, subtree: true });
        });

        // Disable animations for cleaner screenshots
        await page.addStyleTag({
            content:
                '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }'
        });
    });

    test('Generate LLM context file for SEO analysis', async ({ page }) => {
        // Create output directory
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        const states: PageState[] = [];
        const timestamp = new Date().toISOString();

        // Navigate to the page
        await page.goto('./', { waitUntil: 'networkidle' });

        // Wait for React hydration
        await expect(page.getByTestId('splash-title')).toBeVisible({ timeout: 10000 });

        // Extract meta information (only need to do this once)
        const metaInfo = await extractMetaInfo(page);

        // STATE 1: Splash Screen
        await page.waitForTimeout(500); // Let animations settle
        states.push(await extractPageState(page, 'Splash Screen'));

        // STATE 2: Setup Screen
        await page.getByTestId('start-sim-btn').click({ force: true });
        await expect(
            page.getByTestId('setup-view-title').or(page.getByText('Choose Your Device'))
        ).toBeVisible();
        await page.waitForTimeout(500);
        states.push(await extractPageState(page, 'Setup Screen - Device Selection'));

        // STATE 3: Simulation View
        const deviceCard = page.getByTestId('device-card').first();
        await expect(deviceCard).toBeVisible();
        await deviceCard.click({ force: true });
        await expect(page.getByTestId('doom-meter')).toBeVisible();
        await page.waitForTimeout(500);
        states.push(await extractPageState(page, 'Simulation View - Active Game'));

        // STATE 4: Advance time a bit to show more game content
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);

        // Handle any crisis modal
        const crisisModal = page.locator('[role="dialog"]');
        if (await crisisModal.isVisible().catch(() => false)) {
            states.push(await extractPageState(page, 'Crisis Event Modal'));
            const choiceBtn = crisisModal.locator('button').first();
            if (await choiceBtn.isVisible()) {
                await choiceBtn.click({ force: true });
                await page.waitForTimeout(300);
            }
        }

        // STATE 5: After some gameplay (more log entries)
        states.push(await extractPageState(page, 'Simulation View - Mid Game'));

        // STATE 6: Try to trigger Victory (inject save state near victory)
        await page.evaluate(() => {
            const mockSave = {
                version: 1,
                savedAt: new Date().toISOString(),
                state: {
                    phase: 'simulation',
                    timelineMonth: 58,
                    budget: 50000,
                    doomLevel: 20,
                    complianceLevel: 80,
                    fundingLevel: 'partial',
                    selectedDevice: {
                        id: 'omni-juice',
                        name: 'Omni-Juice 4000',
                        initialBudget: 80000,
                        monthlyMaintenanceCost: 3500,
                        eolMonth: 54
                    },
                    activeTags: [],
                    history: [],
                    shieldDeflections: []
                }
            };
            localStorage.setItem('hardware_is_hard_save', JSON.stringify(mockSave));
        });

        // Reload and continue to victory
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const continueBtn = page.getByTestId('continue-btn');
        if (await continueBtn.isVisible().catch(() => false)) {
            await continueBtn.click({ force: true });
            await page.waitForTimeout(500);

            // Try to advance to victory
            for (let i = 0; i < 3; i++) {
                await page.keyboard.press('Space');
                await page.waitForTimeout(300);

                // Handle crisis
                if (await crisisModal.isVisible().catch(() => false)) {
                    const btn = crisisModal.locator('button').last();
                    if (await btn.isVisible()) {
                        await btn.click({ force: true });
                        await page.waitForTimeout(200);
                    }
                }

                // Check for victory
                const victoryView = page.getByTestId('victory-view');
                if (await victoryView.isVisible().catch(() => false)) {
                    states.push(await extractPageState(page, 'Victory Screen'));
                    break;
                }
            }
        }

        // STATE 7: Try Autopsy screen (game over)
        await page.goto('./', { waitUntil: 'networkidle' });
        await page.evaluate(() => {
            localStorage.removeItem('hardware_is_hard_save');
        });
        await page.reload({ waitUntil: 'networkidle' });
        await expect(page.getByTestId('splash-title')).toBeVisible();
        await page.getByTestId('start-sim-btn').click({ force: true });
        await expect(
            page.getByTestId('setup-view-title').or(page.getByText('Choose Your Device'))
        ).toBeVisible();
        await page.getByTestId('device-card').first().click({ force: true });
        await expect(page.getByTestId('doom-meter')).toBeVisible();

        // Quickly increase doom
        const shipBtn = page.getByTestId('ship-btn');
        for (let i = 0; i < 4; i++) {
            if (await shipBtn.isEnabled()) {
                await shipBtn.click({ force: true });
                await page.waitForTimeout(200);
            }
        }

        // Advance time to trigger doom events
        for (let i = 0; i < 25; i++) {
            await page.keyboard.press('Space');
            await page.waitForTimeout(80);

            // Handle crisis with risky choices to increase doom
            if (await crisisModal.isVisible().catch(() => false)) {
                const btn = crisisModal.locator('button').first();
                if (await btn.isVisible()) {
                    await btn.click({ force: true });
                    await page.waitForTimeout(150);
                }
            }

            // Check for autopsy
            const autopsyView = page.getByTestId('autopsy-view');
            if (await autopsyView.isVisible().catch(() => false)) {
                states.push(await extractPageState(page, 'Autopsy Screen - Game Over'));
                break;
            }
        }

        // Generate the markdown report
        const markdown = generateMarkdown(metaInfo, states, timestamp);

        // Write markdown file
        const mdPath = path.join(OUTPUT_DIR, 'seo-context.md');
        fs.writeFileSync(mdPath, markdown, 'utf-8');

        // Write JSON file for programmatic access
        const jsonPath = path.join(OUTPUT_DIR, 'seo-context.json');
        fs.writeFileSync(
            jsonPath,
            JSON.stringify({ metaInfo, states, timestamp }, null, 2),
            'utf-8'
        );

        // Log output location
        console.log(`\n${'='.repeat(60)}`);
        console.log('SEO Context files generated:');
        console.log(`  - ${mdPath}`);
        console.log(`  - ${jsonPath}`);
        console.log(`  - ${states.length} screenshots in ${OUTPUT_DIR}`);
        console.log(`${'='.repeat(60)}\n`);

        // Verify files were created
        expect(fs.existsSync(mdPath)).toBe(true);
        expect(fs.existsSync(jsonPath)).toBe(true);
        expect(states.length).toBeGreaterThan(3); // Should have at least 4 states

        // Basic meta info assertions
        expect(metaInfo.title).toBeTruthy();
        expect(metaInfo.description).toBeTruthy();
        expect(Object.keys(metaInfo.ogTags).length).toBeGreaterThan(0);
        expect(Object.keys(metaInfo.twitterTags).length).toBeGreaterThan(0);
    });

    test('Generate Spanish localization context', async ({ page }) => {
        // Create output directory
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        const states: PageState[] = [];
        const timestamp = new Date().toISOString();

        await page.goto('./', { waitUntil: 'networkidle' });
        await expect(page.getByTestId('splash-title')).toBeVisible({ timeout: 10000 });

        // Switch to Spanish
        const langBtn = page.getByTestId('language-selector');
        await langBtn.click({ force: true });
        await expect(langBtn).toContainText('ES');
        await page.waitForTimeout(500);

        // Capture Spanish Splash
        states.push(await extractPageState(page, 'Splash Screen - Spanish'));

        // Setup in Spanish
        await page.getByTestId('start-sim-btn').click({ force: true });
        await expect(page.getByTestId('setup-view-title')).toBeVisible();
        await page.waitForTimeout(500);
        states.push(await extractPageState(page, 'Setup Screen - Spanish'));

        // Simulation in Spanish
        await page.getByTestId('device-card').first().click({ force: true });
        await expect(page.getByTestId('doom-meter')).toBeVisible();
        await page.waitForTimeout(500);
        states.push(await extractPageState(page, 'Simulation View - Spanish'));

        // Write Spanish context
        const metaInfo = await extractMetaInfo(page);
        const markdown = generateMarkdown(metaInfo, states, timestamp);

        const mdPath = path.join(OUTPUT_DIR, 'seo-context-spanish.md');
        fs.writeFileSync(
            mdPath,
            markdown.replace('SEO Context Report', 'SEO Context Report (Spanish Localization)'),
            'utf-8'
        );

        const jsonPath = path.join(OUTPUT_DIR, 'seo-context-spanish.json');
        fs.writeFileSync(
            jsonPath,
            JSON.stringify({ metaInfo, states, timestamp, locale: 'es' }, null, 2),
            'utf-8'
        );

        console.log(`\n${'='.repeat(60)}`);
        console.log('Spanish SEO Context files generated:');
        console.log(`  - ${mdPath}`);
        console.log(`  - ${jsonPath}`);
        console.log(`${'='.repeat(60)}\n`);

        expect(fs.existsSync(mdPath)).toBe(true);
        expect(states.length).toBeGreaterThan(2);
    });
});
