/**
 * Brew Helper — Research adapter (M5). Turns a fetched doc into typed Claims (the mechanism/fact),
 * never pasted prose. Tier + credibility come from the Source Registry; kind from its category.
 */
import type { Claim, ClaimKind } from '../contracts';
import type { RawDoc } from './search-provider';
import type { SourceRegistry } from './source-registry';

function kindFor(category?: string): ClaimKind {
  if (!category) return 'community';
  if (/Research|Journal|Academic/i.test(category)) return 'science';
  if (/Roaster/i.test(category)) return 'roaster';
  if (/Champion|Brewer|Education/i.test(category)) return 'competition';
  return 'community';
}
function guessDomain(text: string): string {
  const t = text.toLowerCase();
  for (const d of ['grind', 'temp', 'agitation', 'ratio', 'water', 'pour', 'bloom', 'process', 'roast'])
    if (t.includes(d)) return d;
  return 'general';
}

export function extractClaims(doc: RawDoc, tier: 'A' | 'B' | 'C', registry: SourceRegistry): Claim[] {
  const meta = registry.meta(doc.url);
  // M5: one claim per doc — its key statement. A richer extractor (multi-claim) is a later refinement.
  const statement = (doc.title || doc.text.split('.')[0] || '').trim();
  if (!statement) return [];
  return [{
    statement,
    source: { id: doc.domain, title: meta?.name, tier },
    tier,
    kind: kindFor(meta?.category),
    weight: (meta?.credibility ?? 60) / 100,
    domain: guessDomain(doc.text),
    independentCount: 1,
  }];
}
