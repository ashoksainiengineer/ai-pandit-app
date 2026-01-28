/**
 * DashboardClient Component
 * Client-side dashboard with interactive features
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  Sparkles,
  Zap,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';

import {
  StatCard,
  ActivityHeatmap,
  InsightsPanel,
  SearchFilterBar,
  SessionCard,
  Pagination,
  BatchActionsToolbar,
  ViewToggle,
} from '@/components/dashboard';

import {
  useDashboard,
  useKeyboardShortcuts,
} from '@/lib/dashboard/hooks';

import { DashboardSession } from '@/lib/dashboard/types';

interface DashboardClientProps {
  initialSessions: DashboardSession[];
  userName: string;
}

export function DashboardClient({ initialSessions, userName }: DashboardClientProps) {
  const {
    filteredSessions,
    stats,
    filterState,
    sortState,
    pagination,
    preferences,
    selectedSessions,
    comparisonMode,
    insights,
    activity,
    isLoading,
    setFilter,
    setSort,
    setPagination,
    setPreferences,
    toggleFavorite,
    toggleSelection,
    selectAll,
    clearSelection,
    executeBatchOperation,
    refresh,
    clearFilters,
    toggleComparisonMode,
    dismissNotification,
    markAllNotificationsRead,
  } = useDashboard(initialSessions);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'r', ctrl: true, action: refresh },
    { key: 'n', ctrl: true, action: () => window.location.href = '/rectify' },
    { key: 'a', ctrl: true, action: selectAll },
    { key: 'Escape', action: clearSelection },
  ]);

  const totalPages = useMemo(() => 
    Math.ceil(pagination.totalCount / pagination.pageSize),
    [pagination.totalCount, pagination.pageSize]
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#F5F0EB] mb-2">
              Welcome back, {userName}! 👋
            </h1>
            <p className="text-[#8C7F72]">
              Track your birth time rectification analyses and discover cosmic insights
            </p>
          </div>
          
          <Link
            href="/rectify"
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[#D4AF37]/20"
          >
            <Sparkles className="w-5 h-5" />
            New Analysis
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
      >
        <StatCard
          title="Total Analyses"
          value={stats.totalAnalyses}
          icon={<BarChart3 className="w-6 h-6 text-[#D4AF37]" />}
          color="gold"
          trend={{ value: stats.weeklyGrowth, label: 'this week' }}
        />
        <StatCard
          title="Completed"
          value={stats.completedAnalyses}
          subtitle={`${Math.round((stats.completedAnalyses / Math.max(stats.totalAnalyses, 1)) * 100)}% success rate`}
          icon={<CheckCircle2 className="w-6 h-6 text-[#2D7A5C]" />}
          color="green"
        />
        <StatCard
          title="Processing"
          value={stats.processingAnalyses}
          icon={<Clock className="w-6 h-6 text-[#3B82F6]" />}
          color="blue"
        />
        <StatCard
          title="Avg Accuracy"
          value={`${stats.averageAccuracy}%`}
          trend={{ value: stats.highConfidenceRate - 50, label: 'confidence' }}
          icon={<Activity className="w-6 h-6 text-[#6A0572]" />}
          color="purple"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SearchFilterBar
              filterState={filterState}
              sortState={sortState}
              onFilterChange={setFilter}
              onSortChange={setSort}
              onClearFilters={clearFilters}
              resultCount={filteredSessions.length}
              totalCount={stats.totalAnalyses}
            />
          </motion.div>

          {/* View Toggle & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ViewToggle
                currentView={preferences.viewMode}
                onChange={(mode) => setPreferences({ viewMode: mode })}
              />
              
              {comparisonMode && (
                <span className="text-sm text-[#D4AF37]">
                  {selectedSessions.size} selected for comparison
                </span>
              )}
            </div>

            <button
              onClick={toggleComparisonMode}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                transition-colors
                ${comparisonMode 
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30' 
                  : 'text-[#8C7F72] hover:text-[#C4B8AD]'
                }
              `}
            >
              <Zap className="w-4 h-4" />
              Compare
            </button>
          </div>

          {/* Sessions List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            {filteredSessions.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-4">🔮</div>
                <h3 className="text-xl font-semibold text-[#F5F0EB] mb-2">
                  No sessions found
                </h3>
                <p className="text-[#8C7F72] mb-6">
                  {filterState.searchQuery || filterState.statusFilter.length > 0
                    ? 'Try adjusting your filters to see more results'
                    : 'Start your first birth time rectification analysis to discover your precise birth time.'}
                </p>
                {!filterState.searchQuery && filterState.statusFilter.length === 0 && (
                  <Link
                    href="/rectify"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Sparkles className="w-5 h-5" />
                    Start First Analysis
                  </Link>
                )}
              </div>
            ) : (
              <>
                {filteredSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SessionCard
                      session={session}
                      viewMode={preferences.viewMode}
                      isSelected={selectedSessions.has(session.id)}
                      isFavorite={session.isFavorite}
                      onSelect={comparisonMode ? toggleSelection : undefined}
                      onFavorite={toggleFavorite}
                    />
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>

          {/* Pagination */}
          {filteredSessions.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={totalPages}
              pageSize={pagination.pageSize}
              totalCount={pagination.totalCount}
              onPageChange={(page) => setPagination({ page })}
              onPageSizeChange={(size) => setPagination({ pageSize: size, page: 1 })}
            />
          )}
        </div>

        {/* Right Column - Analytics */}
        <div className="space-y-6">
          {/* Activity Heatmap */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ActivityHeatmap 
              data={activity}
              onDayClick={(date, count) => {
                console.log('Clicked date:', date, 'Sessions:', count);
              }}
            />
          </motion.div>

          {/* Insights Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <InsightsPanel
              insights={insights}
              onDismiss={dismissNotification}
              onDismissAll={markAllNotificationsRead}
            />
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-[#F5F0EB] mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#8C7F72]">Failed Analyses</span>
                <span className="text-[#EF4444] font-semibold">{stats.failedAnalyses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8C7F72]">Favorites</span>
                <span className="text-[#D4AF37] font-semibold">{stats.favoriteCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8C7F72]">High Confidence Rate</span>
                <span className="text-[#2D7A5C] font-semibold">{stats.highConfidenceRate}%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Batch Actions Toolbar */}
      <BatchActionsToolbar
        selectedCount={selectedSessions.size}
        onClearSelection={clearSelection}
        onSelectAll={selectAll}
        onBatchOperation={(op) => {
          const operation = {
            ...op,
            sessionIds: Array.from(selectedSessions),
          };
          executeBatchOperation(operation);
        }}
        totalCount={filteredSessions.length}
      />

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4 hidden lg:block">
        <div className="glass-card px-4 py-2 text-xs text-[#8C7F72]">
          <span className="font-medium">Shortcuts:</span>{' '}
          <kbd className="px-1.5 py-0.5 bg-[#151a21] rounded">Ctrl+K</kbd> Search{' '}
          <kbd className="px-1.5 py-0.5 bg-[#151a21] rounded">Ctrl+R</kbd> Refresh{' '}
          <kbd className="px-1.5 py-0.5 bg-[#151a21] rounded">Ctrl+N</kbd> New
        </div>
      </div>
    </div>
  );
}
