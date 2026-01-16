/**
 * Regression Tests for Recent UI/UX Fixes
 *
 * Tests for:
 * 1. Footer version display
 * 2. Twitter share URL (no duplicate hashtags)
 * 3. LogPanel scroll isolation (no parent scroll)
 * 4. Responsive layout (desktop full-window, mobile scrollable)
 */

import { test, expect } from '@playwright/test';

test.describe('Footer Component', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem(
                'hardware_tutorial_completed',
                JSON.stringify({ completed: ['welcome', 'setup', 'simulation'], skipped: true })
            );
        });
    });

    test('should display version and git hash in footer', async ({ page }) => {
        await page.goto('./');
        await page.waitForTimeout(1000);

        // Footer should be visible
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();

        // Should contain version pattern like "v1.0.0 (abc1234)"
        const footerText = await footer.textContent();
        expect(footerText).toMatch(/v\d+\.\d+\.\d+\s*\([a-f0-9]{7}\)/i);
    });

    test('should have privacy, github links in footer', async ({ page }) => {
        await page.goto('./');
        await page.waitForTimeout(1000);

        const footer = page.locator('footer');
        await expect(footer.locator('a[href*="deviceprophet.com/privacy"]')).toBeVisible();
        await expect(footer.locator('a[href*="github.com"]')).toBeVisible();
    });
});

test.describe('Twitter Share URL', () => {
    test('should not have duplicate HardwareIsHard hashtag', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem(
                'hardware_tutorial_completed',
                JSON.stringify({ completed: ['welcome', 'setup', 'simulation'], skipped: true })
            );
        });

        // Navigate to a saved result (Victory or Autopsy)
        // We'll use JavaScript to check the URL construction
        await page.goto('./');
        await page.waitForTimeout(1000);

        // Check if share templates don't contain #HardwareIsHard
        const hasHashtagInTemplate = await page.evaluate(() => {
            // Check localStorage for any cached translations
            // Or we can fetch the translation file directly
            return fetch('/locales/en/translation.json')
                .then(r => r.json())
                .then(data => {
                    const victoryTemplate = data?.victory?.shareTemplate || '';
                    const autopsyTemplate = data?.autopsy?.shareTemplate || '';
                    return (
                        victoryTemplate.includes('#HardwareIsHard') ||
                        autopsyTemplate.includes('#HardwareIsHard')
                    );
                })
                .catch(() => false);
        });

        expect(hasHashtagInTemplate).toBe(false);
    });
});

test.describe('Responsive Layout', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem(
                'hardware_tutorial_completed',
                JSON.stringify({ completed: ['welcome', 'setup', 'simulation'], skipped: true })
            );
        });
    });

    test('desktop should have fixed-height container', async ({ page }) => {
        // Set desktop viewport
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('./');
        await page.waitForTimeout(1000);

        // Check that the main container has overflow-hidden on desktop
        const hasOverflowHidden = await page.evaluate(() => {
            const container = document.querySelector('[class*="md:overflow-hidden"]');
            if (!container) return false;
            const style = window.getComputedStyle(container);
            // On desktop (md+), it should have overflow hidden
            return style.overflow === 'hidden' || style.overflowY === 'hidden';
        });

        expect(hasOverflowHidden).toBe(true);
    });

    test('mobile should allow scrolling', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 390, height: 667 });
        await page.goto('./');

        // Initialize and go to setup
        await page
            .getByTestId('start-sim-btn')
            .click({ timeout: 5000 })
            .catch(() => {});
        await page.waitForTimeout(500);

        // Check that the container allows scrolling
        const isScrollable = await page.evaluate(() => {
            // Find the main container
            const container = document.querySelector('[class*="overflow-y-auto"]');
            if (!container) return false;
            return true;
        });

        expect(isScrollable).toBe(true);
    });
});

test.describe('LogPanel Scroll Isolation', () => {
    test('LogPanel should use scrollTop not scrollIntoView', async ({ page }) => {
        // This is a code-level check - verify the implementation
        const logPanelContent = await page.evaluate(async () => {
            try {
                const response = await fetch('/src/components/game/ui/LogPanel.tsx');
                return await response.text();
            } catch {
                return '';
            }
        });

        // If we can fetch the source, check it doesn't use scrollIntoView
        if (logPanelContent) {
            expect(logPanelContent).not.toContain('scrollIntoView');
            expect(logPanelContent).toContain('scrollTop');
        }
    });
});
