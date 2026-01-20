import { test, expect } from '@playwright/test';

test.describe('Device Selection Persistence', () => {
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
        });
        await page.goto('./');
    });

    test('should stick to the last played device', async ({ page }) => {
        // 1. Initial Load - Default state
        await page.goto('./');

        // Wait for setup view
        // We expect the button to be there on initial load
        const getStartedBtn = page.getByTestId('start-sim-btn');
        await getStartedBtn.click();

        // Verify "Omni-Juice 4000" is in the first slot (default)
        // We select by the reliable data-testid="device-card" and check the first one
        const firstCard = page.getByTestId('device-card').first();
        await expect(firstCard).toContainText('Omni-Juice 4000');

        // 2. Play with a SPECIFIC device (Sentinel X100) to be deterministic
        const targetDeviceName = 'Sentinel X100';
        const otherCard = page.getByText(targetDeviceName);

        console.log(`Selecting device: ${targetDeviceName}`);
        await otherCard.click();

        // Ensure we entered the game (Simulation View)
        await expect(page.getByTestId('simulation-view')).toBeVisible();

        // Small buffer to ensure storage persist
        await page.waitForTimeout(500);

        // 3. Reload Page to simulate returning user
        await page.reload();

        // Go to Setup again (simulating fresh entry)
        const getStartedBtn2 = page.getByTestId('start-sim-btn');
        await getStartedBtn2.click();

        // 4. Verify the PREVIOUSLY SELECTED device is now in the first slot
        const newFirstCard = page.getByTestId('device-card').first();
        await expect(newFirstCard).toContainText(targetDeviceName);
    });
});
