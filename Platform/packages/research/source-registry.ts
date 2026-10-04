/**
 * Brew Helper — Source Registry loader (M5, Node). Reads the GENERATED allowlist
 * (config/source-registry.json, built from Governance/Source-Registry/sources.yaml).
 * This is the governance gate: only listed domains may enter research.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface RegistrySource { match: string; domain: string; name: string; tier: 'A' | 'B' | 'C'; credibility: number; category: string; expertise: string[]; avoid_when: string; }
export interface SourceRegistry {
  // accepts a URL or host; matches by the most specific pattern (channel path beats bare host)
  isTrusted(url: string): boolean;
  tierOf(url: string): 'A' | 'B' | 'C';
  meta(url: string): RegistrySource | undefined;
  list(): RegistrySource[];
}

export function loadSourceRegistry(): SourceRegistry {
  const path = fileURLToPath(new URL('../../config/source-registry.json', import.meta.url));
  const data = JSON.parse(readFileSync(path, 'utf8')) as { sources: RegistrySource[] };
  const sources = data.sources;
  const norm = (u: string) => u.replace(/^https?:\/\//, '');
  const find = (url: string): RegistrySource | undefined => {
    const u = norm(url);
    // prefer the longest matching pattern (path-specific wins over bare host)
    let best: RegistrySource | undefined; let bestLen = 0;
    for (const s of sources) {
      const hit = s.match.includes('/') ? u.startsWith(s.match) : u.split('/')[0] === s.domain;
      if (hit && s.match.length > bestLen) { best = s; bestLen = s.match.length; }
    }
    return best;
  };
  return { isTrusted: (u) => !!find(u), tierOf: (u) => find(u)?.tier ?? 'C', meta: (u) => find(u), list: () => sources };
}
