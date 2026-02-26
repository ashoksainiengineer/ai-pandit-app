import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedAIPanel } from '../UnifiedAIPanel';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

// 1. Mock ResizeObserver for virtualization/responsive logic
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// 2. Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Brain: () => <svg data-testid="icon-brain" />,
    Radio: () => <svg data-testid="icon-radio" />,
    Activity: () => <svg data-testid="icon-activity" />,
    Users: () => <svg data-testid="icon-users" />,
    ChevronDown: () => <svg data-testid="icon-chevrondown" />,
    ChevronUp: () => <svg data-testid="icon-chevronup" />,
}));

// 3. Mock framework to prevent layout warnings in JSDOM
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// 4. Mock @tanstack/react-virtual to bypass complex DOM measuring in jsdom
vi.mock('@tanstack/react-virtual', () => {
    return {
        useVirtualizer: () => ({
            getVirtualItems: () => [
                { index: 0, start: 0, size: 200, key: 'mock-0' }
            ],
            getTotalSize: () => 200,
        }),
    };
});

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

const mockThinking = {
    stage: 2,
    candidateTime: '12:00',
    fullText: 'Analyzed grid parameters...',
    startedAt: Date.now() - 1000,
    updatedAt: Date.now(),
};

const mockCandidates = {
    '12:00': mockThinking,
    '13:30': { ...mockThinking, candidateTime: '13:30', fullText: 'Alternative grid...' }
};

const mockScores = [
    { time: '12:00', score: 90, stage: 2 },
    { time: '13:30', score: 65, stage: 2 },
];

describe('UnifiedAIPanel', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the title and stage information safely', () => {
        render(
            <UnifiedAIPanel
                thinking={mockThinking}
                isActive={true}
                stage={2}
                title="Test Intelligence Grid"
            />
        );

        expect(screen.getByText('Test Intelligence Grid')).toBeInTheDocument();
    });

    it('renders candidate cards in the virtual grid', () => {
        render(
            <UnifiedAIPanel
                thinking={mockThinking}
                allCandidates={mockCandidates}
                candidateScores={mockScores}
                isActive={true}
                stage={2}
            />
        );

        // 90 score -> '12:00' card title should be present
        expect(screen.getByText('12:00')).toBeInTheDocument();

        // 65 score -> '13:30' card title should be present
        expect(screen.getByText('13:30')).toBeInTheDocument();
    });

    it('triggers onSelectCandidate when a candidate card is clicked', () => {
        const handleSelect = vi.fn();

        render(
            <UnifiedAIPanel
                thinking={mockThinking}
                allCandidates={mockCandidates}
                candidateScores={mockScores}
                isActive={true}
                stage={2}
                onSelectCandidate={handleSelect}
            />
        );

        // Click the 13:30 card (clicking its title bubbles up)
        const element = screen.getByText('13:30');
        fireEvent.click(element);

        expect(handleSelect).toHaveBeenCalledWith('13:30');
    });

    it('auto-collapses when isCompleted is true and isActive is false', () => {
        render(
            <UnifiedAIPanel
                thinking={null}
                isActive={false}
                isCompleted={true}
                stage={2}
            />
        );

        expect(screen.getByTestId('icon-brain')).toBeInTheDocument();
        // Since it's collapsed, "Stage processing completed" should be visible
        expect(screen.getByText('Stage processing completed')).toBeInTheDocument();
    });

});
