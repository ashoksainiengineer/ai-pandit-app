'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { DashboardClient } from './DashboardClient';
import { DashboardSession } from '@/lib/dashboard/types';
import { DashboardSkeleton } from './DashboardSkeleton';

interface Props {
  clerkId: string;
  userName: string;
}

export function DashboardContent({ clerkId, userName }: Props) {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<DashboardSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token = await getToken();
        const res = await fetch(`/api/sessions`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error('Failed to load sessions');
        const data = await res.json();
        if (!cancelled) setSessions(data.data ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    load();
    return () => { cancelled = true; };
  }, [clerkId, getToken]);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-black/60 mb-4">Failed to load dashboard.</p>
        <button
          onClick={() => { setError(null); setSessions(null); }}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!sessions) return <DashboardSkeleton />;

  return <DashboardClient initialSessions={sessions} userName={userName} />;
}
