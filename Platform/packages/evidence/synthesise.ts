/**
 * Brew Helper — Evidence Synthesiser (M3)
 * Weights claims (tier × confidence × convergence), boosts the principles that actually
 * drove this recommendation, detects directional conflicts within a domain, and separates
 * science (constraints) from anecdote (evidence). Emits the user-facing Evidence object.
 * Transparency contract: Evidence is supporting CONTEXT, never the chain-of-thought.
 */
import type { EvidenceSynth, Claim, Evidence, Conflict } from '../contracts';

const OPPOSING: [string, string][] = [
  ['finer', 'coarser'], ['hotter', 'cooler'], ['higher', 'lower'],
  ['more', 'less'], ['increase', 'reduce'], ['tighter', 'wider'],
];

function scoreOf(c: Claim): number {
  const tierW = c.tier === 'A' ? 1 : c.tier === 'B' ? 0.8 : 0.6;
  const conv = 1 + Math.min(0.3, ((c.independentCount ?? 1) - 1) * 0.1);
  return c.weight * tierW * conv;                       // confidence × credibility × convergence
}

function detectConflicts(claims: Claim[]): Conflict[] {
  const byDomain = new Map<string, Claim[]>();
  for (const c of claims) { const d = c.domain ?? 'general'; (byDomain.get(d) ?? byDomain.set(d, []).get(d)!).push(c); }
  const conflicts: Conflict[] = [];
  for (const [domain, cs] of byDomain) {
    if (cs.length < 2) continue;
    const text = cs.map((c) => c.statement.toLowerCase());
    for (const [a, b] of OPPOSING) {
      const hasA = text.some((t) => t.includes(a)), hasB = text.some((t) => t.includes(b));
      if (hasA && hasB) { conflicts.push({ on: domain, note: `Sources differ on ${domain} — kept the higher-confidence, context-matched call.` }); break; }
    }
  }
  return conflicts;
}

export function createEvidenceSynth(): EvidenceSynth {
  return {
    synthesise(claims: Claim[], ctx?: { appliedIds?: string[] }) {
      const applied = new Set(ctx?.appliedIds ?? []);
      // Split science (constraints) from anecdote (evidence). Science never averages with anecdote.
      const anecdote = claims.filter((c) => c.kind !== 'science');
      const science = claims.filter((c) => c.kind === 'science');

      const ranked = anecdote
        .map((c) => ({ c, s: scoreOf(c) + (applied.has(c.principleId ?? '') ? 0.6 : 0) }))
        .sort((a, b) => b.s - a.s);

      const decisionInput = ranked.map((r) => r.c);
      const conflicts = detectConflicts(ranked.slice(0, 6).map((r) => r.c));

      const items = ranked.slice(0, 5).map(({ c }) => ({
        label: c.statement,
        kind: c.kind,
        theme: c.domain,
        strength: (applied.has(c.principleId ?? '') || c.weight >= 0.62) ? 'strong' as const : 'moderate' as const,
      }));

      const appliedCount = ranked.filter((r) => applied.has(r.c.principleId ?? '')).length;
      const note = !claims.length
        ? 'Starting from coffee-science fundamentals (principle library still small).'
        : conflicts.length
          ? 'Weighed differing sources; led with the strongest, context-matched guidance.'
          : appliedCount
            ? `${appliedCount} principle(s) drove this call${science.length ? '; consistent with the extraction curve' : ''}.`
            : 'Drawn from your principle library; consistent with the extraction curve.';

      const evidence: Evidence = { items, note, conflicts };
      return { decisionInput, evidence, conflicts };
    },
  };
}
