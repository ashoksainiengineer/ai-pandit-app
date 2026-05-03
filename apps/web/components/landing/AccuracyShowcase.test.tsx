import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccuracyShowcase } from './AccuracyShowcase';

class MockIntersectionObserver {
  observe = () => null;
  unobserve = () => null;
  disconnect = () => null;
}
window.IntersectionObserver = MockIntersectionObserver as any;

describe('AccuracyShowcase', () => {
  it('renders without crashing', () => {
    const { container } = render(<AccuracyShowcase />);
    expect(container).toBeTruthy();
  });

  it('displays the section title', () => {
    render(<AccuracyShowcase />);
    const headings = screen.getAllByRole('heading', { name: /Divine Precision Engineering/i });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('shows precision metrics badge', () => {
    render(<AccuracyShowcase />);
    expect(screen.getByText('Precision Metrics')).toBeInTheDocument();
  });

  it('displays accuracy comparison methods', () => {
    render(<AccuracyShowcase />);
    expect(screen.getByText('Manual Astrologer')).toBeInTheDocument();
    expect(screen.getByText('Basic Software')).toBeInTheDocument();
    expect(screen.getByText('AI Pandit BTR')).toBeInTheDocument();
  });

  it('shows accuracy percentages', () => {
    render(<AccuracyShowcase />);
    expect(screen.getAllByText('65%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('75%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('97.3%').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the Divine highlight badge', () => {
    render(<AccuracyShowcase />);
    expect(screen.getByText('Divine')).toBeInTheDocument();
  });

  it('displays technical metrics', () => {
    render(<AccuracyShowcase />);
    expect(screen.getByText('Calculation Precision')).toBeInTheDocument();
    expect(screen.getByText('Method Consensus')).toBeInTheDocument();
    expect(screen.getByText('Event Correlation')).toBeInTheDocument();
    expect(screen.getByText('Processing Speed')).toBeInTheDocument();
  });

  it('shows system operational status', () => {
    render(<AccuracyShowcase />);
    expect(screen.getByText('System Operational')).toBeInTheDocument();
  });

  it('shows ephemeris and AI status', () => {
    render(<AccuracyShowcase />);
    expect(screen.getByText('Ephemeris: Synced')).toBeInTheDocument();
    expect(screen.getByText('AI: Connected')).toBeInTheDocument();
  });

  it('shows calculation pipeline details', () => {
    render(<AccuracyShowcase />);
    expect(screen.getByText('Calculation Pipeline')).toBeInTheDocument();
    expect(screen.getByText('DE440')).toBeInTheDocument();
    expect(screen.getByText('1,440')).toBeInTheDocument();
  });
});
