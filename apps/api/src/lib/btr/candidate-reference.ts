import type { CandidateDataPackage, CandidateTime } from '@ai-pandit/shared';
import { getCandidateIdentity } from '../time-offset-manager.js';

type CandidateReferenceSource = Pick<CandidateTime, 'time' | 'candidateKey' | 'candidateDate'> | Pick<CandidateDataPackage, 'time' | 'candidateKey' | 'candidateDate'>;

export function buildDuplicateTimeSet(candidates: CandidateReferenceSource[]): Set<string> {
  const counts = new Map<string, number>();

  for (const candidate of candidates) {
    counts.set(candidate.time, (counts.get(candidate.time) || 0) + 1);
  }

  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([time]) => time));
}

export function getCandidateReference(candidate: CandidateReferenceSource, duplicateTimes?: Set<string>): string {
  if (duplicateTimes?.has(candidate.time) && candidate.candidateDate) {
    return `${candidate.candidateDate} ${candidate.time}`;
  }

  return getCandidateIdentity(candidate);
}

export function buildCandidateReferenceMap<T extends CandidateReferenceSource>(candidates: T[]): Map<string, T> {
  const duplicateTimes = buildDuplicateTimeSet(candidates);

  return new Map(candidates.map((candidate) => [
    getCandidateReference(candidate, duplicateTimes),
    candidate,
  ]));
}
