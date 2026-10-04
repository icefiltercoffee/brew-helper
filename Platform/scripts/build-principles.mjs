/**
 * Snapshot active principles → data/principles.json (embedded into the browser bundle).
 * Run: node scripts/build-principles.mjs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const activeDir = fileURLToPath(new URL('../../Intelligence/Knowledge-Repository/store/principles/active', import.meta.url));
const sourceDir = fileURLToPath(new URL('../../Intelligence/Knowledge-Repository/store/structured/sources', import.meta.url));
const outDir = fileURLToPath(new URL('../data', import.meta.url));
const outFile = `${outDir}/principles.json`;

const files = readdirSync(activeDir).filter((f) => f.startsWith('PRN-') && f.endsWith('.md'));
const sourceMeta = new Map();
for (const f of readdirSync(sourceDir).filter((x) => x.startsWith('SRC-') && x.endsWith('.md'))) {
  const text = readFileSync(`${sourceDir}/${f}`, 'utf8');
  const m = text.match(/```yaml\s*([\s\S]*?)```/);
  if (!m) continue;
  const y = parseYaml(m[1]);
  const type = String(y.type ?? '').toLowerCase();
  const kind = /research|journal|academic|paper/.test(type) ? 'science'
    : /wbrc|competition|champion/.test(type) ? 'competition'
      : /roaster/.test(type) ? 'roaster' : 'community';
  sourceMeta.set(y.id, { id: y.id, tier: y.credibility_tier ?? 'C', kind });
}
const principles = [];
for (const f of files) {
  const text = readFileSync(`${activeDir}/${f}`, 'utf8');
  const m = text.match(/```yaml\s*([\s\S]*?)```/);
  if (!m) continue;
  const y = parseYaml(m[1]);
  principles.push({
    id: y.id, statement: y.statement, domain: y.domain, mechanism: y.mechanism,
    appliesWhen: y.applies_when ?? [], levers: y.levers ?? [],
    strategyImplication: y.strategy_implication ?? '',
    confidence: y.confidence ?? 0.5,
    evidence: {
      sources: y.evidence?.sources ?? [], recipes: y.evidence?.recipes ?? [],
      independentCount: y.evidence?.independent_count ?? 1,
      sourceMeta: (y.evidence?.sources ?? []).map((id) => sourceMeta.get(id)).filter(Boolean),
    },
    status: y.status ?? 'active', version: y.version ?? 1,
  });
}
mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(principles, null, 2));
console.log(`wrote ${principles.length} active principle(s) → data/principles.json`);
