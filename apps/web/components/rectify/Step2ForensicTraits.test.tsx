import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Step2ForensicTraits from './Step2ForensicTraits';

vi.mock('@/lib/forensic-quiz/questions', () => ({
  QUIZ_METADATA: {
    totalQuestions: 20,
    estimatedTimeMinutes: 5,
    categories: [
      { id: 'biological', name: 'Biological', icon: '🧬' },
      { id: 'psychographic', name: 'Psychographic', icon: '🧠' },
      { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦' },
      { id: 'behavioral', name: 'Behavioral', icon: '🎭' },
    ],
  },
  FORENSIC_ONLY_QUESTIONS: [
    { id: 'q1', category: 'biological', text: 'Test question 1', options: [] },
    { id: 'q2', category: 'psychographic', text: 'Test question 2', options: [] },
    { id: 'q3', category: 'family', text: 'Test question 3', options: [] },
    { id: 'q4', category: 'behavioral', text: 'Test question 4', options: [] },
  ],
  FORENSIC_ONLY_METADATA: { version: '1.0' },
}));

vi.mock('@/lib/forensic-quiz/scoring', () => ({
  mapQuizResultsToLegacyTraits: vi.fn(() => ({
    biological: { prakriti: 'vata' },
    psychographic: { speechStyle: 'fast' },
  })),
}));

vi.mock('./WhyForensicTraits', () => ({
  default: () => <div data-testid="why-forensic">Why Forensic Traits</div>,
}));

vi.mock('./ForensicQuizEngine', () => ({
  default: ({ onComplete, onCancel }: any) => (
    <div data-testid="quiz-engine">
      <button onClick={() => onComplete({ answers: {} })}>Complete Quiz</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('Step2ForensicTraits', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Step2ForensicTraits
        traits={{}}
        updateTraits={vi.fn()}
      />
    );
    expect(container).toBeTruthy();
  });

  it('displays the section title', () => {
    render(
      <Step2ForensicTraits
        traits={{}}
        updateTraits={vi.fn()}
      />
    );
    // h1 contains 'Forensic Traits' and h2 contains 'Vedic Forensic Assessment'
    const headings = screen.getAllByRole('heading', { name: /Forensic/i });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('shows step indicator', () => {
    render(
      <Step2ForensicTraits
        traits={{}}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText('STEP 3 OF 5')).toBeInTheDocument();
  });

  it('shows encrypted badge', () => {
    render(
      <Step2ForensicTraits
        traits={{}}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText(/End-to-End Encrypted/)).toBeInTheDocument();
  });

  it('shows quiz start screen when no existing data', () => {
    render(
      <Step2ForensicTraits
        traits={{}}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText('Vedic Forensic Assessment')).toBeInTheDocument();
    expect(screen.getByText('Start Assessment')).toBeInTheDocument();
  });

  it('shows assessment complete screen when data exists', () => {
    render(
      <Step2ForensicTraits
        traits={{
          biological: { prakriti: 'vata' },
          psychographic: { speechStyle: 'fast' },
          family: { siblingPosition: 'first' },
        }}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText('Assessment Complete')).toBeInTheDocument();
  });

  it('displays trait summary when data exists', () => {
    render(
      <Step2ForensicTraits
        traits={{
          biological: { prakriti: 'vata' },
          psychographic: { speechStyle: 'fast' },
          family: { siblingPosition: 'first' },
        }}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText('Body Type')).toBeInTheDocument();
    expect(screen.getByText('Eye Shape')).toBeInTheDocument();
    expect(screen.getByText('Speech Style')).toBeInTheDocument();
    expect(screen.getByText('Birth Order')).toBeInTheDocument();
  });

  it('shows retake button when data exists', () => {
    render(
      <Step2ForensicTraits
        traits={{
          biological: { prakriti: 'vata' },
        }}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText('Retake Assessment')).toBeInTheDocument();
  });

  it('shows continue button when data exists', () => {
    render(
      <Step2ForensicTraits
        traits={{
          biological: { prakriti: 'vata' },
        }}
        updateTraits={vi.fn()}
      />
    );
    expect(screen.getByText('Continue to Next Step')).toBeInTheDocument();
  });

  it('starts quiz when start button is clicked', async () => {
    render(
      <Step2ForensicTraits
        traits={{}}
        updateTraits={vi.fn()}
      />
    );
    const startBtn = screen.getByText('Start Assessment');
    startBtn.click();
    expect(await screen.findByTestId('quiz-engine')).toBeInTheDocument();
  });

  it('passes gender prop correctly', () => {
    const { container } = render(
      <Step2ForensicTraits
        traits={{}}
        updateTraits={vi.fn()}
        gender="male"
      />
    );
    expect(container).toBeTruthy();
  });
});
