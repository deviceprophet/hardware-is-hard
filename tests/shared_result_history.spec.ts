import { test, expect } from '@playwright/test';

test('shared result does not pollute history and allows starting new game', async ({ page }) => {
    // 1. Use a pre-generated compressed string for:
    // { v: 1, o: 'r', d: 'omni-juice', m: 36, b: 0, dm: 100, c: 50, l: 'en' }
    const compressed =
        'N4IgbiBcCMA0IHsogE4ngE2QgtgOwEsBaAKwFcCBjAU3RBygGYA2eAIygAZMGZPuQlKAFYBAG2TU8IAL5A';

    // 2. Clear storage to simulate clean state
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());

    // 3. Navigate to result URL
    await page.goto(`./?result=${compressed}`);

    // 4. Verify SharedResultView
    await expect(page.getByTestId('shared-result-view')).toBeVisible();
    await expect(page.getByText('MISSION FAILED')).toBeVisible();

    // 5. Verify History is Empty (Visual check in Splash logs impossible as we are not there)
    // We check localStorage directly
    const stats = await page.evaluate(() => localStorage.getItem('hw_is_hard_stats'));
    // It should be null or empty runHistory
    if (stats) {
        const parsed = JSON.parse(stats);
        expect(parsed.runHistory).toEqual([]);
    } else {
        expect(stats).toBeNull();
    }

    // 6. Click "Launch Simulation" (ACCEPT CHALLENGE)
    // This previously crashed because of VALID_TRANSITIONS missing shared_result
    await page.getByText('LAUNCH SIMULATION').click();

    // 7. Verify we are in Setup View
    await expect(page.getByTestId('setup-view')).toBeVisible();
});

test('tutorial toggle button works', async ({ page }) => {
    // 1. Start fresh
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 2. Tutorial should be active (Welcome step)
    const tutorialContent = page.getByTestId('tutorial-content');
    await expect(tutorialContent).toBeVisible();
    await expect(tutorialContent).toContainText('Your goal: Keep an IoT device alive');

    // 3. Click Skip
    await page.getByText('Skip Tutorial').click();
    await expect(tutorialContent).not.toBeVisible();

    // 4. Find Toggle Button (Top Right)
    // It should be inactive (Slate)
    const toggleBtn = page.getByTitle('Enable Tutorial');
    await expect(toggleBtn).toBeVisible();
    // Verify it's slate (inactive) - logic uses Ban/HelpCircle with text-slate-400
    // We can check class or just attribute.
    // Aria label changes: 'Enable Tutorial' vs 'Disable Tutorial'

    // 5. Click Toggle to Enable
    await toggleBtn.click();

    // 6. Verify Tutorial is back
    await expect(tutorialContent).toBeVisible();

    // 7. Verify Button state
    const disableBtn = page.getByTitle('Disable Tutorial');
    await expect(disableBtn).toBeVisible();
});
