/**
 * Enhanced Dashboard Page
 * Heavy user experience with analytics, filtering, and advanced features
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { sessions, users } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';
import { safeDecrypt } from '@/lib/crypto';
import { DashboardSession } from '@/lib/dashboard/types';
import { DashboardClient } from './DashboardClient';

// Loading skeleton for the dashboard
function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-[#0F1419]">
      {/* Nav Skeleton */}
      <nav className="sticky top-0 z-50 bg-[#0F1419]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
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
    </main>
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
      <main className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#F5F0EB] mb-4">Please Sign In</h1>
          <Link 
            href="/sign-in" 
            className="inline-block bg-[#D4AF37] text-[#0F1419] px-6 py-3 rounded-xl font-semibold"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  const userSessions = await getUserSessions(user.id);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <main className="min-h-screen bg-[#0F1419]">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-[#0F1419]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F5D061] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">
                <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">🕉️</span>
              </div>
              <span className="font-bold text-xl text-[#D4AF37] tracking-tight">AI Pandit</span>
            </Link>

            <div className="flex items-center gap-6">
              <Link 
                href="/rectify" 
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors border border-[#D4AF37]/20"
              >
                <span>✨</span>
                <span className="font-medium">New Analysis</span>
              </Link>
              
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10 border-2 border-[#D4AF37]/50'
                  }
                }}
              />
            </div>
          </div>
        </nav>

        <DashboardClient 
          initialSessions={userSessions} 
          userName={user.firstName || 'User'}
        />
      </main>
    </Suspense>
  );
}
