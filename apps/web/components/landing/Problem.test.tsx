import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Problem from './Problem';

class MockIntersectionObserver {
  observe = () => null;
  unobserve = () => null;
  disconnect = () => null;
}
window.IntersectionObserver = MockIntersectionObserver as any;

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Problem', () => {
  it('renders without crashing', () => {
    const { container } = render(<Problem />);
    expect(container).toBeTruthy();
  });

  it('displays the main section title', () => {
    render(<Problem />);
    const headings = screen.getAllByRole('heading', { name: /Algorithmic Precision vs Manual Methods/i });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('shows technical comparison badge', () => {
    render(<Problem />);
    expect(screen.getByText('Technical Comparison')).toBeInTheDocument();
  });

  it('displays technical specs', () => {
    render(<Problem />);
    expect(screen.getByText('Skyfield')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek R1')).toBeInTheDocument();
    expect(screen.getByText('Neon Postgres')).toBeInTheDocument();
    expect(screen.getByText('Drizzle')).toBeInTheDocument();
  });

  it('shows backend component names', () => {
    render(<Problem />);
    expect(screen.getByText('Ephemeris Service')).toBeInTheDocument();
    expect(screen.getByText('BTR Processor')).toBeInTheDocument();
    expect(screen.getByText('Session Manager')).toBeInTheDocument();
    expect(screen.getByText('Consensus Engine')).toBeInTheDocument();
  });

  it('shows comparison categories', () => {
    render(<Problem />);
    expect(screen.getByText('Manual Calculation')).toBeInTheDocument();
    expect(screen.getByText('Skyfield Ephemeris Engine')).toBeInTheDocument();
    expect(screen.getByText('Human Astrologer')).toBeInTheDocument();
    expect(screen.getByText('BTR Pipeline Engine')).toBeInTheDocument();
  });

  it('has CTA button linking to rectify page', () => {
    render(<Problem />);
    const cta = screen.getByText('Start Analysis');
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/rectify');
  });

  it('shows bottom CTA section', () => {
    render(<Problem />);
    expect(screen.getByText('Begin Your Journey')).toBeInTheDocument();
    expect(screen.getByText('Experience Divine Precision')).toBeInTheDocument();
  });
});
