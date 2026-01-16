import { test, expect } from '@playwright/test';

test.describe('Game Save/Load Flow', () => {
    test.beforeEach(async ({ page }) => {
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
        await page.goto('./');
    });

    test('should save game, reload page, and continue successfully', async ({ page }) => {
        // 1. Start a new game
        await page.getByTestId('splash-title').waitFor();
        await page.waitForTimeout(500); // Wait for animations
        await page.getByTestId('start-sim-btn').evaluate(btn => (btn as HTMLElement).click());

        // Select device (Omni-Juice) using data-qa attribute
        await page.getByText(/Choose Your Device/i).waitFor();
        const deviceCard = page.locator('[data-qa="device-card-omni-juice"]');
        await deviceCard.waitFor();
        await deviceCard.evaluate(btn => (btn as HTMLElement).click());

        // Device card click auto-starts simulation
        // await page.getByRole('button', { name: /Start Simulation/i }).click();

        // Wait for simulation to start
        await page.getByTestId('simulation-view').waitFor();

        // 2. Play for a bit (verify time advances)
        await expect(async () => {
            const timeDisplay = page.getByTestId('timeline-display');
            await expect(timeDisplay).not.toHaveText('0 mo 0 d');
        }).toPass({ timeout: 10000 });

        // 3. Exit to Menu (saves and resets phase)
        await page.getByTestId('exit-menu-btn').evaluate(btn => (btn as HTMLElement).click());

        // 4. Verification on Splash Screen
        await page.getByTestId('splash-title').waitFor();

        // "Continue" button should be visible
        const continueBtn = page.getByRole('button', { name: /Continue/i });
        await expect(continueBtn).toBeVisible();

        // 5. Click Continue
        await continueBtn.evaluate(btn => (btn as HTMLElement).click());

        // 6. Verify we are back in simulation
        await page.getByTestId('simulation-view').waitFor();

        // 7. Verify game is running (time advances)
        // Capture current time string
        const timeElement = page.getByTestId('timeline-display');
        const initialTimeText = await timeElement.textContent();

        // Wait 2 seconds
        await page.waitForTimeout(2000);

        const newTimeText = await timeElement.textContent();
        expect(newTimeText).not.toBe(initialTimeText);

        // 8. Test the "Deploy OTA" button functionality
        // It might be disabled if doom is high, but initially doom is low.
        const deployBtn = page.getByTestId('ship-btn');
        await expect(deployBtn).toBeVisible();

        // Check if enabled
        if (await deployBtn.isEnabled()) {
            const budgetDisplay = page.getByTestId('budget-display');
            const initialBudget = await budgetDisplay.textContent();

            await deployBtn.evaluate(btn => (btn as HTMLElement).click());

            // Allow time for action to process (it adds 1 month instantly)
            await page.waitForTimeout(500);

            const newBudget = await budgetDisplay.textContent();
            expect(newBudget).not.toBe(initialBudget);
        }
    });
});
