/**
 * Brew Helper — Memory Manager (M1)
 * Layer 1. Reads the durable principle library (active) from the Knowledge Repository,
 * parses each PRN's YAML block, and returns typed Principles + a coarse familiarity score.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import type { MemoryManager, Observation, Principle, BrewOutcome, LearningUpdate } from '../contracts';

const ACTIVE_DIR = fileURLToPath(
  new URL('../../../Intelligence/Knowledge-Repository/store/principles/active', import.meta.url),
);

function loadActivePrinciples(): Principle[] {
  let files: string[] = [];
  try { files = readdirSync(ACTIVE_DIR).filter((f) => f.startsWith('PRN-') && f.endsWith('.md')); }
  catch { return []; }
  const out: Principle[] = [];
  for (const f of files) {
    const text = readFileSync(`${ACTIVE_DIR}/${f}`, 'utf8');
    const m = text.match(/```yaml\s*([\s\S]*?)```/);
    if (!m) continue;
    try {
      const y = parseYaml(m[1]) as any;
      out.push({
        id: y.id, statement: y.statement, domain: y.domain, mechanism: y.mechanism,
        appliesWhen: y.applies_when ?? [], levers: y.levers ?? [],
        strategyImplication: y.strategy_implication ?? '',
        confidence: y.confidence ?? 0.5,
        evidence: {
          sources: y.evidence?.sources ?? [], recipes: y.evidence?.recipes ?? [],
          independentCount: y.evidence?.independent_count ?? 1,
        },
        status: y.status ?? 'active', version: y.version ?? 1,
      });
    } catch { /* skip malformed */ }
  }
  return out;
}

export function createMemoryManager(): MemoryManager {
  return {
    async retrieve(_o: Observation) {
      const principles = loadActivePrinciples();
      const history: BrewOutcome[] = []; // TODO M4: per-user brew history
      // Coarse familiarity: more active, higher-confidence principles → more familiar.
      const familiarity = Math.min(1, principles.reduce((s, p) => s + p.confidence, 0) / 4);
      return { principles, history, familiarity };
    },
    async learn(_u: LearningUpdate) { /* TODO M4 */ },
  };
}
