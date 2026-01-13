/**
 * Session Manager for BTR System
 *
 * This module handles user data persistence across page refreshes
 * using localStorage with proper session management.
 */

import { useState, useEffect } from 'react';
import type { BirthData, PhysicalDescription, LifeEvent } from '@/types';

export interface BTRSession {
  id: string;
  birthData: Partial<BirthData>;
  physicalDescription: Partial<PhysicalDescription>;
  lifeEvents: LifeEvent[];
  currentStep: number;
  createdAt: string;
  lastUpdated: string;
  isComplete: boolean;
}

export interface SessionConfig {
  maxSessions: number;
  sessionExpiryHours: number;
  autoSaveInterval: number;
}

const DEFAULT_CONFIG: SessionConfig = {
  maxSessions: 5, // Keep last 5 sessions
  sessionExpiryHours: 24 * 7, // 7 days
  autoSaveInterval: 30000, // Auto-save every 30 seconds
};

const STORAGE_KEYS = {
  CURRENT_SESSION: 'btr_current_session',
  SESSION_LIST: 'btr_sessions_list',
  SESSION_CONFIG: 'btr_session_config',
};

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `btr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current timestamp
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Check if session has expired
 */
function isSessionExpired(session: BTRSession, expiryHours: number): boolean {
  const lastUpdated = new Date(session.lastUpdated);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
  return hoursDiff > expiryHours;
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions(sessions: BTRSession[], expiryHours: number): BTRSession[] {
  return sessions.filter(session => !isSessionExpired(session, expiryHours));
}

/**
 * Keep only the most recent sessions
 */
function keepRecentSessions(sessions: BTRSession[], maxCount: number): BTRSession[] {
  return sessions
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, maxCount);
}

/**
 * Session Manager Class
 */
export class SessionManager {
  private config: SessionConfig;
  private currentSession: BTRSession | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadCurrentSession();
    this.startAutoSave();
  }

  /**
   * Create a new session
   */
  createNewSession(): BTRSession {
    const session: BTRSession = {
      id: generateSessionId(),
      birthData: {},
      physicalDescription: {},
      lifeEvents: [],
      currentStep: 1,
      createdAt: getCurrentTimestamp(),
      lastUpdated: getCurrentTimestamp(),
      isComplete: false,
    };

    this.currentSession = session;
    this.saveCurrentSession();
    return session;
  }

  /**
   * Get current session
   */
  getCurrentSession(): BTRSession | null {
    return this.currentSession;
  }

  /**
   * Update current session data
   */
  updateSession(
    birthData?: Partial<BirthData>,
    physicalDescription?: Partial<PhysicalDescription>,
    lifeEvents?: LifeEvent[],
    currentStep?: number,
    isComplete?: boolean
  ): void {
    if (!this.currentSession) {
      this.createNewSession();
    }

    if (birthData) {
      this.currentSession!.birthData = { ...this.currentSession!.birthData, ...birthData };
    }

    if (physicalDescription) {
      this.currentSession!.physicalDescription = { 
        ...this.currentSession!.physicalDescription, 
        ...physicalDescription 
      };
    }

    if (lifeEvents) {
      this.currentSession!.lifeEvents = lifeEvents;
    }

    if (currentStep !== undefined) {
      this.currentSession!.currentStep = currentStep;
    }

    if (isComplete !== undefined) {
      this.currentSession!.isComplete = isComplete;
    }

    this.currentSession!.lastUpdated = getCurrentTimestamp();
    this.saveCurrentSession();
  }

  /**
   * Save current session to localStorage
   */
  private saveCurrentSession(): void {
    if (this.currentSession) {
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(this.currentSession));
        this.updateSessionList();
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  }

  /**
   * Load current session from localStorage
   */
  private loadCurrentSession(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (stored) {
        const session = JSON.parse(stored) as BTRSession;
        
        // Check if session has expired
        if (!isSessionExpired(session, this.config.sessionExpiryHours)) {
          this.currentSession = session;
        } else {
          // Session expired, create new one
          this.createNewSession();
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      this.createNewSession();
    }
  }

  /**
   * Update session list in localStorage
   */
  private updateSessionList(): void {
    try {
      const sessions = this.getAllSessions();
      const updatedSessions = this.currentSession 
        ? [this.currentSession, ...sessions.filter(s => s.id !== this.currentSession!.id)]
        : sessions;

      // Clean up and keep only recent sessions
      const cleanedSessions = cleanupExpiredSessions(updatedSessions, this.config.sessionExpiryHours);
      const finalSessions = keepRecentSessions(cleanedSessions, this.config.maxSessions);

      localStorage.setItem(STORAGE_KEYS.SESSION_LIST, JSON.stringify(finalSessions));
    } catch (error) {
      console.error('Failed to update session list:', error);
    }
  }

  /**
   * Get all sessions
   */
  getAllSessions(): BTRSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION_LIST);
      if (stored) {
        const sessions = JSON.parse(stored) as BTRSession[];
        return cleanupExpiredSessions(sessions, this.config.sessionExpiryHours);
      }
    } catch (error) {
      console.error('Failed to get sessions:', error);
    }
    return [];
  }

  /**
   * Load a specific session
   */
  loadSession(sessionId: string): BTRSession | null {
    const sessions = this.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (session) {
      this.currentSession = session;
      this.saveCurrentSession();
      return session;
    }
    
    return null;
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): void {
    try {
      const sessions = this.getAllSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      
      localStorage.setItem(STORAGE_KEYS.SESSION_LIST, JSON.stringify(filteredSessions));
      
      // If we're deleting the current session, create a new one
      if (this.currentSession?.id === sessionId) {
        this.createNewSession();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      localStorage.removeItem(STORAGE_KEYS.SESSION_LIST);
      this.currentSession = null;
      this.createNewSession();
    } catch (error) {
      console.error('Failed to clear sessions:', error);
    }
  }

  /**
   * Start auto-save functionality
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      if (this.currentSession) {
        this.saveCurrentSession();
      }
    }, this.config.autoSaveInterval);
  }

  /**
   * Stop auto-save functionality
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Export session data
   */
  exportSession(): string | null {
    if (!this.currentSession) return null;
    
    try {
      return JSON.stringify(this.currentSession, null, 2);
    } catch (error) {
      console.error('Failed to export session:', error);
      return null;
    }
  }

  /**
   * Import session data
   */
  importSession(sessionData: string): boolean {
    try {
      const session = JSON.parse(sessionData) as BTRSession;
      
      // Validate session structure
      if (!session.id || !session.createdAt) {
        throw new Error('Invalid session data');
      }

      this.currentSession = session;
      this.saveCurrentSession();
      return true;
    } catch (error) {
      console.error('Failed to import session:', error);
      return false;
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalSessions: number;
    currentSessionAge: number;
    averageSessionDuration: number;
    completionRate: number;
  } {
    const sessions = this.getAllSessions();
    const totalSessions = sessions.length;
    
    const completedSessions = sessions.filter(s => s.isComplete).length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    let totalDuration = 0;
    sessions.forEach(session => {
      const created = new Date(session.createdAt);
      const updated = new Date(session.lastUpdated);
      totalDuration += updated.getTime() - created.getTime();
    });

    const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    const currentSessionAge = this.currentSession 
      ? new Date().getTime() - new Date(this.currentSession.createdAt).getTime()
      : 0;

    return {
      totalSessions,
      currentSessionAge,
      averageSessionDuration,
      completionRate
    };
  }
}

/**
 * Global session manager instance
 */
let globalSessionManager: SessionManager | null = null;

/**
 * Get or create global session manager
 */
export function getSessionManager(): SessionManager {
  if (!globalSessionManager) {
    globalSessionManager = new SessionManager();
  }
  return globalSessionManager;
}

/**
 * Initialize session manager with custom config
 */
export function initializeSessionManager(config: Partial<SessionConfig> = {}): SessionManager {
  globalSessionManager = new SessionManager(config);
  return globalSessionManager;
}

/**
 * Hook for React components to use session manager
 */
export function useSessionManager(): SessionManager {
  const [sessionManager] = useState<SessionManager>(() => getSessionManager());
  return sessionManager;
}

/**
 * Auto-save hook for React components
 */
export function useAutoSave(
  birthData: Partial<BirthData>,
  physicalDescription: Partial<PhysicalDescription>,
  lifeEvents: LifeEvent[],
  currentStep: number,
  isComplete: boolean
): void {
  const sessionManager = useSessionManager();

  useEffect(() => {
    if (sessionManager) {
      sessionManager.updateSession(birthData, physicalDescription, lifeEvents, currentStep, isComplete);
    }
  }, [birthData, physicalDescription, lifeEvents, currentStep, isComplete, sessionManager]);
}