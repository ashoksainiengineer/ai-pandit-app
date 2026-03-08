/**
 * Enhanced Dashboard Page
 * Sacred Ivory Light Theme - Heavy user experience with analytics, filtering, and advanced features
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { currentUser } from '@clerk/nextjs/server';
import { env } from '@/lib/config/env';
import { db } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { eq, desc } from 'drizzle-orm';
import { isEncrypted, parseSensitiveField, initializeEncryption } from '@/lib/crypto';
import { DashboardSession } from '@/lib/dashboard/types';
import { DashboardClient } from './DashboardClient';
import Layout from '@/components/Layout';

// Initialize encryption for server-side decryption
initializeEncryption(env.security.encryptionSecret);

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
      try {
        console.log(`🔄 [Dashboard] Syncing missing user to DB: ${clerkId}`);
        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null;

        const newUserId = uuidv4();
        await db.insert(users).values({
          id: newUserId,
          clerkId: clerkId,
          email: email,
          fullName: fullName, // Note: This is plaintext, as per schema design for users table
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        user = { id: newUserId, clerkId, email, fullName } as any;
      } catch (syncError) {
        console.error('❌ [Dashboard] User sync failed:', syncError);
        // If sync fails, we still want to try to continue if user was found in some other way, 
        // but here user is definitely null, so we'll just return [] to prevent crash.
        return [];
      }
    }

    if (!user) return [];

    let userSessions: DashboardSession[] = [];

    try {
      // Primary path: sessions keyed by clerkId
      const byClerkId = await db.query.sessions.findMany({
        where: eq(sessions.clerkId, clerkId),
        orderBy: [desc(sessions.createdAt)],
      });

      // Fallback path: legacy/migrated rows may have reliable userId but stale clerkId
      const result = (byClerkId.length === 0 && user?.id)
        ? await db.query.sessions.findMany({
          where: eq(sessions.userId, user.id),
          orderBy: [desc(sessions.createdAt)],
        })
        : byClerkId;

      userSessions = result.map(s => ({
        ...s,
        id: s.id,
        userId: s.userId,
        status: s.status as DashboardSession['status'],
        fullName: parseSensitiveField(s.fullName, 'Unencryptable Session'),
        dateOfBirth: parseSensitiveField(s.dateOfBirth, 'Not set'),
        tentativeTime: parseSensitiveField(s.tentativeTime, 'Not set'),
        birthPlace: parseSensitiveField(s.birthPlace, 'Unknown'),
        offsetConfig: parseSensitiveField(s.offsetConfig, null),
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
        const { client } = await import('@ai-pandit/db');
        const rawResult = await client.execute({
          sql: `SELECT * FROM sessions WHERE clerkId = ? ORDER BY createdAt DESC`,
          args: [clerkId]
        });
        userSessions = rawResult.rows.map((s: any) => ({
          ...s,
          fullName: parseSensitiveField(s.fullName, 'Unencryptable Session'),
          dateOfBirth: parseSensitiveField(s.dateOfBirth, 'Not set'),
          tentativeTime: parseSensitiveField(s.tentativeTime, 'Not set'),
          birthPlace: parseSensitiveField(s.birthPlace, 'Unknown'),
          offsetConfig: parseSensitiveField(s.offsetConfig, null),
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
              className="inline-block bg-gradient-to-r from-[#B8860B] to-[#78611D] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(184,134,11,0.4)] transition-all"
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
