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
import '@/app/prism-design-system.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <Layout hideFooter>
        <div className="min-h-[60vh] flex items-center justify-center bg-dia-bg">
          <div 
            className="dia-card max-w-md text-center"
            style={{ WebkitBackdropFilter: 'blur(24px)' }}
          >
            <h1 className="text-2xl font-medium text-black mb-4">
              Please Sign In
            </h1>
            <p className="text-sm text-black/60 mb-6">
              Access your dashboard to view and manage your birth time rectification sessions.
            </p>
            <Link href="/sign-in" className="dia-btn">
              Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <div className="pt-8 pb-12 bg-dia-bg min-h-screen">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent clerkId={user.id} userName={user.firstName || 'User'} />
        </Suspense>
      </div>
    </Layout>
  );
}