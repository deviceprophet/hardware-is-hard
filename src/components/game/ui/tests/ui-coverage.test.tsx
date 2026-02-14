/**
 * UI Component Coverage Tests
 *
 * Smoke tests for components that previously had 0% coverage:
 * AchievementBadges, KeyboardHelpOverlay, LogPanel,
 * SystemArchitecture, LanguageSelector, GameStatsGrid, colorHelpers
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementBadges } from '../AchievementBadges';
import { KeyboardHelpOverlay } from '../KeyboardHelpOverlay';
import { LogPanel } from '../LogPanel';
import { SystemArchitecture } from '../SystemArchitecture';
import { LanguageSelector } from '../LanguageSelector';
import { GameStatsGrid } from '../GameStats/GameStatsGrid';
import { getBudgetColor, getComplianceColor, getDoomColor } from '../GameStats/colorHelpers';

// ========================================================================
// AchievementBadges
// ========================================================================

describe('AchievementBadges', () => {
    it('renders all achievement slots', () => {
        render(<AchievementBadges earned={[]} />);
        // All slots show "?" when none earned
        const questionMarks = screen.getAllByText('?');
        expect(questionMarks.length).toBeGreaterThan(0);
    });

    it('highlights earned achievements with their icon', () => {
        render(<AchievementBadges earned={['first_blood', 'survivor']} />);
        // Earned achievements show their icon instead of "?"
        // first_blood icon is '1', survivor icon is 'S'
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('shows title with name for earned achievements', () => {
        const { container } = render(<AchievementBadges earned={['first_blood']} />);
        const earnedBadge = container.querySelector('.bg-amber-500\\/20');
        expect(earnedBadge).toBeInTheDocument();
    });

    it('shows "???" title for locked achievements', () => {
        const { container } = render(<AchievementBadges earned={[]} />);
        const lockedBadges = container.querySelectorAll('[title="???"]');
        expect(lockedBadges.length).toBeGreaterThan(0);
    });
});

// ========================================================================
// KeyboardHelpOverlay
// ========================================================================

describe('KeyboardHelpOverlay', () => {
    it('renders dialog with keyboard shortcuts', () => {
        render(<KeyboardHelpOverlay onClose={() => {}} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        // Should show kbd elements for shortcuts
        expect(screen.getByText('Space')).toBeInTheDocument();
        expect(screen.getByText('Enter')).toBeInTheDocument();
        expect(screen.getByText('S')).toBeInTheDocument();
        expect(screen.getByText('Esc')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', () => {
        const onClose = vi.fn();
        render(<KeyboardHelpOverlay onClose={onClose} />);
        const closeButton = screen.getByLabelText(/close/i);
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when Escape key pressed', () => {
        const onClose = vi.fn();
        render(<KeyboardHelpOverlay onClose={onClose} />);
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop clicked', () => {
        const onClose = vi.fn();
        render(<KeyboardHelpOverlay onClose={onClose} />);
        const backdrop = screen.getByRole('dialog');
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not call onClose when content area clicked', () => {
        const onClose = vi.fn();
        render(<KeyboardHelpOverlay onClose={onClose} />);
        // Click the inner content, not the backdrop
        const title = screen.getByText('Space');
        fireEvent.click(title);
        expect(onClose).not.toHaveBeenCalled();
    });
});

// ========================================================================
// LogPanel
// ========================================================================

describe('LogPanel', () => {
    it('renders empty log panel', () => {
        render(<LogPanel history={[]} />);
        expect(screen.getByTestId('log-panel')).toBeInTheDocument();
    });

    it('renders history entries', () => {
        const history = [
            { month: 6, eventId: 'ev1', choiceId: 'ch1', doomIncrease: 10, cost: 5000 },
            { month: 12, eventId: 'ev2', choiceId: 'ch2', doomIncrease: 0, cost: 20000 }
        ];
        render(<LogPanel history={history} />);
        // formatGameDate(6) = "6 mo", formatGameDate(12) = "12 mo"
        expect(screen.getByText(/6 mo/)).toBeInTheDocument();
        expect(screen.getByText(/12 mo/)).toBeInTheDocument();
    });

    it('shows doom increase for positive doom entries', () => {
        const history = [{ month: 6, eventId: 'ev1', choiceId: 'ch1', doomIncrease: 15, cost: 0 }];
        render(<LogPanel history={history} />);
        // The doom increase text should be present (red colored)
        const container = screen.getByTestId('log-panel');
        expect(container.querySelector('.text-red-400')).toBeInTheDocument();
    });
});

// ========================================================================
// SystemArchitecture
// ========================================================================

describe('SystemArchitecture', () => {
    it('renders all 6 system nodes', () => {
        render(<SystemArchitecture activeTags={[]} />);
        expect(screen.getByTestId('system-architecture')).toBeInTheDocument();
        // All nodes should show nominal status
        const nominals = screen.getAllByText(/nominal/i);
        expect(nominals).toHaveLength(6);
    });

    it('shows warning status for nodes with active tags', () => {
        render(<SystemArchitecture activeTags={['cheap_wifi', 'no_encryption']} />);
        // Network node has 'cheap_wifi' and 'no_encryption' tags → should be critical
        const warnings = screen.getAllByText(/warning/i);
        expect(warnings.length).toBeGreaterThan(0);
    });

    it('displays active issue tags on critical nodes', () => {
        render(<SystemArchitecture activeTags={['bad_flash']} />);
        // Storage node maps to 'bad_flash' → should show tag label
        // The tag text is rendered via i18n with fallback to uppercase
        expect(screen.getByText(/BAD FLASH/i)).toBeInTheDocument();
    });

    it('nominal nodes have green indicator', () => {
        const { container } = render(<SystemArchitecture activeTags={[]} />);
        const greenDots = container.querySelectorAll('.bg-green-500');
        expect(greenDots.length).toBe(6);
    });

    it('critical nodes have red indicator', () => {
        const { container } = render(<SystemArchitecture activeTags={['cloud_dependency']} />);
        // Cloud node should be critical
        const redDots = container.querySelectorAll('.bg-red-500');
        expect(redDots.length).toBeGreaterThan(0);
    });
});

// ========================================================================
// LanguageSelector
// ========================================================================

describe('LanguageSelector', () => {
    it('renders language toggle button', () => {
        render(<LanguageSelector />);
        expect(screen.getByTestId('language-selector')).toBeInTheDocument();
    });

    it('shows current language code', () => {
        render(<LanguageSelector />);
        // Default test language is 'en'
        expect(screen.getByText('EN')).toBeInTheDocument();
    });
});

// ========================================================================
// GameStatsGrid
// ========================================================================

describe('GameStatsGrid', () => {
    it('renders budget, compliance, and doom stats', () => {
        render(
            <GameStatsGrid
                budget={75000}
                complianceLevel={80}
                doomLevel={30}
                initialBudget={100000}
            />
        );
        expect(screen.getByText('75K')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument();
        expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('renders with negative budget', () => {
        render(
            <GameStatsGrid
                budget={-10000}
                complianceLevel={50}
                doomLevel={60}
                initialBudget={100000}
            />
        );
        expect(screen.getByText('-10K')).toBeInTheDocument();
    });
});

// ========================================================================
// colorHelpers (pure functions)
// ========================================================================

describe('colorHelpers', () => {
    describe('getBudgetColor', () => {
        it('returns danger for zero or negative budget', () => {
            expect(getBudgetColor(0, 100000)).toBe('var(--doom-danger)');
            expect(getBudgetColor(-5000, 100000)).toBe('var(--doom-danger)');
        });

        it('returns warning for budget above 50% of initial', () => {
            expect(getBudgetColor(60000, 100000)).toBe('var(--doom-warning)');
        });

        it('returns danger for budget below 50% of initial', () => {
            expect(getBudgetColor(30000, 100000)).toBe('var(--doom-danger)');
        });
    });

    describe('getComplianceColor', () => {
        it('returns safe for high compliance', () => {
            expect(getComplianceColor(70)).toBe('var(--doom-safe)');
            expect(getComplianceColor(100)).toBe('var(--doom-safe)');
        });

        it('returns warning for medium compliance', () => {
            expect(getComplianceColor(40)).toBe('var(--doom-warning)');
            expect(getComplianceColor(69)).toBe('var(--doom-warning)');
        });

        it('returns danger for low compliance', () => {
            expect(getComplianceColor(39)).toBe('var(--doom-danger)');
            expect(getComplianceColor(0)).toBe('var(--doom-danger)');
        });
    });

    describe('getDoomColor', () => {
        it('returns warning for moderate doom (non-victory)', () => {
            expect(getDoomColor(40, false)).toBe('var(--doom-warning)');
        });

        it('returns danger for high doom (non-victory)', () => {
            expect(getDoomColor(60, false)).toBe('var(--doom-danger)');
            expect(getDoomColor(100, false)).toBe('var(--doom-danger)');
        });

        it('returns safe for low doom in victory', () => {
            expect(getDoomColor(20, true)).toBe('var(--doom-safe)');
        });

        it('returns warning for medium doom in victory', () => {
            expect(getDoomColor(45, true)).toBe('var(--doom-warning)');
        });

        it('returns danger for high doom in victory', () => {
            expect(getDoomColor(70, true)).toBe('var(--doom-danger)');
        });
    });
});
