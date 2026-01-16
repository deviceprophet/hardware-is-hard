import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (a11y)', () => {
    test('should not have any automatically detectable accessibility issues', async ({ page }) => {
        // Disable tutorials
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
        await page.goto('./');

        // 1. Splash Screen
        await expect(page.getByTestId('splash-title')).toBeVisible();

        const splashResults = await new AxeBuilder({ page }).analyze();
        expect(splashResults.violations).toEqual([]);

        // Dismiss tutorial to proceed to other views
        if (await page.getByTestId('tutorial-got-it').isVisible()) {
            await page.getByTestId('tutorial-got-it').click();
        }

        // 2. Setup Screen (Click "INITIALIZE SIMULATION")
        await page.getByTestId('start-sim-btn').click();
        await expect(page.getByTestId('setup-view-title')).toBeVisible();

        const setupResults = await new AxeBuilder({ page }).analyze();
        expect(setupResults.violations).toEqual([]);

        // 3. Simulation View (Select a device)
        // Click the first device card
        await page.locator('[data-testid="device-card"]').first().click();

        // Wait for simulation view to load
        await expect(page.getByTestId('compliance-display')).toBeVisible();

        const simResults = await new AxeBuilder({ page }).analyze();
        expect(simResults.violations).toEqual([]);
    });
});
