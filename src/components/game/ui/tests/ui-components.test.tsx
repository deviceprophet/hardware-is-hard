/**
 * UI Components Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoomMeter } from '../DoomMeter';
import { TimelineProgress } from '../TimelineProgress';

describe('DoomMeter', () => {
    it('should render with correct aria attributes', () => {
        render(<DoomMeter level={50} />);
        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('aria-valuenow', '50');
        expect(progressbar).toHaveAttribute('aria-valuemin', '0');
        expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should clamp level to 0-100 range', () => {
        const { rerender } = render(<DoomMeter level={-10} />);
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

        rerender(<DoomMeter level={150} />);
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    it('should display percentage text', () => {
        render(<DoomMeter level={75} />);
        expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show DOOM label when showLabel is true', () => {
        render(<DoomMeter level={50} showLabel={true} />);
        expect(screen.getByText('DOOM')).toBeInTheDocument();
    });

    it('should hide DOOM label when showLabel is false', () => {
        render(<DoomMeter level={50} showLabel={false} />);
        expect(screen.queryByText('DOOM')).not.toBeInTheDocument();
    });

    it('should apply safe color class at low levels', () => {
        render(<DoomMeter level={20} />);
        const fill = screen.getByTestId('doom-fill');
        expect(fill).toHaveClass('bg-doom-safe');
    });

    it('should apply warning color class at medium levels', () => {
        render(<DoomMeter level={50} />);
        const fill = screen.getByTestId('doom-fill');
        expect(fill).toHaveClass('bg-doom-warning');
    });

    it('should apply danger color class at high levels', () => {
        render(<DoomMeter level={70} />);
        const fill = screen.getByTestId('doom-fill');
        expect(fill).toHaveClass('bg-doom-danger');
    });

    it('should apply critical color class at very high levels', () => {
        render(<DoomMeter level={90} />);
        const fill = screen.getByTestId('doom-fill');
        expect(fill).toHaveClass('bg-doom-critical');
    });

    it('should apply pulse animation at critical levels', () => {
        render(<DoomMeter level={85} />);
        const fill = screen.getByTestId('doom-fill');
        expect(fill).toHaveClass('animate-pulse');
    });
});

describe('TimelineProgress', () => {
    it('should display current month', () => {
        render(<TimelineProgress currentMonth={15} />);
        expect(screen.getByText('15 mo')).toBeInTheDocument();
    });

    it('should display max months', () => {
        render(<TimelineProgress currentMonth={10} maxMonth={60} />);
        expect(screen.getByText('60 mo')).toBeInTheDocument();
    });

    it('should format floating point months with days', () => {
        render(<TimelineProgress currentMonth={15.5} />);
        expect(screen.getByText('15 mo 15 d')).toBeInTheDocument();
    });

    it('should display year markers', () => {
        render(<TimelineProgress currentMonth={0} />);
        expect(screen.getByText('Y1')).toBeInTheDocument();
        expect(screen.getByText('Y2')).toBeInTheDocument();
        expect(screen.getByText('Y3')).toBeInTheDocument();
        expect(screen.getByText('Y4')).toBeInTheDocument();
        expect(screen.getByText('Y5')).toBeInTheDocument();
    });

    it('should use custom maxMonth when provided', () => {
        render(<TimelineProgress currentMonth={10} maxMonth={120} />);
        expect(screen.getByText('120 mo')).toBeInTheDocument();
    });
});
