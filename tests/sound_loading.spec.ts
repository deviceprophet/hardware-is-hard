import { test, expect } from '@playwright/test';

test('sound files are loaded without errors', async ({ page }) => {
    const failedRequests: string[] = [];
    const soundRequests: string[] = [];
    const consoleErrors: string[] = [];

    // Monitor network requests
    page.on('request', request => {
        if (request.url().endsWith('.ogg') || request.url().endsWith('.mp3')) {
            soundRequests.push(request.url());
        }
    });

    page.on('response', response => {
        const url = response.url();
        if (url.endsWith('.ogg') || url.endsWith('.mp3')) {
            if (response.status() !== 200) {
                failedRequests.push(`${url} (${response.status()})`);
            }
        }
    });

    // Monitor console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    // Go to game
    await page.goto('./');

    // Wait for the splash screen
    const startBtn = page.getByTestId('start-sim-btn');
    await expect(startBtn).toBeVisible();

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Click start (force via evaluate to bypass overlays/animations)
    await startBtn.evaluate(el => (el as HTMLElement).click());

    // Wait for setup view
    await expect(page.getByTestId('setup-view')).toBeVisible({ timeout: 10000 });

    // Allow time for Howler to preload sounds
    await page.waitForTimeout(2000);

    // Assertions
    // 1. We should have attempted to load some sounds
    expect(soundRequests.length, 'Should attempt to load sound files').toBeGreaterThan(0);

    // 2. None should have failed
    expect(failedRequests, 'No sound files should 404').toEqual([]);

    // 3. No console errors related to audio
    const audioErrors = consoleErrors.filter(
        e =>
            e.toLowerCase().includes('audio') ||
            e.toLowerCase().includes('sound') ||
            e.toLowerCase().includes('howler')
    );
    expect(audioErrors).toEqual([]);
});
