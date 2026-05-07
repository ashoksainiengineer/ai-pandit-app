import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CandidateComparisonTable from '../CandidateComparisonTable';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  Trophy: () => <span data-testid="trophy-icon">Trophy</span>,
  TrendingUp: () => <span data-testid="trending-up-icon">TrendingUp</span>,
}));

describe('CandidateComparisonTable', () => {
  it('renders the Candidate Birth Times header', () => {
    render(<CandidateComparisonTable />);
    expect(screen.getByText('Candidate Birth Times')).toBeInTheDocument();
  });

  it('renders all 4 candidate time entries', () => {
    render(<CandidateComparisonTable />);
    expect(screen.getByText('14:32:18')).toBeInTheDocument();
    expect(screen.getByText('14:31:45')).toBeInTheDocument();
    expect(screen.getByText('14:33:02')).toBeInTheDocument();
    expect(screen.getByText('14:30:28')).toBeInTheDocument();
  });

  it('displays scores for all candidates', () => {
    render(<CandidateComparisonTable />);
    expect(screen.getByText('94.2%')).toBeInTheDocument();
    expect(screen.getByText('87.5%')).toBeInTheDocument();
    expect(screen.getByText('82.1%')).toBeInTheDocument();
    expect(screen.getByText('76.8%')).toBeInTheDocument();
  });

  it('shows "Best" badge for the highest-scoring candidate (94.2%)', () => {
    render(<CandidateComparisonTable />);
    const bestBadges = screen.getAllByText('Best');
    expect(bestBadges).toHaveLength(1);
  });

  it('renders Trophy icon for the best candidate', () => {
    render(<CandidateComparisonTable />);
    const trophyIcons = screen.getAllByTestId('trophy-icon');
    expect(trophyIcons).toHaveLength(1);
  });

  it('renders TrendingUp icon in the header', () => {
    render(<CandidateComparisonTable />);
    expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
  });

  it('renders score bars for all 4 candidates', () => {
    const { container } = render(<CandidateComparisonTable />);
    // Each ScoreBar renders a div with class "flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden ml-3"
    const scoreBars = container.querySelectorAll('.h-1\\.5');
    expect(scoreBars).toHaveLength(4);
  });

  it('applies black background to best candidate score bar', () => {
    const { container } = render(<CandidateComparisonTable />);
    // The best candidate's score bar inner div has "bg-black" class
    const bestBars = container.querySelectorAll('.bg-black.rounded-full');
    expect(bestBars.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the footer with consensus text', () => {
    render(<CandidateComparisonTable />);
    expect(screen.getByText('Highest confidence match')).toBeInTheDocument();
    expect(
      screen.getByText('Dasha + KP + Shadbala consensus'),
    ).toBeInTheDocument();
  });

  it('renders the pulsing status dot', () => {
    const { container } = render(<CandidateComparisonTable />);
    const pulseDot = container.querySelector('.animate-pulse');
    expect(pulseDot).toBeInTheDocument();
  });
});
