import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionCard } from './SessionCard';
import React from 'react';

// Mock Clerk useAuth
vi.mock('@clerk/nextjs', () => ({
    useAuth: () => ({
        getToken: vi.fn().mockResolvedValue('mock-token'),
    }),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Star: () => <div data-testid="icon-star" />,
    Trash2: () => <div data-testid="icon-trash" />,
    ExternalLink: () => <div data-testid="icon-external" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    MapPin: () => <div data-testid="icon-map-pin" />,
    Clock: () => <div data-testid="icon-clock" />,
    CheckCircle2: () => <div data-testid="icon-check" />,
    AlertCircle: () => <div data-testid="icon-alert" />,
    Loader2: () => <div data-testid="icon-loader" />,
    CopyPlus: () => <div data-testid="icon-copy" />,
    Sparkles: () => <div data-testid="icon-sparkles" />,
}));

// Mock APIClient
vi.mock('@/lib/api-client', () => ({
    APIClient: {
        post: vi.fn(),
    },
}));

// Mock DeleteConfirmModal
vi.mock('./DeleteConfirmModal', () => ({
    DeleteConfirmModal: ({ isOpen, onConfirm, isDeleting }: any) =>
        isOpen ? (
            <div data-testid="delete-modal">
                <button onClick={onConfirm}>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</button>
            </div>
        ) : null,
}));

// Mock ClientOnly
vi.mock('@/components/ui/ClientOnly', () => ({
    ClientOnly: ({ children }: any) => <>{children}</>,
}));

const mockSession = {
    id: 'test-session-123',
    fullName: 'John Doe',
    status: 'complete',
    confidence: 'high',
    accuracy: 95,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    birthPlace: 'Mumbai',
    dateOfBirth: '1990-05-20',
    rectifiedTime: '10:30:00',
};

describe('SessionCard', () => {
    const mockOnDelete = vi.fn();
    const mockOnDuplicate = vi.fn();
    const mockOnFavorite = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Global fetch mock
        global.fetch = vi.fn() as any;
    });

    it('triggers favorite action when star is clicked', () => {
        render(
            <SessionCard
                session={mockSession as any}
                viewMode="list"
                onFavorite={mockOnFavorite}
            />
        );

        const favoriteBtn = screen.getByTestId('icon-star').closest('button');
        fireEvent.click(favoriteBtn!);

        expect(mockOnFavorite).toHaveBeenCalledWith(mockSession.id);
    });

    it('opens delete confirmation modal when delete is clicked', () => {
        render(
            <SessionCard
                session={mockSession as any}
                viewMode="list"
                onDelete={mockOnDelete}
            />
        );

        const deleteBtn = screen.getByTestId('icon-trash').closest('button');
        fireEvent.click(deleteBtn!);

        expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    });

    it('handles successful deletion', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(
            <SessionCard
                session={mockSession as any}
                viewMode="list"
                onDelete={mockOnDelete}
            />
        );

        // Open modal
        fireEvent.click(screen.getByTestId('icon-trash').closest('button')!);

        // Confirm delete
        const confirmBtn = screen.getByText('Confirm Delete');
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/sessions/test-session-123'),
                expect.objectContaining({ method: 'DELETE' })
            );
            expect(mockOnDelete).toHaveBeenCalledWith(mockSession.id);
        });
    });

    it('handles successful duplication (clone)', async () => {
        const { APIClient } = await import('@/lib/api-client');
        (APIClient.post as any).mockResolvedValueOnce({
            success: true,
            data: { id: 'new-cloned-id' }
        });

        // Mock window.location.href
        const originalLocation = window.location;
        delete (window as any).location;
        (window as any).location = { href: '' } as any;

        render(
            <SessionCard
                session={mockSession as any}
                viewMode="list"
                onDuplicate={mockOnDuplicate}
            />
        );

        const cloneBtn = screen.getByTestId('icon-copy').closest('button');
        fireEvent.click(cloneBtn!);

        await waitFor(() => {
            expect(APIClient.post).toHaveBeenCalledWith(
                expect.stringContaining('/api/sessions/test-session-123/clone'),
                {},
                expect.any(Function)
            );
            expect(mockOnDuplicate).toHaveBeenCalledWith('new-cloned-id');
            expect(window.location.href).toContain('/rectify/new-cloned-id/edit');
        });

        // Restore location
        (window as any).location = originalLocation;
    });

    it('renders session information correctly in list view', () => {
        render(
            <SessionCard
                session={mockSession as any}
                viewMode="list"
            />
        );

        // Use getAllByText for fields that might appear in both mobile/desktop nodes
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.getByText('Mumbai')).toBeInTheDocument();
        expect(screen.getByText('10:30:00')).toBeInTheDocument();
    });
});
