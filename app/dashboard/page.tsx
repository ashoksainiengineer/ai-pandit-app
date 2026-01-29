/**
 * Enhanced Dashboard Page
 * Heavy user experience with analytics, filtering, and advanced features
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { sessions, users } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';
import { safeDecrypt } from '@/lib/crypto';
import { DashboardSession } from '@/lib/dashboard/types';
import { DashboardClient } from './DashboardClient';
import Layout from '@/components/Layout';

// Loading skeleton for the dashboard
function DashboardSkeleton() {
  return (
    <Layout hideNavbar hideFooter>
      {/* Nav Skeleton */}
      <nav className="sticky top-0 z-50 bg-[#0A0F1C]/95 backdrop-blur-sm border-b border-[#2A3442]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="h-10 bg-white/5 rounded-xl animate-pulse w-48" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Skeleton */}
        <div className="mb-12">
          <div className="h-10 bg-white/5 rounded-xl animate-pulse w-64 mb-4" />
          <div className="h-5 bg-white/5 rounded-xl animate-pulse w-96" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Fetch user sessions with error handling
async function getUserSessions(clerkId: string): Promise<DashboardSession[]> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) return [];

    let userSessions: DashboardSession[] = [];
    
    try {
      const result = await db.query.sessions.findMany({
        where: eq(sessions.userId, user.id),
        orderBy: [desc(sessions.createdAt)],
      });
      userSessions = result.map(s => ({
        ...s,
        id: s.id,
        userId: s.userId,
        status: s.status as DashboardSession['status'],
        fullName: safeDecrypt(s.fullName, clerkId),
        dateOfBirth: s.dateOfBirth,
        tentativeTime: s.tentativeTime,
        birthPlace: s.birthPlace,
        latitude: s.latitude,
        longitude: s.longitude,
        timezone: s.timezone,
        gender: s.gender || undefined,
        rectifiedTime: s.rectifiedTime || undefined,
        accuracy: s.accuracy || undefined,
        confidence: s.confidence || undefined,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        isFavorite: false,
        tags: [],
        analysisResult: undefined,
      })) as DashboardSession[];
    } catch (dbError: any) {
      // Fallback for missing columns
      if (dbError.message?.includes('forensicTraits') || dbError.message?.includes('no such column')) {
        console.log('[Dashboard] Using fallback query...');
        const { client } = await import('@/database/drizzle');
        const rawResult = await client.execute({
          sql: `SELECT * FROM sessions WHERE userId = ? ORDER BY createdAt DESC`,
          args: [user.id]
        });
        userSessions = rawResult.rows.map((s: any) => ({
          ...s,
          fullName: safeDecrypt(s.fullName, clerkId),
          isFavorite: false,
          tags: [],
          status: s.status || 'pending',
        })) as DashboardSession[];
      } else {
        throw dbError;
      }
    }

    return userSessions;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

// Main Dashboard Page Component
export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center bg-[#1A1F2E] border border-[#2A3442] rounded-2xl p-8 max-w-md">
            <h1 className="text-2xl font-bold text-[#F5F0EB] mb-4">Please Sign In</h1>
            <p className="text-[#8C7F72] mb-6">Access your dashboard to view and manage your birth time rectification sessions.</p>
            <Link
              href="/sign-in"
              className="inline-block bg-gradient-to-r from-[#D4AF37] to-[#E8C54D] text-[#0A0F1C] px-6 py-3 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const userSessions = await getUserSessions(user.id);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Layout>
        <div className="pt-8 pb-12">
          <DashboardClient
            initialSessions={userSessions}
            userName={user.firstName || 'User'}
          />
        </div>
      </Layout>
    </Suspense>
  );
}
