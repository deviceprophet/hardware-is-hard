import { test, expect, type Page } from '@playwright/test';

test.describe('Doom Level Persistence Regression', () => {
    test.beforeEach(async ({ page }) => {
        // Clear local storage ONCE at the start of the test across all navigations
        await page.goto('./');
        await page.evaluate(() => localStorage.clear());

        // Disable tutorial
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

            // Aggressively remove Astro toolbar immediately on document availability
            const observer = new MutationObserver(() => {
                const toolbar = document.querySelector('astro-dev-toolbar');
                if (toolbar) toolbar.remove();
            });
            observer.observe(document, { childList: true, subtree: true });

            // Try removing immediately in case it exists already
            const existing = document.querySelector('astro-dev-toolbar');
            if (existing) existing.remove();
        });

        // Disable animations
        await page.addStyleTag({
            content:
                '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }'
        });

        await page.goto('./', { waitUntil: 'domcontentloaded' });
    });

    const clearTutorials = async (page: Page) => {
        // Wait for potential tutorial trigger (app has 500ms delay) + buffer
        await page.waitForTimeout(1000);

        // Try to click "Skip Tutorial" first as it's more permanent
        const skipBtn = page.getByText('Skip Tutorial');
        if (await skipBtn.isVisible().catch(() => false)) {
            await skipBtn.click({ force: true }).catch(() => {});
            await page.waitForTimeout(500);
            return;
        }

        const btn = page.getByTestId('tutorial-got-it');

        // Wait for button to be visible (max 2 seconds)
        try {
            await btn.waitFor({ state: 'visible', timeout: 2000 });
        } catch {
            // No tutorial button visible, that's fine
            return;
        }

        // Click and verify it disappears
        await btn.click({ force: true }).catch(() => {});
    };

    test('should persist doom level after exiting to menu and continuing', async ({ page }) => {
        // 1. Start a new game
        await page.getByTestId('splash-title').waitFor();
        await page.getByTestId('start-sim-btn').click({ force: true });

        // 2 & 3. Setup Tutorials (Device & Budget)
        await clearTutorials(page);

        // Verify Setup View
        await expect(page.getByTestId('setup-view-title')).toBeVisible();

        // Verify Device Selection
        const deviceCard = page.getByTestId('device-card').first();
        await expect(deviceCard).toBeVisible();
        await deviceCard.click({ force: true });

        // --- SIMULATION PHASE ---
        // Clear Sim Tutorials (Doom, Revisions)
        await clearTutorials(page);

        // 3. Wait for simulation to start
        await expect(page.getByTestId('simulation-view')).toBeVisible({ timeout: 15000 });

        // 4. Verify initial doom is 0%
        const doomMeter = page.getByTestId('doom-meter');
        await expect(doomMeter).toContainText('0%');

        // 5. Increase doom level by shipping product
        const deployBtn = page.getByTestId('ship-btn');
        await expect(deployBtn).toBeVisible();
        await deployBtn.click({ force: true });

        // 6. Verify doom increased (should be 10%)
        // The display might take a moment to update due to animations
        await expect(doomMeter).toContainText('10%', { timeout: 10000 });
        const capturedDoom = await doomMeter.innerText();
        console.log(`Captured Doom Level: ${capturedDoom}`);

        // 7. Exit to Menu (saves game)
        await page.getByTestId('exit-menu-btn').click({ force: true });

        // 8. Verification on Splash Screen
        await page.getByTestId('splash-title').waitFor();
        const continueBtn = page.getByRole('button', { name: /Continue/i });
        await expect(continueBtn).toBeVisible();

        // 9. Click Continue
        await continueBtn.click({ force: true });

        // 10. Verify doom level is restored
        await expect(page.getByTestId('simulation-view')).toBeVisible({ timeout: 15000 });
        const restoredDoomMeter = page.getByTestId('doom-meter');
        await expect(restoredDoomMeter).toContainText('10%');

        const finalDoom = await restoredDoomMeter.innerText();
        expect(finalDoom).toBe(capturedDoom);

        // Verify history persisting logic by checking local storage again
        const historyAfter = await page.evaluate(() => localStorage.getItem('hardware_game_save'));
        expect(historyAfter).toBeTruthy();
        if (historyAfter) {
            const parsed = JSON.parse(historyAfter);

            // Verify structural integrity of specific fields
            expect(Array.isArray(parsed.state.history)).toBe(true);
            expect(Array.isArray(parsed.state.shieldDeflections)).toBe(true); // New fix verification

            // Verify content that we know exists (Initial tags from Omni-Juice)
            expect(parsed.state.activeTags.length).toBeGreaterThan(0);
            console.log('Active Tags persisted:', parsed.state.activeTags);
        }
    });
});
