/**
 * Enhanced Dashboard Page
 * Sacred Ivory Light Theme - Heavy user experience with analytics, filtering, and advanced features
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { sessions, users } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';
import { decrypt, isEncrypted, initializeEncryption } from '@/lib/crypto';
import { DashboardSession } from '@/lib/dashboard/types';
import { DashboardClient } from './DashboardClient';
import Layout from '@/components/Layout';

// Initialize encryption with the secret from environment variables.
initializeEncryption(process.env.ENCRYPTION_SECRET);

// Helper to safely decrypt data, returning a fallback string on failure.
const safeDecrypt = (data: string | null | undefined, fallback = 'Decryption Failed'): string => {
    if (!data || !isEncrypted(data)) return data || fallback;
    try {
        return decrypt(data);
    } catch (error) {
        console.error('Dashboard decryption failed:', error);
        return fallback;
    }
};

// Loading skeleton for the dashboard
function DashboardSkeleton() {
  return (
    <Layout hideNavbar hideFooter>
      {/* Nav Skeleton */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#F0E8DE]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="h-10 bg-[#F5EFE7] rounded-xl animate-pulse w-48" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Skeleton */}
        <div className="mb-12">
          <div className="h-10 bg-[#F5EFE7] rounded-xl animate-pulse w-64 mb-4" />
          <div className="h-5 bg-[#F5EFE7] rounded-xl animate-pulse w-96" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[#F5EFE7] rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-[#F5EFE7] rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-[#F5EFE7] rounded-2xl animate-pulse" />
            <div className="h-48 bg-[#F5EFE7] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Fetch user sessions with error handling
async function getUserSessions(clerkId: string, clerkUser?: any): Promise<DashboardSession[]> {
  try {
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    // 🔄 SELF-HEALING: If user doesn't exist in DB, create them now
    if (!user && clerkUser) {
      console.log(`🔄 [Dashboard] Syncing missing user to DB: ${clerkId}`);
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null;

      const newUserId = crypto.randomUUID();
      await db.insert(users).values({
        id: newUserId,
        clerkId: clerkId,
        email: email,
        fullName: fullName, // Note: This is plaintext, as per schema design for users table
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      user = { id: newUserId, clerkId, email, fullName } as any;
    }

    if (!user) return [];

    let userSessions: DashboardSession[] = [];

    try {
      const result = await db.query.sessions.findMany({
        where: eq(sessions.clerkId, clerkId),
        orderBy: [desc(sessions.createdAt)],
      });
      userSessions = result.map(s => ({
        ...s,
        id: s.id,
        userId: s.userId,
        status: s.status as DashboardSession['status'],
        fullName: safeDecrypt(s.fullName, 'Unencryptable Session'),
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
          sql: `SELECT * FROM sessions WHERE clerkId = ? ORDER BY createdAt DESC`,
          args: [clerkId]
        });
        userSessions = rawResult.rows.map((s: any) => ({
          ...s,
          fullName: safeDecrypt(s.fullName, 'Unencryptable Session'),
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
      <Layout hideFooter>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center bg-white border border-[#F0E8DE] rounded-2xl p-8 max-w-md shadow-lg">
            <h1 className="text-2xl font-bold text-[#1A1612] mb-4 font-[family-name:var(--font-cormorant)]">Please Sign In</h1>
            <p className="text-[#7A756F] mb-6">Access your dashboard to view and manage your birth time rectification sessions.</p>
            <Link
              href="/sign-in"
              className="inline-block bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(184,134,11,0.4)] transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const userSessions = await getUserSessions(user.id, user);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Layout hideFooter>
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
