import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Game Flow & Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER LOAD: ${msg.text()}`));
        // Disable tutorials via localStorage
        await page.addInitScript(() => {
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
        });
    });

    test('should load the splash screen and pass accessibility', async ({ page }) => {
        await page.goto('./');

        // Check title
        await expect(page.getByTestId('splash-title')).toBeVisible();

        // Check main button
        const startBtn = page.getByTestId('start-sim-btn');
        await expect(startBtn).toBeVisible();

        // Scan accessibility
        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should navigate to setup screen', async ({ page }) => {
        await page.goto('./');
        await page.goto('./');
        await page.getByTestId('start-sim-btn').click({ force: true });

        // Should be on setup view
        await expect(page.getByTestId('setup-view-title')).toBeVisible();

        // Check that we have devices
        const deviceCards = await page.getByTestId('device-card').all();
        expect(deviceCards.length).toBeGreaterThan(0);
    });

    test('should display simulation dashboard correctly', async ({ page }) => {
        await page.goto('./');
        await page.getByTestId('start-sim-btn').click();

        // Select first device
        await page.getByTestId('device-card').first().click({ force: true }); // Assuming click selects

        // Verify Strategy Panel
        await expect(page.getByTestId('strategy-panel')).toBeVisible();
        await expect(page.getByTestId('strategy-btn-full')).toBeVisible();
        await expect(page.getByTestId('compliance-display')).toBeVisible();
    });
});
