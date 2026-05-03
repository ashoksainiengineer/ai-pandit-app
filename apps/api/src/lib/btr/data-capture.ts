import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger.js';
import { safeJsonParse } from '../utils/safe-json-parse.js';

interface EphemerisData {
  timestamp: string;
  sessionId: string;
  stage: number;
  round?: number;
  batch?: number;
  candidateTime: string;
  planets: Record<string, unknown>;
  houses: Record<string, unknown>;
  lagna: unknown;
  vimshottariDasha?: unknown[];
  vargas?: Record<string, unknown>;
  transits?: Record<string, unknown>;
}

interface PromptData {
  timestamp: string;
  sessionId: string;
  stage: number;
  round?: number;
  batch?: number;
  candidateTime: string;
  systemPrompt: string;
  userPrompt: string;
  promptTokens: number;
  contextData: {
    candidateCount: number;
    eventCount: number;
    forensicTraitsPresent: boolean;
    spouseDataPresent: boolean;
  };
}

interface AIResponseData {
  timestamp: string;
  sessionId: string;
  stage: number;
  round?: number;
  batch?: number;
  candidateTime: string;
  thinking: string;
  content: string;
  score?: number;
  verdict?: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number;
  model: string;
}

interface BatchMetadata {
  timestamp: string;
  sessionId: string;
  stage: number;
  round: number;
  batch: number;
  candidateTimes: string[];
  survivorsExpected: number;
  totalCandidates: number;
}

const TRACES_DIR = '/tmp/btr-traces';

class BTRDataCapture {
  private tracesDir: string;

