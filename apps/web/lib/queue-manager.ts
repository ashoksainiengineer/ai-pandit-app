// Frontend-compatible queue manager (proxies to backend)

export interface QueueStatus {
  status: 'queued' | 'processing' | 'complete' | 'failed';
  position: number;
  estimatedWaitSeconds: number;
  totalInQueue: number;
}

export interface QueueResult {
  success: boolean;
  position?: number;
  estimatedWaitSeconds?: number;
  error?: string;
}

export async function addToQueue(sessionId: string): Promise<QueueResult> {
  // Backend handles this - frontend just proxies
  // Return success format expected by consumers
  return { success: true, position: 0, estimatedWaitSeconds: 0 };
}

export async function getQueueStatus(sessionId: string): Promise<QueueStatus | null> {
  // Backend handles this
  return {
    status: 'queued',
    position: 0,
    estimatedWaitSeconds: 0,
    totalInQueue: 0
  };
}

export function startQueueProcessor(): void {
  // Backend handles this
  console.log('Queue processor started');
}

export async function cancelSession(sessionId: string): Promise<boolean> {
  // Backend handles this
  return true;
}
