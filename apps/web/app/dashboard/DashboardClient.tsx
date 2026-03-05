'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
// import { motion } from 'framer-motion';
import { Sparkles, Search, BarChart3, CheckCircle2, Activity } from 'lucide-react';
import { DashboardSession } from '@/lib/dashboard/types';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { Breadcrumbs, predefinedBreadcrumbs } from '@/components/ui/Breadcrumbs';

interface DashboardClientProps {
  initialSessions: DashboardSession[];
  userName: string;
}

const ITEMS_PER_PAGE = 10;

interface DashboardStats {
  total: number;
  completed: number;
  accuracy: number;
}

function calculateStats(sessions: DashboardSession[]): DashboardStats {
  const completed = sessions.filter(s => s.status === 'complete');
  const avgAccuracy = completed.length > 0
    ? Math.round(completed.reduce((acc, s) => acc + (Number(s.confidence) || 0), 0) / completed.length)
    : 0;

  return {
    total: sessions.length,
    completed: completed.length,
    accuracy: avgAccuracy
  };
}

const StatCard = memo(function StatCard({
  icon,
  value,
  label
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="bg-white border border-[#F0E8DE] rounded-xl p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-[#F5EFE7] rounded-lg">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-lg sm:text-2xl font-bold text-[#1A1612]">{value}</div>
          <div className="text-xs sm:text-sm text-[#7A756F] truncate">{label}</div>
        </div>
      </div>
    </div>
  );
});

export function DashboardClient({ initialSessions, userName }: DashboardClientProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const stats = useMemo(() => calculateStats(sessions), [sessions]);

  const handleDeleteSession = useCallback((deletedId: string) => {
    setSessions(prev => prev.filter(s => s.id !== deletedId));
  }, []);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(session =>
      session.fullName?.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24">
      {/* Breadcrumbs */}
      <Breadcrumbs items={predefinedBreadcrumbs.dashboard()} className="mb-4" />

      {/* Header - Mobile Responsive */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
      >
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-[#1A1612] font-[family-name:var(--font-cormorant)]">
            Welcome, {userName}
          </h1>
          <p className="text-sm sm:text-base text-[#7A756F] mt-1">
            Manage your BTR sessions
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/rectify?new=true"
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-[#B8860B] text-[#B8860B] rounded-xl font-semibold hover:bg-[#B8860B]/10 transition-all text-xs sm:text-sm"
          >
            + New Person
          </Link>
          <Link
            href="/rectify"
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#B8860B] to-[#78611D] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#B8860B]/20 transition-all text-sm sm:text-base"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            Continue Analysis
          </Link>
        </div>
      </div>

      {/* Stats - Mobile Responsive Grid */}
      <div
        className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <StatCard
          icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#B8860B]" />}
          value={stats.total}
          label="Total"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#184131]" />}
          value={stats.completed}
          label="Done"
        />
        <StatCard
          icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#6B9AC4]" />}
          value={`${stats.accuracy}%`}
          label="Accuracy"
        />
      </div>

      {/* Search */}
      <div
        className="relative mb-6"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A756F]" />
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full pl-12 pr-4 py-3 bg-white border border-[#E8E0D5] rounded-xl text-[#1A1612] placeholder-[#A8A39D] focus:border-[#78611D] focus:ring-2 focus:ring-[#78611D]/10 outline-none transition-all"
        />
      </div>

      {/* Sessions List */}
      <div
        className="space-y-3"
      >

        {paginatedSessions.length === 0 ? (
          <div className="bg-white border border-[#F0E8DE] rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🔮</div>
            <h3 className="text-xl font-semibold text-[#1A1612] mb-2">
              {searchQuery ? 'No matches found' : 'No sessions yet'}
            </h3>
            <p className="text-[#7A756F] mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Start your first birth time rectification analysis'}
            </p>
            {!searchQuery && (
              <Link
                href="/rectify?new=true"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#B8860B] to-[#78611D] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-5 h-5" />
                Start First Analysis
              </Link>
            )}
          </div>
        ) : (
          paginatedSessions.map((session, index) => (
            <div
              key={session.id}
            >
              <SessionCard
                session={session}
                viewMode="list"
                isSelected={false}
                isFavorite={false}
                onDelete={handleDeleteSession}
              />
            </div>
          ))
        )}
      </div>

      {/* Pagination - Mobile Responsive */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6 sm:mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#7A756F] hover:text-[#1A1612] disabled:opacity-30 transition-colors"
          >
            <span className="sm:hidden">←</span>
            <span className="hidden sm:inline">Previous</span>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors ${currentPage === page
                ? 'bg-[#B8860B] text-white'
                : 'text-[#7A756F] hover:bg-[#F5EFE7]'
                }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#7A756F] hover:text-[#1A1612] disabled:opacity-30 transition-colors"
          >
            <span className="sm:hidden">→</span>
            <span className="hidden sm:inline">Next</span>
          </button>
        </div>
      )}
    </div>
  );
}
