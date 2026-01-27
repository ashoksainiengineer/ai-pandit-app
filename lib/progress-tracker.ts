// Frontend-compatible progress tracker (proxies to backend)

export interface ProgressStep {
  name: string;
  status: 'pending' | 'in_progress' | 'complete' | 'failed';
  message?: string;
}

export interface SessionProgress {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  steps: ProgressStep[];
  lastUpdate: string;
  liveMessage: string;
}

export async function getSessionProgress(sessionId: string): Promise<SessionProgress | null> {
  // This should be called from backend, frontend just proxies
  return {
    currentStep: 0,
    totalSteps: 10,
    percentage: 0,
    steps: [],
    lastUpdate: new Date().toISOString(),
    liveMessage: 'Waiting in queue...'
  };
}

export async function updateProgress(sessionId: string, progress: Partial<SessionProgress>): Promise<void> {
  // Backend handles this
  console.log('Progress update:', sessionId, progress);
}
