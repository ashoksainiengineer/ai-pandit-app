import fs from 'fs';
import path from 'path';
import { logger } from '../logger.js';

/**
 * BTR Thinking Persistence System
 * Stores ALL AI thinking output locally for development/debugging
 */

const TRACES_DIR = '/tmp/btr-traces';

interface ThinkingEntry {
  timestamp: string;
  sessionId: string;
  stage: number;
  candidateTime: string;
  promptTokens: number;
  responseTokens: number;
  thinking: string;
  verdict?: string;
  score?: number;
  duration: number;
}

class ThinkingPersistence {
  private tracesDir: string;

  constructor() {
    this.tracesDir = TRACES_DIR;
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.tracesDir)) {
      fs.mkdirSync(this.tracesDir, { recursive: true });
      logger.info(`[THINKING] Created traces directory: ${this.tracesDir}`);
    }
  }

  private getSessionDir(sessionId: string): string {
    const sessionDir = path.join(this.tracesDir, sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    return sessionDir;
  }

  /**
   * Save AI thinking for a specific candidate
   */
  saveThinking(
    sessionId: string,
    stage: number,
    candidateTime: string,
    thinking: string,
    metadata: {
      promptTokens?: number;
      responseTokens?: number;
      verdict?: string;
      score?: number;
      duration?: number;
    } = {}
  ): void {
    try {
      const sessionDir = this.getSessionDir(sessionId);
      const entry: ThinkingEntry = {
        timestamp: new Date().toISOString(),
        sessionId,
        stage,
        candidateTime,
        thinking,
        promptTokens: metadata.promptTokens || 0,
        responseTokens: metadata.responseTokens || 0,
        verdict: metadata.verdict,
        score: metadata.score,
        duration: metadata.duration || 0
      };

      // Save as JSONL (one line per entry - easy to parse)
      const filename = path.join(sessionDir, `stage-${stage}-thinking.jsonl`);
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(filename, line);

      // Also save as separate text file for easy reading
      const textFilename = path.join(sessionDir, `stage-${stage}-${candidateTime.replace(/:/g, '-')}-thinking.txt`);
      const content = `═══════════════════════════════════════════════════════════════
SESSION: ${sessionId}
STAGE: ${stage}
CANDIDATE: ${candidateTime}
TIMESTAMP: ${entry.timestamp}
DURATION: ${metadata.duration}ms
SCORE: ${metadata.score || 'N/A'}
VERDICT: ${metadata.verdict || 'N/A'}
TOKENS: ${metadata.promptTokens || 0} → ${metadata.responseTokens || 0}
═══════════════════════════════════════════════════════════════

${thinking}

═══════════════════════════════════════════════════════════════

`;
      fs.writeFileSync(textFilename, content);

      logger.info(`[THINKING] Saved thinking for Stage ${stage}, Candidate ${candidateTime}`);
    } catch (error) {
      logger.error('[THINKING] Failed to save thinking:', error);
    }
  }

  /**
   * Get all thinking for a session
   */
  getSessionThinking(sessionId: string): ThinkingEntry[] {
    try {
      const sessionDir = this.getSessionDir(sessionId);
      const entries: ThinkingEntry[] = [];

      const files = fs.readdirSync(sessionDir).filter(f => f.endsWith('.jsonl'));
      
      for (const file of files) {
        const content = fs.readFileSync(path.join(sessionDir, file), 'utf-8');
        const lines = content.trim().split('\n');
        
        for (const line of lines) {
          if (line) {
            entries.push(JSON.parse(line));
          }
        }
      }

      // Sort by timestamp
      return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      logger.error('[THINKING] Failed to get session thinking:', error);
      return [];
    }
  }

  /**
   * Get thinking for specific stage
   */
  getStageThinking(sessionId: string, stage: number): ThinkingEntry[] {
    try {
      const sessionDir = this.getSessionDir(sessionId);
      const filename = path.join(sessionDir, `stage-${stage}-thinking.jsonl`);
      
      if (!fs.existsSync(filename)) {
        return [];
      }

      const content = fs.readFileSync(filename, 'utf-8');
      const lines = content.trim().split('\n');
      
      return lines
        .filter(line => line)
        .map(line => JSON.parse(line));
    } catch (error) {
      logger.error(`[THINKING] Failed to get Stage ${stage} thinking:`, error);
      return [];
    }
  }

  /**
   * Analyze thinking patterns
   */
  analyzeThinking(sessionId: string): {
    totalEntries: number;
    byStage: Record<number, number>;
    avgScores: Record<number, number>;
    highScoreCandidates: Array<{ stage: number; candidate: string; score: number }>;
    lowScoreCandidates: Array<{ stage: number; candidate: string; score: number }>;
  } {
    const entries = this.getSessionThinking(sessionId);
    
    const byStage: Record<number, number> = {};
    const stageScores: Record<number, number[]> = {};
    const highScoreCandidates: Array<{ stage: number; candidate: string; score: number }> = [];
    const lowScoreCandidates: Array<{ stage: number; candidate: string; score: number }> = [];

    for (const entry of entries) {
      // Count by stage
      byStage[entry.stage] = (byStage[entry.stage] || 0) + 1;
      
      // Collect scores
      if (entry.score !== undefined) {
        if (!stageScores[entry.stage]) {
          stageScores[entry.stage] = [];
        }
        stageScores[entry.stage].push(entry.score);

        // High scores (>85)
        if (entry.score > 85) {
          highScoreCandidates.push({
            stage: entry.stage,
            candidate: entry.candidateTime,
            score: entry.score
          });
        }

        // Low scores (<40)
        if (entry.score < 40) {
          lowScoreCandidates.push({
            stage: entry.stage,
            candidate: entry.candidateTime,
            score: entry.score
          });
        }
      }
    }

    // Calculate averages
    const avgScores: Record<number, number> = {};
    for (const [stage, scores] of Object.entries(stageScores)) {
      avgScores[parseInt(stage)] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    // Sort by score
    highScoreCandidates.sort((a, b) => b.score - a.score);
    lowScoreCandidates.sort((a, b) => a.score - b.score);

    return {
      totalEntries: entries.length,
      byStage,
      avgScores,
      highScoreCandidates: highScoreCandidates.slice(0, 20),
      lowScoreCandidates: lowScoreCandidates.slice(0, 20)
    };
  }

  /**
   * List all sessions
   */
  listSessions(): string[] {
    try {
      return fs.readdirSync(this.tracesDir).filter(name => {
        const fullPath = path.join(this.tracesDir, name);
        return fs.statSync(fullPath).isDirectory();
      });
    } catch (error) {
      logger.error('[THINKING] Failed to list sessions:', error);
      return [];
    }
  }

  /**
   * Clean old traces (keep last 10 sessions)
   */
  cleanupOldTraces(keepCount: number = 10): void {
    try {
      const sessions = this.listSessions();
      
      // Sort by modification time
      const sortedSessions = sessions
        .map(name => ({
          name,
          mtime: fs.statSync(path.join(this.tracesDir, name)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Delete old ones
      const toDelete = sortedSessions.slice(keepCount);
      for (const { name } of toDelete) {
        const dirPath = path.join(this.tracesDir, name);
        fs.rmSync(dirPath, { recursive: true });
        logger.info(`[THINKING] Cleaned up old trace: ${name}`);
      }
    } catch (error) {
      logger.error('[THINKING] Failed to cleanup old traces:', error);
    }
  }
}

// Export singleton instance
export const thinkingPersistence = new ThinkingPersistence();
export type { ThinkingEntry };