/** M6 — converts convergent findings into review-only principle candidates. */
import type { Lever } from '../contracts';

export interface CandidateInput {
  statement: string;
  mechanism: string;
  domain: Lever | 'process' | 'roast' | 'equipment';
  sourceIds: string[];
  independentCount: number;
  origin: 'research' | 'brew-history';
  coffeeFingerprint?: string;
}

export interface PrincipleCandidate extends CandidateInput {
  id: string;
  status: 'needs_review';
  createdAt: string;
  reason: string;
}

function unique(values: string[]) { return [...new Set(values.filter(Boolean))]; }

/**
 * This deliberately never creates an active principle. A candidate needs either
 * two independent external sources, or three matching brews on one setup.
 */
export function proposeCandidate(input: CandidateInput, now = new Date()): PrincipleCandidate | null {
  const sourceIds = unique(input.sourceIds);
  const threshold = input.origin === 'research' ? 2 : 3;
  const converged = input.independentCount >= threshold && sourceIds.length >= threshold;
  if (!converged || !input.statement.trim() || !input.mechanism.trim()) return null;
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return {
    ...input,
    sourceIds,
    id: `CND-${stamp}-${input.domain}`.toUpperCase(),
    status: 'needs_review',
    createdAt: now.toISOString(),
    reason: input.origin === 'research'
      ? `${input.independentCount} independent sources support this finding.`
      : `${input.independentCount} matching brews support this setup-specific finding.`,
  };
}
