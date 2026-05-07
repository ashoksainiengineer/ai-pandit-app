import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EphemerisTable from '../EphemerisTable';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  Globe: () => <span data-testid="globe-icon">Globe</span>,
}));

describe('EphemerisTable', () => {
  it('renders the section header with Ephemeris Data title', () => {
    render(<EphemerisTable />);
    expect(
      screen.getByText('Ephemeris Data — Skyfield DE440'),
    ).toBeInTheDocument();
  });

  it('renders all 5 planet rows', () => {
    render(<EphemerisTable />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Moon')).toBeInTheDocument();
    expect(screen.getByText('Mars')).toBeInTheDocument();
    expect(screen.getByText('Jupiter')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
  });

  it('displays correct sign for each planet', () => {
    render(<EphemerisTable />);
    expect(screen.getByText('Leo')).toBeInTheDocument();
    expect(screen.getByText('Scorpio')).toBeInTheDocument();
    expect(screen.getByText('Aries')).toBeInTheDocument();
    expect(screen.getByText('Taurus')).toBeInTheDocument();
    expect(screen.getByText('Capricorn')).toBeInTheDocument();
  });

  it('displays correct longitude for each planet', () => {
    render(<EphemerisTable />);
    expect(screen.getByText('125.42°')).toBeInTheDocument();
    expect(screen.getByText('218.91°')).toBeInTheDocument();
    expect(screen.getByText('15.67°')).toBeInTheDocument();
    expect(screen.getByText('45.18°')).toBeInTheDocument();
    expect(screen.getByText('298.33°')).toBeInTheDocument();
  });

  it('displays correct house for each planet', () => {
    render(<EphemerisTable />);
    expect(screen.getByText('5th')).toBeInTheDocument();
    expect(screen.getByText('8th')).toBeInTheDocument();
    expect(screen.getByText('1st')).toBeInTheDocument();
    expect(screen.getByText('11th')).toBeInTheDocument();
    expect(screen.getByText('10th')).toBeInTheDocument();
  });

  it('renders RETRO label for Jupiter (the only retrograde planet)', () => {
    render(<EphemerisTable />);
    const retroLabels = screen.getAllByText('RETRO');
    expect(retroLabels).toHaveLength(1);
  });

  it('renders "direct" for non-retrograde planets', () => {
    render(<EphemerisTable />);
    // All non-RETRO planets show "direct"; Sun, Moon, Mars, Saturn = 4
    const directLabels = screen.getAllByText('direct');
    expect(directLabels).toHaveLength(4);
  });

  it('shows table headers: Planet, Sign, Longitude, House, Motion', () => {
    render(<EphemerisTable />);
    expect(screen.getByText('Planet')).toBeInTheDocument();
    expect(screen.getByText('Sign')).toBeInTheDocument();
    expect(screen.getByText('Longitude')).toBeInTheDocument();
    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByText('Motion')).toBeInTheDocument();
  });

  it('renders footer text referencing NASA JPL DE440', () => {
    render(<EphemerisTable />);
    expect(
      screen.getByText(/NASA JPL DE440/),
    ).toBeInTheDocument();
  });

  it('renders the Globe icon', () => {
    render(<EphemerisTable />);
    expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
  });

  it('renders accuracy notation in footer', () => {
    render(<EphemerisTable />);
    expect(screen.getByText(/IEEE 754 double-precision/)).toBeInTheDocument();
    expect(screen.getByText(/±0.0001° accuracy/)).toBeInTheDocument();
  });
});
