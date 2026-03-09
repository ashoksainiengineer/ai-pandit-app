/**
 * Dashboard Custom Hooks
 * Production-grade hooks for state management and side effects
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  DashboardSession,
  DashboardStats,
  FilterState,
  SortState,
  PaginationState,
  DashboardPreferences,
  SessionComparison,
  ExportOptions,
  BatchOperation,
  InsightItem,
  SessionStatus,
  NotificationItem,
  ViewMode,
} from './types';

const DEFAULT_PREFERENCES: DashboardPreferences = {
  viewMode: 'list',
  pageSize: 10,
  defaultSort: { field: 'createdAt', order: 'desc' },
  showAnalytics: true,
  compactMode: false,
  autoRefresh: true,
  refreshInterval: 30000,
};

const DEFAULT_FILTER: FilterState = {
  searchQuery: '',
  statusFilter: [],
  confidenceFilter: [],
  dateRange: {},
  hasResults: null,
  favoritesOnly: false,
};

interface UseDashboardReturn {
  sessions: DashboardSession[];
  filteredSessions: DashboardSession[];
  stats: DashboardStats;
  filterState: FilterState;
  sortState: SortState;
  pagination: PaginationState;
  preferences: DashboardPreferences;
  selectedSessions: Set<string>;
  comparisonMode: boolean;
  insights: InsightItem[];
  notifications: NotificationItem[];
  isLoading: boolean;
  error: Error | null;
  activity: { date: string; count: number; intensity: number }[];

  // Actions
  setFilter: (filter: Partial<FilterState>) => void;
  setSort: (sort: SortState) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setPreferences: (prefs: Partial<DashboardPreferences>) => void;
  toggleFavorite: (sessionId: string) => Promise<void>;
  toggleSelection: (sessionId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  executeBatchOperation: (operation: BatchOperation) => Promise<void>;
  refresh: () => Promise<void>;
  exportSessions: (options: ExportOptions) => Promise<void>;
  compareSessions: (sessionIds: string[]) => SessionComparison;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  toggleComparisonMode: () => void;
  clearFilters: () => void;
  getSessionById: (id: string) => DashboardSession | undefined;
}

export function useDashboard(initialSessions: DashboardSession[]): UseDashboardReturn {
  const router = useRouter();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Core state
  const [sessions, setSessions] = useState<DashboardSession[]>(initialSessions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // UI state
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER);
  const [sortState, setSortState] = useState<SortState>(DEFAULT_PREFERENCES.defaultSort);
  const [pagination, setPaginationState] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PREFERENCES.pageSize,
    totalCount: initialSessions.length,
  });
  const [preferences, setPreferencesState] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [comparisonMode, setComparisonMode] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dashboardPreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferencesState(prev => ({ ...prev, ...parsed }));
      } catch {
        console.warn('Failed to load dashboard preferences');
      }
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardPreferences', JSON.stringify(preferences));
  }, [preferences]);


  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions');
      if (!response.ok) throw new Error('Failed to refresh');
      const data = await response.json();
      setSessions(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Refresh failed'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh logic
  useEffect(() => {
    if (!preferences.autoRefresh) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    refreshTimerRef.current = setInterval(() => {
      refresh();
    }, preferences.refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [preferences.autoRefresh, preferences.refreshInterval, refresh]);

  // Compute filtered and sorted sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Search filter
    if (filterState.searchQuery) {
      const query = filterState.searchQuery.toLowerCase();
      result = result.filter(s =>
        s.fullName?.toLowerCase().includes(query) ||
        s.birthPlace?.toLowerCase().includes(query) ||
        s.id?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterState.statusFilter.length > 0) {
      result = result.filter(s => filterState.statusFilter.includes(s.status as SessionStatus));
    }

    // Confidence filter
    if (filterState.confidenceFilter.length > 0) {
      result = result.filter(s =>
        s.confidence && filterState.confidenceFilter.includes(s.confidence)
      );
    }

    // Date range filter
    if (filterState.dateRange.from) {
      result = result.filter(s => new Date(s.createdAt) >= filterState.dateRange.from!);
    }
    if (filterState.dateRange.to) {
      result = result.filter(s => new Date(s.createdAt) <= filterState.dateRange.to!);
    }

    // Has results filter
    if (filterState.hasResults !== null) {
      result = result.filter(s =>
        filterState.hasResults ? !!s.rectifiedTime : !s.rectifiedTime
      );
    }

    // Favorites filter
    if (filterState.favoritesOnly) {
      result = result.filter(s => s.isFavorite);
    }

    // Sorting
    result.sort((a, b) => {
      const order = sortState.order === 'asc' ? 1 : -1;

      switch (sortState.field) {
        case 'createdAt':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
        case 'fullName':
          return (a.fullName || '').localeCompare(b.fullName || '') * order;
        case 'status':
          return (a.status || '').localeCompare(b.status || '') * order;
        case 'confidence':
          const confOrder = { 'god-tier': 4, 'high': 3, 'medium': 2, 'low': 1 };
          const confA = confOrder[a.confidence as keyof typeof confOrder] || 0;
          const confB = confOrder[b.confidence as keyof typeof confOrder] || 0;
          return (confA - confB) * order;
        case 'accuracy':
          return ((a.accuracy || 0) - (b.accuracy || 0)) * order;
        default:
          return 0;
      }
    });

    return result;
  }, [sessions, filterState, sortState]);

  // Paginated sessions
  const paginatedSessions = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredSessions.slice(start, end);
  }, [filteredSessions, pagination]);

  // Update pagination total count
  useEffect(() => {
    setPaginationState(prev => ({ ...prev, totalCount: filteredSessions.length }));
  }, [filteredSessions.length]);

  // Compute stats
  const stats = useMemo((): DashboardStats => {
    const total = sessions.length;
    const completed = sessions.filter(s => s.status === 'complete').length;
    const processing = sessions.filter(s => s.status === 'processing').length;
    const failed = sessions.filter(s => s.status === 'failed').length;
    const favorites = sessions.filter(s => s.isFavorite).length;

    const completedSessions = sessions.filter(s => s.status === 'complete' && s.accuracy);
    const avgAccuracy = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / completedSessions.length
      : 0;

    const highConfCount = sessions.filter(s =>
      s.confidence === 'high' || s.confidence === 'god-tier'
    ).length;

    // Calculate weekly growth
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekCount = sessions.filter(s => new Date(s.createdAt) >= oneWeekAgo).length;
    const weeklyGrowth = total > 0 ? (thisWeekCount / total) * 100 : 0;

    return {
      totalAnalyses: total,
      completedAnalyses: completed,
      processingAnalyses: processing,
      failedAnalyses: failed,
      averageAccuracy: Math.round(avgAccuracy * 100) / 100,
      highConfidenceRate: total > 0 ? Math.round((highConfCount / total) * 100) : 0,
      totalProcessingTime: 0,
      weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
      favoriteCount: favorites,
    };
  }, [sessions]);

  // Compute activity heatmap data
  const activity = useMemo(() => {
    const last90Days = Array.from({ length: 90 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last90Days.map(date => {
      const daySessions = sessions.filter(s => s.createdAt.startsWith(date));
      const count = daySessions.length;
      const completed = daySessions.filter(s => s.status === 'complete').length;

      // Calculate intensity (0-4)
      let intensity = 0;
      if (count > 0) intensity = 1;
      if (count >= 2) intensity = 2;
      if (count >= 4) intensity = 3;
      if (count >= 6) intensity = 4;

      return { date, count, intensity, completed };
    });
  }, [sessions]);

  // Generate insights
  const insights = useMemo((): InsightItem[] => {
    const items: InsightItem[] = [];

    // Achievement insight
    if (stats.completedAnalyses >= 5) {
      items.push({
        id: 'achievement-5',
        type: 'achievement',
        title: '🏆 Analysis Master',
        description: `You've completed ${stats.completedAnalyses} analyses. Keep up the great work!`,
        icon: '🏆',
        priority: 'high',
      });
    }

    // Trend insight
    if (stats.weeklyGrowth > 20) {
      items.push({
        id: 'trend-growth',
        type: 'trend',
        title: '📈 Usage Surge',
        description: `Your activity has increased by ${stats.weeklyGrowth}% this week.`,
        icon: '📈',
        priority: 'medium',
      });
    }

    // Pattern insight
    const failedRate = stats.totalAnalyses > 0 ? (stats.failedAnalyses / stats.totalAnalyses) * 100 : 0;
    if (failedRate > 20) {
      items.push({
        id: 'pattern-failures',
        type: 'pattern',
        title: '⚠️ High Failure Rate',
        description: `${Math.round(failedRate)}% of your analyses have failed. Consider reviewing your input data.`,
        icon: '⚠️',
        priority: 'high',
        actionable: true,
        actionLabel: 'View Failed',
        actionHref: '?status=failed',
      });
    }

    // Suggestion insight
    if (stats.totalAnalyses > 0 && stats.averageAccuracy < 70) {
      items.push({
        id: 'suggestion-accuracy',
        type: 'suggestion',
        title: '💡 Improve Accuracy',
        description: 'Add more life events to your analyses for better accuracy.',
        icon: '💡',
        priority: 'medium',
        actionable: true,
        actionLabel: 'Learn More',
        actionHref: '/guide',
      });
    }

    return items;
  }, [stats]);

  // Actions
  const setFilter = useCallback((filter: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...filter }));
    setPaginationState(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const setSort = useCallback((sort: SortState) => {
    setSortState(sort);
  }, []);

  const setPagination = useCallback((paginationUpdate: Partial<PaginationState>) => {
    setPaginationState(prev => ({ ...prev, ...paginationUpdate }));
  }, []);

  const setPreferences = useCallback((prefs: Partial<DashboardPreferences>) => {
    setPreferencesState(prev => ({ ...prev, ...prefs }));
  }, []);

  const toggleFavorite = useCallback(async (sessionId: string) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, isFavorite: !s.isFavorite } : s
    ));

    try {
      // API call would go here
      await fetch(`/api/sessions/${sessionId}/favorite`, { method: 'POST' });
    } catch (err) {
      // Revert on error
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, isFavorite: !s.isFavorite } : s
      ));
      setError(err instanceof Error ? err : new Error('Failed to toggle favorite'));
    }
  }, []);

  const toggleSelection = useCallback((sessionId: string) => {
    setSelectedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedSessions(new Set(paginatedSessions.map(s => s.id)));
  }, [paginatedSessions]);

  const clearSelection = useCallback(() => {
    setSelectedSessions(new Set());
  }, []);

  const toggleComparisonMode = useCallback(() => {
    setComparisonMode(prev => !prev);
    if (comparisonMode) {
      clearSelection();
    }
  }, [comparisonMode, clearSelection]);

  const clearFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTER);
    setPaginationState(prev => ({ ...prev, page: 1 }));
  }, []);



  const executeBatchOperation = useCallback(async (operation: BatchOperation) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation),
      });

      if (!response.ok) throw new Error('Batch operation failed');

      // Refresh after batch operation
      await refresh();
      clearSelection();

      // Add notification
      const notification: NotificationItem = {
        id: Date.now().toString(),
        type: 'success',
        title: 'Batch Operation Complete',
        message: `Successfully processed ${operation.sessionIds.length} sessions`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications(prev => [notification, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Batch operation failed'));
    } finally {
      setIsLoading(false);
    }
  }, [refresh, clearSelection]);

  const exportSessions = useCallback(async (options: ExportOptions) => {
    try {
      const response = await fetch('/api/sessions/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sessions-export-${new Date().toISOString().split('T')[0]}.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'));
    }
  }, []);

  const compareSessions = useCallback((sessionIds: string[]): SessionComparison => {
    const selected = sessions.filter(s => sessionIds.includes(s.id));

    const differences: Record<string, { values: unknown[]; isDifferent: boolean }> = {};
    const fields = ['fullName', 'dateOfBirth', 'birthPlace', 'rectifiedTime', 'confidence', 'accuracy'];

    fields.forEach(field => {
      const values = selected.map(s => s[field as keyof DashboardSession]);
      const isDifferent = new Set(values).size > 1;
      differences[field] = { values, isDifferent };
    });

    const similarities = fields.filter(f => !differences[f].isDifferent);

    return { sessions: selected, differences, similarities };
  }, [sessions]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const getSessionById = useCallback((id: string) => {
    return sessions.find(s => s.id === id);
  }, [sessions]);

  return {
    sessions,
    filteredSessions: paginatedSessions,
    stats,
    filterState,
    sortState,
    pagination,
    preferences,
    selectedSessions,
    comparisonMode,
    insights,
    notifications,
    isLoading,
    error,
    activity,

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
    exportSessions,
    compareSessions,
    dismissNotification,
    markAllNotificationsRead,
    toggleComparisonMode,
    clearFilters,
    getSessionById,
  };
}

export function useKeyboardShortcuts(shortcuts: { key: string; ctrl?: boolean; action: () => void }[]) {
  const shortcutsKey = shortcuts.map(s => s.key + (s.ctrl ? '-ctrl' : '')).join(',');

  const memoizedShortcuts = useMemo(() => shortcuts, [shortcutsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- shortcutsKey is derived from shortcuts

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      memoizedShortcuts.forEach(({ key, ctrl, action }) => {
        if (e.key.toLowerCase() === key.toLowerCase() && (!ctrl || e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          action();
        }
      });
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [memoizedShortcuts]);
}

export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handler = () => {
      const position = window.scrollY;
      setScrollPosition(position);
      setIsScrolled(position > 50);
    };

    window.addEventListener('scroll', handler, { passive: true });
    handler();

    return () => window.removeEventListener('scroll', handler);
  }, []);

  return { scrollPosition, isScrolled };
}
