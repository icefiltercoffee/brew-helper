/**
 * Generate the runtime allowlist (config/source-registry.json) FROM the governance registry
 * (Intelligence/Governance/Source-Registry/sources.yaml). The YAML is the source of truth.
 * Run: node scripts/build-source-registry.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const yamlPath = fileURLToPath(new URL('../../Intelligence/Governance/Source-Registry/sources.yaml', import.meta.url));
const outPath = fileURLToPath(new URL('../config/source-registry.json', import.meta.url));

const reg = parseYaml(readFileSync(yamlPath, 'utf8'));
const sources = (reg.sources ?? [])
  .filter((s) => (s.urls ?? []).length)          // only sources with fetchable domains enter the allowlist
  .map((s) => {
    const match = s.urls[0].replace(/^https?:\/\//, '');   // host + optional channel path (distinguishes YouTube channels)
    return {
      match, domain: match.split('/')[0],
      name: s.name, tier: s.tier, credibility: s.credibility,
      category: s.category, expertise: s.expertise ?? [],
      avoid_when: s.avoid_when ?? '',
    };
  });

const json = {
  $comment: 'GENERATED from Intelligence/Governance/Source-Registry/sources.yaml — do not hand-edit.',
  generatedFrom: 'sources.yaml', version: reg.version,
  defaults: { respectRobotsTxt: true, maxSourcesPerRequest: 5, cacheTtlHours: 168 },
  sources, blocklist: [],
};
writeFileSync(outPath, JSON.stringify(json, null, 2));
console.log(`wrote ${sources.length} allowlisted domain(s) → config/source-registry.json`);
