/**
 * Dashboard Page — Server Component
 *
 * Renders the page shell immediately (TTFB ~200ms).
 * Session data streams in on the client via Suspense.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import Layout from '@/components/Layout';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardContent } from './DashboardContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <Layout hideFooter>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center bg-white border border-surface-muted rounded-2xl p-8 max-w-md shadow-lg">
            <h1 className="text-2xl font-bold text-content-primary mb-4 font-[family-name:var(--font-cormorant)]">
              Please Sign In
            </h1>
            <p className="text-content-secondary mb-6">
              Access your dashboard to view and manage your birth time rectification sessions.
            </p>
            <Link
              href="/sign-in"
              className="inline-block bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <div className="pt-8 pb-12">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent clerkId={user.id} userName={user.firstName || 'User'} />
        </Suspense>
      </div>
    </Layout>
  );
}
