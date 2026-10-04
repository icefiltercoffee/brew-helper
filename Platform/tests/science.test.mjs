/** M2 proof: the science gate catches physically-wrong recipes and passes good ones. */
import { createScienceEngine } from '../packages/science/validate.ts';

const sci = createScienceEngine();
const mk = (params) => ({ strategyRef: 's', params: params.map(([name, value]) => ({ name, value, because: '', serves: 's', lever: 'temp' })), steps: [], predictedCup: {}, scienceFlags: [] });
let pass = 0;

const cases = [
  { label: 'BAD: dark roast, 96°C, fine, long', obs: { coffee: { roastLevel: 'dark', process: 'washed' } },
    recipe: mk([['temp', '96°C'], ['grind', 'fine'], ['ratio', '1:16'], ['total time', '4:00'], ['agitation', 'strong']]), expectVeto: true },
  { label: 'RISKY: light roast, 88°C, coarse (under-extract)', obs: { coffee: { roastLevel: 'light', altitude: '1,850 masl', process: 'washed' } },
    recipe: mk([['temp', '88°C'], ['grind', 'coarse'], ['ratio', '1:16.5'], ['total time', '2:30'], ['agitation', 'gentle']]), expectVeto: false },
  { label: 'GOOD: light washed, 93°C, medium-fine, gentle', obs: { coffee: { roastLevel: 'light', altitude: '1,850 masl', process: 'washed' } },
    recipe: mk([['temp', '93°C'], ['grind', 'medium-fine'], ['ratio', '1:16.5'], ['total time', '2:30'], ['agitation', 'gentle, even pours']]), expectVeto: false },
];

for (const c of cases) {
  const v = sci.validateRecipe(c.recipe, c.obs);
  const vetoed = v.flags.some((f) => f.severity === 'veto');
  const ok = vetoed === c.expectVeto;
  pass += ok ? 1 : 0;
  console.log(`${ok ? '✅' : '❌'} ${c.label}`);
  for (const f of v.flags) console.log(`      [${f.severity}] ${f.message}`);
}
console.log(`\n${pass}/${cases.length} science-gate cases behaved as expected.`);
process.exit(pass === cases.length ? 0 : 1);
