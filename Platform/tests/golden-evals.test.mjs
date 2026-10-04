/** Production hardening: stable decision shape for high-risk extraction cases. */
import { composeEngineStatic } from '../packages/engine/compose-static.ts';
import { recommend } from '../packages/engine/orchestrator.ts';

const deps = composeEngineStatic([]);
let pass = 0, total = 0;
function check(label, condition) { total++; if (condition) pass++; console.log(`${condition ? '✅' : '❌'} ${label}`); }
const intent = { sweetness: .6, clarity: .8, body: .4, acidity: .6, floral: .7, juiciness: .5 };

const cases = [
  { name: 'dense light washed', coffee: { roastLevel: 'light', process: 'washed', altitude: '1,850 masl', roastAgeDays: 12 }, expectedLever: 'grind' },
  { name: 'fresh coffee', coffee: { roastLevel: 'medium-light', process: 'washed', roastAgeDays: 3 }, expectedLever: 'bloom' },
  { name: 'dark roast', coffee: { roastLevel: 'dark', process: 'natural', roastAgeDays: 18 }, expectedLever: 'temp' },
];

for (const c of cases) {
  const r = await recommend({ coffee: c.coffee, setup: { brewer: 'Hario V60' }, intent, unknowns: ['waterProfile', 'filter'], fingerprint: c.name }, deps);
  check(`${c.name} selects the right control`, r.decision.next.lever === c.expectedLever);
  check(`${c.name} has no recipe-derived decision`, !/recipe|routine/i.test(r.decision.next.decision));
  check(`${c.name} preserves evidence and science gates`, Boolean(r.bundle) && Array.isArray(r.recipe.scienceFlags));
}

console.log(`\n${pass}/${total} golden evaluation checks passed.`);
process.exit(pass === total ? 0 : 1);
