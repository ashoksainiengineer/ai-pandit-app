import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Step3PhysicalTraits from './Step3PhysicalTraits';

const mockTraits = {
  facialStructure: {
    eyeShape: 'almond',
    noseShape: 'straight',
    forehead: 'high',
    jawLine: 'square',
    lips: 'full',
    ears: 'large',
    voicePitch: 'deep',
  },
  skinHair: {
    complexion: 'fair',
    hairType: 'straight',
    marks: ['mole on left cheek'],
  },
  build: 'athletic',
  height: { cm: 175, feet: 5, inches: 9 },
};

describe('Step3PhysicalTraits', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Step3PhysicalTraits
        physicalTraits={mockTraits}
        updateTraits={vi.fn()}
      />
    );
    expect(container).toBeTruthy();
  });

  it('displays the step header', () => {
    render(
      <Step3PhysicalTraits
        physicalTraits={mockTraits}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText(/Physical/)).toBeInTheDocument();
    expect(screen.getByText(/Appearance/)).toBeInTheDocument();
  });

  it('shows step indicator', () => {
    render(
      <Step3PhysicalTraits
        physicalTraits={mockTraits}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    render(
      <Step3PhysicalTraits
        physicalTraits={mockTraits}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText(/done/)).toBeInTheDocument();
  });

  it('renders trait selector tabs', () => {
    render(
      <Step3PhysicalTraits
        physicalTraits={mockTraits}
        updateTraits={vi.fn()}
      />
    );
    // Trait names appear in both tab buttons and the active content header
    const eyes = screen.getAllByText('Your Eyes');
    const noses = screen.getAllByText('Your Nose');
    const foreheads = screen.getAllByText('Your Forehead');
    expect(eyes.length).toBeGreaterThanOrEqual(1);
    expect(noses.length).toBeGreaterThanOrEqual(1);
    expect(foreheads.length).toBeGreaterThanOrEqual(1);
  });

  it('shows how to check instructions', () => {
    render(
      <Step3PhysicalTraits
        physicalTraits={mockTraits}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText('How to check:')).toBeInTheDocument();
  });

  it('shows why it matters section', () => {
    render(
      <Step3PhysicalTraits
        physicalTraits={mockTraits}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText('Why it matters:')).toBeInTheDocument();
  });

  it('displays visual options for active trait', () => {
    render(
      <Step3PhysicalTraits
        physicalTraits={mockTraits}
        updateTraits={vi.fn()}
      />
    );
    // Eye options should be visible by default
    expect(screen.getByText('Almond')).toBeInTheDocument();
    expect(screen.getByText('Round')).toBeInTheDocument();
    expect(screen.getByText('Deep Set')).toBeInTheDocument();
  });

  it('shows special marks section', () => {
    render(
      <Step3PhysicalTraits
        physicalTraits={mockTraits}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText('Special Marks (Optional)')).toBeInTheDocument();
  });

  it('shows not sure option', () => {
    render(
      <Step3PhysicalTraits
        physicalTraits={mockTraits}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText(/Not sure/)).toBeInTheDocument();
  });

  it('renders with empty traits', () => {
    const { container } = render(
      <Step3PhysicalTraits
        physicalTraits={{}}
        updateTraits={vi.fn()}
      />
    );
    expect(container).toBeTruthy();
    expect(screen.getByText(/Physical/)).toBeInTheDocument();
  });
});
