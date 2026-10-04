/** Bug sweep: engine must never crash on degenerate inputs. */
import { composeEngine } from '../packages/engine/compose.ts';
import { recommend } from '../packages/engine/orchestrator.ts';

const deps = composeEngine();
const cases = [
  ['empty coffee, mid intent', { coffee: {}, setup: {}, intent: { sweetness: .5, clarity: .5, body: .5, acidity: .5, floral: .5, juiciness: .5 }, unknowns: [], fingerprint: 'x' }],
  ['all-zero intent', { coffee: { roastLevel: 'dark', process: 'natural' }, setup: {}, intent: { sweetness: 0, clarity: 0, body: 0, acidity: 0, floral: 0, juiciness: 0 }, unknowns: [], fingerprint: 'y' }],
  ['all-max intent, dense light', { coffee: { roastLevel: 'light', process: 'washed', altitude: '2000 masl' }, setup: {}, intent: { sweetness: 1, clarity: 1, body: 1, acidity: 1, floral: 1, juiciness: 1 }, unknowns: [], fingerprint: 'z' }],
];
let ok = 0;
for (const [label, obs] of cases) {
  try {
    const r = await recommend(obs, deps);
    const bad = !r.narrative?.judgement || !r.strategy?.primary || !Array.isArray(r.recipe?.params) || r.recipe.params.length === 0 || !r.bundle?.state;
    console.log(`${bad ? '❌' : '✅'} [${label}] primary=${r.strategy.primary} state=${r.bundle.state} applied=${r.meta.principlesUsed.map(p => p.id).join(',') || 'none'} params=${r.recipe.params.length}`);
    ok += bad ? 0 : 1;
  } catch (e) { console.log(`❌ [${label}] THREW: ${e.message}`); }
}
console.log(`\n${ok}/${cases.length} degenerate inputs handled without crashing.`);
process.exit(ok === cases.length ? 0 : 1);
