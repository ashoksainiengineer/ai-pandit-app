/**
 * React Hooks for Session Management
 * 
 * Provides React hooks for managing BTR session data with automatic persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { SessionManager, getSessionManager } from './sessionManager';
import type { BirthData, PhysicalDescription, LifeEvent } from '@/types';

/**
 * Hook to manage session state with React integration
 */
export function useSessionState() {
  const [sessionManager] = useState<SessionManager>(() => getSessionManager());
  const [session, setSession] = useState(() => sessionManager.getCurrentSession());

  // Update session state when manager changes
  useEffect(() => {
    const updateSession = () => {
      setSession(sessionManager.getCurrentSession());
    };

    // Listen for session changes
    const originalUpdate = sessionManager.updateSession.bind(sessionManager);
    sessionManager.updateSession = function(...args) {
      originalUpdate(...args);
      updateSession();
    };

    updateSession();
  }, [sessionManager]);

  const updateSession = useCallback((
    birthData?: Partial<BirthData>,
    physicalDescription?: Partial<PhysicalDescription>,
    lifeEvents?: LifeEvent[],
    currentStep?: number,
    isComplete?: boolean
  ) => {
    sessionManager.updateSession(birthData, physicalDescription, lifeEvents, currentStep, isComplete);
  }, [sessionManager]);

  const createNewSession = useCallback(() => {
    sessionManager.createNewSession();
  }, [sessionManager]);

  const clearSession = useCallback(() => {
    sessionManager.clearAllSessions();
  }, [sessionManager]);

  return {
    session,
    updateSession,
    createNewSession,
    clearSession,
    sessionManager
  };
}

/**
 * Hook for auto-saving form data
 */
export function useAutoSave(
  birthData: Partial<BirthData>,
  physicalDescription: Partial<PhysicalDescription>,
  lifeEvents: LifeEvent[],
  currentStep: number,
  isComplete: boolean
): void {
  const { updateSession } = useSessionState();

  useEffect(() => {
    // Auto-save with debouncing
    const timer = setTimeout(() => {
      updateSession(birthData, physicalDescription, lifeEvents, currentStep, isComplete);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [birthData, physicalDescription, lifeEvents, currentStep, isComplete, updateSession]);
}

/**
 * Hook to restore session on component mount
 */
export function useSessionRestore(
  onRestore: (session: {
    birthData: Partial<BirthData>;
    physicalDescription: Partial<PhysicalDescription>;
    lifeEvents: LifeEvent[];
    currentStep: number;
  }) => void
): boolean {
  const { session, createNewSession } = useSessionState();
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    if (session && !isRestored) {
      // Restore the session data
      onRestore({
        birthData: session.birthData,
        physicalDescription: session.physicalDescription,
        lifeEvents: session.lifeEvents,
        currentStep: session.currentStep
      });
      setIsRestored(true);
    } else if (!session && !isRestored) {
      // No session exists, create a new one
      createNewSession();
      setIsRestored(true);
    }
  }, [session, isRestored, createNewSession, onRestore]);

  return isRestored;
}

/**
 * Hook to manage form state with session persistence
 */
export function usePersistentForm<T>(
  initialState: T,
  sessionKey: string,
  onRestore?: (state: T) => void
): [T, (newState: T | ((prev: T) => T)) => void, boolean] {
  const sessionManager = getSessionManager();
  const [state, setState] = useState<T>(() => {
    // Try to restore from session
    const session = sessionManager.getCurrentSession();
    if (session && sessionKey in session) {
      const savedState = (session as any)[sessionKey];
      if (savedState && onRestore) {
        onRestore(savedState);
      }
      return savedState || initialState;
    }
    return initialState;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prevState => {
      const nextState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prevState)
        : newState;

      // Store in session metadata using a custom property
      const currentSession = sessionManager.getCurrentSession();
      if (currentSession) {
        // Extend the session with metadata property
        (currentSession as any).metadata = (currentSession as any).metadata || {};
        (currentSession as any).metadata[sessionKey] = nextState;
        
        // Trigger session save by updating fullName (safe field that exists)
        sessionManager.updateSession({ fullName: currentSession.birthData.fullName || '' });
      }

      return nextState;
    });
  }, [sessionManager, sessionKey]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return [state, updateState, isLoaded];
}

/**
 * Hook for step navigation with session persistence
 */
export function usePersistentStepper(
  totalSteps: number,
  onStepChange?: (step: number) => void
): {
  currentStep: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
} {
  const sessionManager = getSessionManager();
  const session = sessionManager.getCurrentSession();
  const initialStep = session?.currentStep || 1;
  
  const [currentStep, setCurrentStep] = useState(initialStep);

  const goToStep = useCallback((step: number) => {
    const validStep = Math.max(1, Math.min(step, totalSteps));
    setCurrentStep(validStep);
    sessionManager.updateSession(undefined, undefined, undefined, validStep);
    onStepChange?.(validStep);
  }, [totalSteps, sessionManager, onStepChange]);

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  return {
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps
  };
}

/**
 * Hook for life events with session persistence
 */
export function usePersistentLifeEvents(
  initialEvents: LifeEvent[] = []
): {
  lifeEvents: LifeEvent[];
  setLifeEvents: (events: LifeEvent[]) => void;
  addEvent: (event: LifeEvent) => void;
  updateEvent: (id: string, updates: Partial<LifeEvent>) => void;
  deleteEvent: (id: string) => void;
} {
  const sessionManager = getSessionManager();
  const session = sessionManager.getCurrentSession();
  const initialEventsFromSession = session?.lifeEvents || initialEvents;
  
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>(initialEventsFromSession);

  const updateEvents = useCallback((events: LifeEvent[]) => {
    setLifeEvents(events);
    sessionManager.updateSession(undefined, undefined, events);
  }, [sessionManager]);

  const addEvent = useCallback((event: LifeEvent) => {
    const newEvents = [...lifeEvents, event];
    updateEvents(newEvents);
  }, [lifeEvents, updateEvents]);

  const updateEvent = useCallback((id: string, updates: Partial<LifeEvent>) => {
    const newEvents = lifeEvents.map(event => 
      event.id === id ? { ...event, ...updates } : event
    );
    updateEvents(newEvents);
  }, [lifeEvents, updateEvents]);

  const deleteEvent = useCallback((id: string) => {
    const newEvents = lifeEvents.filter(event => event.id !== id);
    updateEvents(newEvents);
  }, [lifeEvents, updateEvents]);

  return {
    lifeEvents,
    setLifeEvents: updateEvents,
    addEvent,
    updateEvent,
    deleteEvent
  };
}