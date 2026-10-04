/**
 * Brew Helper — Familiarity Router + Research Manager (M5).
 * Router decides WHEN live research is worth it (adaptive: familiar → no fetch).
 * Manager runs governed research: only Source-Registry-approved domains, within budget,
 * extracting typed claims. Ships with no provider (→ no research) so it never fabricates.
 */
import type { FamiliarityRouter, ResearchManager, Observation, Principle, ResearchResult } from '../contracts';
import type { SearchProvider } from './search-provider';
import type { SourceRegistry } from './source-registry';
import { extractClaims } from './adapter';

const HIGH = 0.75;   // ≥ HIGH → local only (Architecture.md (Part 1) §7)

export function createFamiliarityRouter(): FamiliarityRouter {
  return {
    score(_o: Observation, principles: Principle[]): number {
      return Math.min(1, principles.reduce((s, p) => s + p.confidence, 0) / 4);
    },
    needsResearch(score: number): boolean { return score < HIGH; },
  };
}

export interface ResearchDeps { provider?: SearchProvider; registry?: SourceRegistry; budget?: number; }

const cache = new Map<string, { expiresAt: number; results: ResearchResult[] }>();

export function createResearchManager(opts: ResearchDeps = {}): ResearchManager {
  return {
    async maybeResearch(o: Observation, _familiarity: number): Promise<ResearchResult[]> {
      if (!opts.provider || !opts.registry) return [];          // no backend → no research (never fabricate)
      const query = [o.coffee.origin, o.coffee.process, o.coffee.variety, 'brewing'].filter(Boolean).join(' ');
      const cached = cache.get(query);
      if (cached && cached.expiresAt > Date.now()) return cached.results;
      const docs = await opts.provider.search(query);
      const budget = opts.budget ?? 5;
      const out: ResearchResult[] = [];
      const seen = new Set<string>();
      for (const d of docs) {
        if (out.length >= budget) break;
        if (!opts.registry.isTrusted(d.url)) continue;           // ← GOVERNANCE GATE: allowlist (channel-specific)
        if (seen.has(d.url)) continue; seen.add(d.url);
        const tier = opts.registry.tierOf(d.url);
        out.push({ url: d.url, tier, claims: extractClaims(d, tier, opts.registry), fetchedAt: new Date().toISOString() });
      }
      cache.set(query, { results: out, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
      return out;
    },
  };
}
