import { test, expect } from '@playwright/test';

test.describe('E2E: Tutorial System', () => {
    test.beforeEach(async ({ page }) => {
        // Clear local storage ONCE at the start of the test across all navigations
        await page.goto('./');
        await page.evaluate(() => localStorage.clear());

        // Disable tutorial
        await page.addInitScript(() => {
            // Remove Astro toolbar
            const observer = new MutationObserver(() => {
                const toolbar = document.querySelector('astro-dev-toolbar');
                if (toolbar) toolbar.remove();
            });
            observer.observe(document, { childList: true, subtree: true });
        });

        // Disable animations for stability
        await page.addStyleTag({
            content:
                '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }'
        });
    });

    test('Tutorial appears by default and can be completed', async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });
        console.log('Navigated to:', page.url());

        // Verify App Loaded
        const splashTitle = page.getByTestId('splash-title');
        await expect(splashTitle).toBeVisible({ timeout: 15000 });

        // 1. Check for Welcome Step
        const welcomeTitle = page.getByTestId('tutorial-title');
        await expect(welcomeTitle).toBeVisible({ timeout: 10000 });
        await expect(welcomeTitle).toContainText('Welcome to Prophet Labs');

        // Check content
        const content = page.getByTestId('tutorial-content');
        await expect(content).toBeVisible();
        await expect(content).toContainText('Your goal: Keep an IoT device alive');

        // Click "Got it"
        await page.getByTestId('tutorial-got-it').click();
        await expect(welcomeTitle).toBeHidden();
    });

    test('Tutorial toggle on Splash Screen resets tutorial', async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });
        await expect(page.getByTestId('splash-title')).toBeVisible({ timeout: 15000 });

        // 1. Skip the initial tutorial
        const skipBtn = page.getByText('Skip Tutorial');
        await expect(skipBtn).toBeVisible({ timeout: 10000 });
        await skipBtn.click();
        await expect(page.getByTestId('tutorial-title')).toBeHidden();

        // 2. Click the Help/Tutorial button (toggle)
        // Note: The button has aria-label="Enable Tutorial" when inactive
        const toggleBtn = page.getByRole('button', { name: /Enable Tutorial/i });
        await expect(toggleBtn).toBeVisible();
        await toggleBtn.click();

        // 3. Verify Tutorial reappears (Reset behavior)
        // Because we are on Splash screen, it should showing "Welcome to Prophet Labs" again
        await expect(page.getByTestId('tutorial-title')).toBeVisible();
        await expect(page.getByTestId('tutorial-title')).toContainText('Welcome to Prophet Labs');
    });

    test('Tutorial translations (Spanish)', async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });
        await expect(page.getByTestId('splash-title')).toBeVisible({ timeout: 15000 });

        // 1. Initial State (English)
        await expect(page.getByTestId('tutorial-title')).toContainText('Welcome to Prophet Labs', {
            timeout: 10000
        });

        // 2. Switch Language to Spanish
        // We might need to close the tutorial first to access the language selector if it's covered?
        // the tutorial overlay has z-index 100, checking if language selector (z-50) is clickable.
        // Usually overlays block clicks. Let's strictly follow user flow:
        // User sees English tutorial -> clicks Skip -> changes Language -> enables Tutorial -> sees Spanish Tutorial?
        // OR: User changes language BEFORE tutorial?

        // Let's try to switch language while tutorial is open if possible, or skip first.
        await page.getByText('Skip Tutorial').click();

        const langBtn = page.getByTestId('language-selector');
        await langBtn.click(); // Switch to ES
        await expect(langBtn).toContainText('ES');

        // 3. Re-enable Tutorial (Reset)
        const toggleBtn = page.getByRole('button', { name: /Enable Tutorial/i }); // In Spanish "Activar Tutorial"? No, aria-label might be hardcoded in GameContainer...
        // Let's check GameContainer again.
        // aria-label={isActive ? 'Disable Tutorial' : 'Enable Tutorial'} -> untranslated strings in code!
        // That is a minor issue caught by this test thought process!
        // However, for now let's rely on the button selector.
        await toggleBtn.click();

        // 4. Verify Spanish Content
        await expect(page.getByTestId('tutorial-title')).toBeVisible();
        // "Bienvenido a Prophet Labs"
        await expect(page.getByTestId('tutorial-title')).toContainText('Bienvenido a Prophet Labs');
        await expect(page.getByTestId('tutorial-content')).toContainText(
            'Tu objetivo: Mantener un dispositivo IoT'
        );

        // Verify Subtitle
        await expect(page.getByText('THE RECALL RUN: SIMULADOR DE CAOS IOT')).toBeVisible();
    });
});
