/**
 * Brew Helper — CLI entry (M1). Proves the walking skeleton end-to-end.
 * Usage: tsx services/cli/recommend.ts [scenario]
 *   scenario: "clarity" (default) | "sweetbody" | "claritysweet"
 */
import { composeEngine } from '../../packages/engine/compose';
import { recommend } from '../../packages/engine/orchestrator';
import type { Observation, RadarPriorities } from '../../packages/contracts';

const scenarios: Record<string, { name: string; coffee: Observation['coffee']; intent: RadarPriorities }> = {
  clarity: {
    name: 'Colombia Risaralda · washed · light — chasing clarity + florals',
    coffee: { origin: 'Colombia', process: 'Washed', roastLevel: 'light', altitude: '1,850 masl', roastAgeDays: 13, tastingNotes: ['melon', 'kiwi'] },
    intent: { sweetness: 0.5, clarity: 0.9, body: 0.35, acidity: 0.7, floral: 0.85, juiciness: 0.6 },
  },
  sweetbody: {
    name: 'Brazil · natural · medium — chasing sweetness + body',
    coffee: { origin: 'Brazil', process: 'Natural', roastLevel: 'medium', altitude: '1,100 masl', roastAgeDays: 20 },
    intent: { sweetness: 0.9, clarity: 0.4, body: 0.85, acidity: 0.4, floral: 0.3, juiciness: 0.6 },
  },
  claritysweet: {
    name: 'Panama Geisha · anaerobic natural · light — clarity AND sweetness (should fire PRN-0001)',
    coffee: { origin: 'Panama', process: 'Anaerobic Natural', roastLevel: 'light', altitude: '1,700 masl', roastAgeDays: 15 },
    intent: { sweetness: 0.8, clarity: 0.85, body: 0.45, acidity: 0.7, floral: 0.6, juiciness: 0.7 },
  },
};

async function main() {
  const key = process.argv[2] ?? 'clarity';
  const sc = scenarios[key] ?? scenarios.clarity;
  const obs: Observation = {
    coffee: sc.coffee,
    setup: { grinder: 'Comandante C40', brewer: 'V60' },
    intent: sc.intent,
    unknowns: ['waterProfile'],
    fingerprint: `${sc.coffee.origin}-${sc.coffee.process}-${sc.coffee.roastLevel}`.toLowerCase(),
  };

  const rec = await recommend(obs, composeEngine());

  const bar = '─'.repeat(72);
  const b = rec.bundle, n = rec.narrative;
  console.log(`\n${bar}\nSCENARIO  ${sc.name}\n${bar}`);
  console.log(`\n▣  RECOMMENDATION STATE:  ${b.state}`);
  if (b.assumptions.length) console.log(`   assumption: ${b.assumptions[0]}`);
  console.log(`\n1·🗣  JUDGEMENT       ${n.judgement}`);
  console.log(`2·🎯  STRATEGY       ${n.strategyLine}`);
  console.log(`3·📚  EVIDENCE       ${n.evidenceSummary}`);
  console.log(`4·⚖   TRADE-OFFS     ${n.tradeoffs}`);
  console.log(`\n5·☕  RECIPE  (each param traces to the strategy)`);
  for (const p of rec.recipe.params) console.log(`      ${p.name.padEnd(9)} ${p.value.padEnd(46)}  ← ${p.because}`);
  console.log(`\n6·👅  EXPECTED CUP   ${n.expectedCup}`);
  console.log(`7·🔧  ADJUSTMENT     ${n.adjustment}`);
  if (rec.recipe.scienceFlags.length) { console.log(`\n🔬  SCIENCE GATE`); for (const f of rec.recipe.scienceFlags) console.log(`      [${f.severity}] ${f.message}`); }

  const pr = b.profile;
  console.log(`\n▤  EVIDENCE PROFILE`);
  console.log(`      Scientific Support ${pr.scientificSupport} · Expert Consensus ${pr.expertConsensus} · Coffee Similarity ${pr.coffeeSimilarity}`);
  console.log(`      Freshness ${pr.evidenceFreshness} · Research Coverage ${pr.researchCoverage} · Source Diversity ${pr.sourceDiversity} · Stability ${pr.recommendationStability}`);
  console.log(`\n▥  EVIDENCE  (reviewed ${b.reviewedCount})`);
  console.log(`   Key supporting:`); for (const e of b.keySupporting) console.log(`      • ${e.label} (${e.strength})`);
  if (b.consensus.length) { console.log(`   Agreement:`); for (const c of b.consensus) console.log(`      + ${c}`); }
  if (b.conflicts.length) { console.log(`   Disagreement:`); for (const c of b.conflicts) console.log(`      ± ${c.note}`); }
  console.log(`   Remaining unknowns:`); for (const l of b.limitations) console.log(`      ? ${l}`);
  console.log(`\nℹ️   familiarity=${rec.meta.familiarity.toFixed(2)} · research=${rec.meta.researchFired} · applied=${rec.meta.principlesUsed.map((p) => p.id).join(',') || 'none'}\n`);
}
main().catch((e) => { console.error('ENGINE ERROR:', e.message); process.exit(1); });
