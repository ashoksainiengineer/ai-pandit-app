import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import React from 'react';

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
    currentUser: vi.fn(),
}));

// Mock Database
vi.mock('@ai-pandit/db', () => ({
    db: {
        query: {
            users: {
                findFirst: vi.fn(),
            },
            sessions: {
                findMany: vi.fn(),
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue({}),
        })),
    },
    users: {},
    sessions: {},
}));

// Mock Crypto
vi.mock('@/lib/crypto', () => ({
    initializeEncryption: vi.fn(),
    parseSensitiveField: vi.fn((val) => val),
    isEncrypted: vi.fn(() => false),
}));

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useParams: () => ({}),
    usePathname: () => '/',
}));

// Mock components
vi.mock('@/app/dashboard/DashboardClient', () => ({
    DashboardClient: ({ initialSessions, userName }: any) => (
        <div data-testid="dashboard-client">
            <h1>Welcome, {userName}</h1>
            <div data-testid="session-count">{initialSessions.length}</div>
        </div>
    ),
}));

vi.mock('@/components/Layout', () => ({
    default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

describe('DashboardPage (Integration)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders sign-in prompt when unauthenticated', async () => {
        const { currentUser } = await import('@clerk/nextjs/server');
        (currentUser as any).mockResolvedValue(null);

        const result = await DashboardPage();
        render(result);

        expect(screen.getByText(/Please Sign In/i)).toBeInTheDocument();
    });

    it('fetches and displays sessions when authenticated', async () => {
        const { currentUser } = await import('@clerk/nextjs/server');
        const { db } = await import('@ai-pandit/db');

        (currentUser as any).mockResolvedValue({
            id: 'clerk_123',
            firstName: 'John',
            emailAddresses: [{ emailAddress: 'john@example.com' }],
        });

        (db.query.users.findFirst as any).mockResolvedValue({
            id: 'user_123',
            clerkId: 'clerk_123',
        });

        (db.query.sessions.findMany as any).mockResolvedValue([
            { id: 's1', fullName: 'Session 1', createdAt: new Date() },
            { id: 's2', fullName: 'Session 2', createdAt: new Date() },
        ]);

        const result = await DashboardPage();
        render(result);

        await waitFor(() => {
            expect(screen.getByText(/Welcome, John/i)).toBeInTheDocument();
            expect(screen.getByTestId('session-count')).toHaveTextContent('2');
        });
    });

    it('syncs user to DB if missing', async () => {
        const { currentUser } = await import('@clerk/nextjs/server');
        const { db } = await import('@ai-pandit/db');

        (currentUser as any).mockResolvedValue({
            id: 'clerk_new',
            firstName: 'New',
            lastName: 'User',
            emailAddresses: [{ emailAddress: 'new@example.com' }],
        });

        // First call returns null, second call (after insert) would return the user
        (db.query.users.findFirst as any).mockResolvedValueOnce(null).mockResolvedValueOnce({
            id: 'new_user_123',
            clerkId: 'clerk_new',
        });

        (db.query.sessions.findMany as any).mockResolvedValue([]);

        const result = await DashboardPage();
        render(result);

        await waitFor(() => {
            expect(db.insert).toHaveBeenCalled();
            expect(screen.getByText(/Welcome, New/i)).toBeInTheDocument();
        });
    });

    it('handles database errors gracefully', async () => {
        const { currentUser } = await import('@clerk/nextjs/server');
        const { db } = await import('@ai-pandit/db');

        (currentUser as any).mockResolvedValue({ id: 'clerk_123' });
        (db.query.users.findFirst as any).mockRejectedValue(new Error('DB Error'));

        const result = await DashboardPage();
        render(result);

        // Should return 0 sessions on error
        await waitFor(() => {
            expect(screen.getByTestId('session-count')).toHaveTextContent('0');
        });
    });
});