  constructor() {
    this.tracesDir = TRACES_DIR;
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.tracesDir)) {
      fs.mkdirSync(this.tracesDir, { recursive: true });
    }
  }

  private getPath(sessionId: string, stage: number, round?: number, batch?: number): string {
    let dir = path.join(this.tracesDir, sessionId, `stage-${stage}`);
    
    if (round !== undefined) {
      dir = path.join(dir, `round-${round}`);
    }
    
    if (batch !== undefined) {
      dir = path.join(dir, `batch-${batch}`);
    }

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return dir;
  }

  saveEphemeris(
    sessionId: string,
    stage: number,
    candidateTime: string,
    data: Omit<EphemerisData, 'timestamp' | 'sessionId' | 'stage' | 'candidateTime'>,
    round?: number,
    batch?: number
  ): void {
    try {
      const dir = this.getPath(sessionId, stage, round, batch);
      const ephemerisData: EphemerisData = {
        timestamp: new Date().toISOString(),
        sessionId,
        stage,
        round,
        batch,
        candidateTime,
        ...data
      };

      const filename = path.join(dir, `ephemeris-${candidateTime.replace(/:/g, '-')}.json`);
      fs.writeFileSync(filename, JSON.stringify(ephemerisData, null, 2));

      const logFilename = path.join(dir, 'ephemeris-data.jsonl');
      fs.appendFileSync(logFilename, JSON.stringify(ephemerisData) + '\n');

      logger.info(`[DATA-CAPTURE] Saved ephemeris for Stage ${stage}, Candidate ${candidateTime}`);
    } catch (error) {
      logger.error('[DATA-CAPTURE] Failed to save ephemeris:', error);
    }
  }

  savePrompt(
    sessionId: string,
    stage: number,
    candidateTime: string,
    systemPrompt: string,
    userPrompt: string,
    contextData: PromptData['contextData'],
    round?: number,
    batch?: number
  ): void {
    try {
      const dir = this.getPath(sessionId, stage, round, batch);
      
      const promptData: PromptData = {
        timestamp: new Date().toISOString(),
        sessionId,
        stage,
        round,
        batch,
        candidateTime,
        systemPrompt,
        userPrompt,
        promptTokens: Math.ceil((systemPrompt.length + userPrompt.length) / 4),
        contextData
      };

      const jsonFilename = path.join(dir, `prompt-${candidateTime.replace(/:/g, '-')}.json`);
      fs.writeFileSync(jsonFilename, JSON.stringify(promptData, null, 2));

      const txtFilename = path.join(dir, `prompt-${candidateTime.replace(/:/g, '-')}.txt`);
      const textContent = `════════════════════════════════════════════════════════════════
PROMPT DATA
════════════════════════════════════════════════════════════════
Session: ${sessionId}
Stage: ${stage}
Round: ${round || 'N/A'}
Batch: ${batch || 'N/A'}
Candidate: ${candidateTime}
Timestamp: ${promptData.timestamp}
Tokens: ${promptData.promptTokens}

CANDIDATES: ${contextData.candidateCount}
EVENTS: ${contextData.eventCount}
FORENSIC: ${contextData.forensicTraitsPresent ? 'Yes' : 'No'}
SPOUSE: ${contextData.spouseDataPresent ? 'Yes' : 'No'}

════════════════════════════════════════════════════════════════
SYSTEM PROMPT:
════════════════════════════════════════════════════════════════

${systemPrompt}

════════════════════════════════════════════════════════════════
USER PROMPT:
════════════════════════════════════════════════════════════════

${userPrompt}

════════════════════════════════════════════════════════════════
`;
      fs.writeFileSync(txtFilename, textContent);

      logger.info(`[DATA-CAPTURE] Saved prompt for Stage ${stage}, Candidate ${candidateTime}`);
    } catch (error) {
      logger.error('[DATA-CAPTURE] Failed to save prompt:', error);
    }
  }

  saveAIResponse(
    sessionId: string,
    stage: number,
    candidateTime: string,
    thinking: string,
    content: string,
    metadata: {
      score?: number;
      verdict?: string;
      tokensUsed: { prompt: number; completion: number; total: number };
      duration: number;
      model: string;
    },
    round?: number,
    batch?: number
  ): void {
    try {
      const dir = this.getPath(sessionId, stage, round, batch);
      
      const responseData: AIResponseData = {
        timestamp: new Date().toISOString(),
        sessionId,
        stage,
        round,
        batch,
        candidateTime,
        thinking,
        content,
        score: metadata.score,
        verdict: metadata.verdict,
        tokensUsed: metadata.tokensUsed,
        duration: metadata.duration,
        model: metadata.model
      };

      const jsonFilename = path.join(dir, `response-${candidateTime.replace(/:/g, '-')}.json`);
      fs.writeFileSync(jsonFilename, JSON.stringify(responseData, null, 2));

      const txtFilename = path.join(dir, `response-${candidateTime.replace(/:/g, '-')}.txt`);
      const textContent = `════════════════════════════════════════════════════════════════
AI RESPONSE DATA
════════════════════════════════════════════════════════════════
Session: ${sessionId}
Stage: ${stage}
Round: ${round || 'N/A'}
Batch: ${batch || 'N/A'}
Candidate: ${candidateTime}
Timestamp: ${responseData.timestamp}
Model: ${metadata.model}
Duration: ${metadata.duration}ms

SCORE: ${metadata.score || 'N/A'}
VERDICT: ${metadata.verdict || 'N/A'}

TOKENS:
  Prompt: ${metadata.tokensUsed.prompt}
  Completion: ${metadata.tokensUsed.completion}
  Total: ${metadata.tokensUsed.total}

════════════════════════════════════════════════════════════════
AI THINKING:
════════════════════════════════════════════════════════════════

${thinking}

════════════════════════════════════════════════════════════════
AI CONTENT (Response):
════════════════════════════════════════════════════════════════

${content}

════════════════════════════════════════════════════════════════
`;
      fs.writeFileSync(txtFilename, textContent);

      const logFilename = path.join(dir, 'responses.jsonl');
      fs.appendFileSync(logFilename, JSON.stringify(responseData) + '\n');

      logger.info(`[DATA-CAPTURE] Saved AI response for Stage ${stage}, Candidate ${candidateTime}`);
    } catch (error) {
      logger.error('[DATA-CAPTURE] Failed to save AI response:', error);
    }
  }

  saveBatchMetadata(
    sessionId: string,
    stage: number,
    round: number,
    batch: number,
    candidateTimes: string[],
    survivorsExpected: number
  ): void {
    try {
      const dir = this.getPath(sessionId, stage, round, batch);
      
      const metadata: BatchMetadata = {
        timestamp: new Date().toISOString(),
        sessionId,
        stage,
        round,
        batch,
        candidateTimes,
        survivorsExpected,
        totalCandidates: candidateTimes.length
      };

      const filename = path.join(dir, 'batch-metadata.json');
      fs.writeFileSync(filename, JSON.stringify(metadata, null, 2));

      logger.info(`[DATA-CAPTURE] Saved metadata for Stage ${stage}, Round ${round}, Batch ${batch}`);
    } catch (error) {
      logger.error('[DATA-CAPTURE] Failed to save batch metadata:', error);
    }
  }

  getSessionStructure(sessionId: string): string[] {
    try {
      const sessionDir = path.join(this.tracesDir, sessionId);
      if (!fs.existsSync(sessionDir)) {
        return [];
      }

      const structure: string[] = [];
      
      const walkDir = (dir: string, prefix: string = '') => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            structure.push(`${prefix}${item}/`);
            walkDir(fullPath, `${prefix}  `);
          } else {
            structure.push(`${prefix}${item}`);
          }
        }
      };

      walkDir(sessionDir);
      return structure;
    } catch (error) {
      logger.error('[DATA-CAPTURE] Failed to get session structure:', error);
      return [];
    }
  }

  getCandidateData(
    sessionId: string,
    stage: number,
    candidateTime: string,
    round?: number,
    batch?: number
  ): {
    ephemeris?: EphemerisData;
    prompt?: PromptData;
    response?: AIResponseData;
  } {
    const result: { ephemeris?: EphemerisData; prompt?: PromptData; response?: AIResponseData } = {};
    
    try {
      const dir = this.getPath(sessionId, stage, round, batch);
      const safeTime = candidateTime.replace(/:/g, '-');

      const ephemerisFile = path.join(dir, `ephemeris-${safeTime}.json`);
      if (fs.existsSync(ephemerisFile)) {
        try { result.ephemeris = safeJsonParse<EphemerisData>(fs.readFileSync(ephemerisFile, 'utf-8'), undefined!); } catch (error) { logger.warn('[DATA-CAPTURE] Skipping corrupt ephemeris file', { error }); }
      }

      const promptFile = path.join(dir, `prompt-${safeTime}.json`);
      if (fs.existsSync(promptFile)) {
        try { result.prompt = safeJsonParse<PromptData>(fs.readFileSync(promptFile, 'utf-8'), undefined!); } catch (error) { logger.warn('[DATA-CAPTURE] Skipping corrupt prompt file', { error }); }
      }

      const responseFile = path.join(dir, `response-${safeTime}.json`);
      if (fs.existsSync(responseFile)) {
        try { result.response = safeJsonParse<AIResponseData>(fs.readFileSync(responseFile, 'utf-8'), undefined!); } catch (error) { logger.warn('[DATA-CAPTURE] Skipping corrupt response file', { error }); }
      }

      return result;
    } catch (error) {
      logger.error('[DATA-CAPTURE] Failed to get candidate data:', error);
      return result;
    }
  }

  listSessions(): string[] {
    try {
      return fs.readdirSync(this.tracesDir).filter(name => {
        const fullPath = path.join(this.tracesDir, name);
        return fs.statSync(fullPath).isDirectory();
      });
    } catch (error) {
      logger.error('[DATA-CAPTURE] Failed to list sessions:', error);
      return [];
    }
  }

  cleanup(keepCount: number = 10): void {
    try {
      const sessions = this.listSessions();
      
      const sortedSessions = sessions
        .map(name => ({
          name,
          mtime: fs.statSync(path.join(this.tracesDir, name)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      const toDelete = sortedSessions.slice(keepCount);
      for (const { name } of toDelete) {
        const dirPath = path.join(this.tracesDir, name);
        fs.rmSync(dirPath, { recursive: true });
        logger.info(`[DATA-CAPTURE] Cleaned up old session: ${name}`);
      }
    } catch (error) {
      logger.error('[DATA-CAPTURE] Failed to cleanup:', error);
    }
  }
}

export const btrDataCapture = new BTRDataCapture();
export type { EphemerisData, PromptData, AIResponseData, BatchMetadata };
