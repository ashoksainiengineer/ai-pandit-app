import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AIThinkingBox from '../AIThinkingBox';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  Brain: () => <span data-testid="brain-icon">Brain</span>,
  CheckCircle2: () => <span data-testid="check-icon">✓</span>,
}));

describe('AIThinkingBox', () => {
  it('renders the AI Analysis Engine header', () => {
    render(<AIThinkingBox />);
    expect(screen.getByText('AI Analysis Engine')).toBeInTheDocument();
  });

  it('renders all 4 analysis step labels', () => {
    render(<AIThinkingBox />);
    expect(
      screen.getByText('Skyfield ephemeris — calculating planetary positions'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Vimshottari Dasha periods — cross-referencing events'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('KP Sub-lord precision — narrowing time window'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Shadbala strength — validating house placements'),
    ).toBeInTheDocument();
  });

  it('shows check marks (CheckCircle2) for the 2 completed steps', () => {
    render(<AIThinkingBox />);
    const checkIcons = screen.getAllByTestId('check-icon');
    expect(checkIcons).toHaveLength(2);
  });

  it('shows amber pulse dots for the 2 active (non-done) steps', () => {
    const { container } = render(<AIThinkingBox />);
    const amberDots = container.querySelectorAll('.bg-amber-400');
    expect(amberDots).toHaveLength(2);
  });

  it('renders the progress bar', () => {
    const { container } = render(<AIThinkingBox />);
    // The inner progress bar div has class "h-full bg-black rounded-full"
    const innerBar = container.querySelector('.h-full.bg-black.rounded-full');
    expect(innerBar).toBeInTheDocument();
  });

  it('renders the Brain icon', () => {
    render(<AIThinkingBox />);
    expect(screen.getByTestId('brain-icon')).toBeInTheDocument();
  });

  it('renders the pulsing status dot', () => {
    const { container } = render(<AIThinkingBox />);
    // The header has a w-3 h-3 bg-black rounded-full animate-pulse dot
    const pulseDot = container.querySelector('.animate-pulse');
    expect(pulseDot).toBeInTheDocument();
  });
});
