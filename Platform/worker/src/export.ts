export interface PromotedCandidate {
  id: string;
  statement: string;
  mechanism: string;
  domain: string;
  source_ids_json: string;
  independent_count: number;
  origin: 'research' | 'brew-history';
  coffee_fingerprint?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
}

function sourceIds(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Creates a review record for a human to turn into an active PRN file. This is
 * deliberately an export, not an automatic write into the active library.
 */
export function candidateExport(candidates: PromotedCandidate[], generatedAt = new Date().toISOString()) {
  const markdown = candidates.map((candidate) => {
    const sources = sourceIds(candidate.source_ids_json);
    return [
      `## ${candidate.id}`,
      '',
      `- Statement: ${candidate.statement}`,
      `- Mechanism: ${candidate.mechanism}`,
      `- Domain: ${candidate.domain}`,
      `- Origin: ${candidate.origin}`,
      `- Evidence: ${candidate.independent_count} independent record(s) — ${sources.join(', ') || 'source IDs unavailable'}`,
      `- Reviewed: ${candidate.reviewed_at ?? 'unknown'}`,
      candidate.review_note ? `- Review note: ${candidate.review_note}` : '',
      candidate.coffee_fingerprint ? `- Scope: ${candidate.coffee_fingerprint}` : '',
      '',
    ].filter(Boolean).join('\n');
  }).join('\n');
  return { generatedAt, candidates, markdown };
}
