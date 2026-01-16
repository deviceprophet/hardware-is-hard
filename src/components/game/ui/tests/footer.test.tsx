/**
 * Footer Component Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock the global defines
beforeAll(() => {
    // @ts-expect-error - mocking global defines
    globalThis.__APP_VERSION__ = '1.0.0';
    // @ts-expect-error - mocking global defines
    globalThis.__GIT_COMMIT__ = 'abc1234';
});

describe('Footer Component', () => {
    it('should render copyright with current year', async () => {
        const { Footer } = await import('../../../../components/game/ui/Footer');
        render(<Footer />);

        const currentYear = new Date().getFullYear();
        expect(screen.getByText(new RegExp(`${currentYear}`))).toBeTruthy();
    });

    it('should render Device Prophet link', async () => {
        const { Footer } = await import('../../../../components/game/ui/Footer');
        render(<Footer />);

        const link = screen.getByRole('link', { name: /Device Prophet/i });
        expect(link).toBeTruthy();
        expect(link.getAttribute('href')).toBe('https://deviceprophet.com');
    });

    it('should render version and git hash', async () => {
        const { Footer } = await import('../../../../components/game/ui/Footer');
        render(<Footer />);

        // Should display version from mock
        expect(screen.getByText(/v1\.0\.0/)).toBeTruthy();
        expect(screen.getByText(/abc1234/)).toBeTruthy();
    });

    it('should render privacy and github links', async () => {
        const { Footer } = await import('../../../../components/game/ui/Footer');
        render(<Footer />);

        const privacyLink = screen.getByRole('link', { name: /Privacy/i });
        expect(privacyLink.getAttribute('href')).toBe('https://deviceprophet.com/privacy');

        const githubLink = screen.getByRole('link', { name: /GitHub/i });
        expect(githubLink.getAttribute('href')).toContain('github.com');
    });
});
