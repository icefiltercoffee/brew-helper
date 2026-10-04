/** M1/M2 proof: coffee facts change the strategy, gear constrains methods, and vetoes self-correct. */
import { interpret } from '../packages/interpret/interpretation-engine.ts';
import { createStrategyGenerator } from '../packages/strategy/strategy-generator.ts';
import { createScienceEngine } from '../packages/science/validate.ts';

let pass = 0, total = 0;
const check = (label, condition) => { total++; if (condition) pass++; console.log(`${condition ? '✅' : '❌'} ${label}`); };

const intent = { sweetness: .8, clarity: .9, body: .3, acidity: .6, floral: .5, juiciness: .5 };
const v60 = {
  coffee: { roastLevel: 'light', altitude: '1,850 masl', process: 'washed' },
  setup: { brewer: 'Hario V60' }, intent, unknowns: ['waterProfile'], fingerprint: 'colombia-washed-light',
};
const reading = interpret(v60);
check('high-grown light coffee produces a density inference', reading.inferences.some((i) => i.property === 'density' && i.value === 'high'));
check('washed coffee produces an agitation risk', reading.risks.some((r) => /agitation/.test(r.risk)));

const switchPrinciple = {
  id: 'P-switch', statement: 'Staged percolation and immersion preserve clarity and build sweetness.', domain: 'pour', mechanism: '',
  appliesWhen: ['clarity and sweetness'], levers: ['pour'], strategyImplication: 'Use a Switch for staged extraction.', confidence: .7,
  evidence: { sources: ['SRC-X'], recipes: ['RCP-X'], independentCount: 2 }, status: 'active', version: 1,
};
const strategy = createStrategyGenerator([switchPrinciple]).generate({ claims: [], intent, interpretation: reading, observation: v60 });
check('strategy uses the coffee interpretation', /needs enough energy/i.test(strategy.rationale));
check('V60 does not receive a Switch-only method', strategy.methodHint === undefined);

const science = createScienceEngine();
const unsafe = {
  strategyRef: 's', predictedCup: intent, scienceFlags: [], steps: [],
  params: [
    { name: 'temp', value: '96°C', because: 'test', serves: 's', lever: 'temp' },
    { name: 'grind', value: 'fine', because: 'test', serves: 's', lever: 'grind' },
    { name: 'ratio', value: '1:16', because: 'test', serves: 's', lever: 'ratio' },
    { name: 'total time', value: '4:00', because: 'test', serves: 's', lever: 'time' },
    { name: 'agitation', value: 'strong', because: 'test', serves: 's', lever: 'agitation' },
  ],
};
const dark = { ...v60, coffee: { roastLevel: 'dark', process: 'washed' } };
check('unsafe dark-roast recipe is vetoed', !science.validateRecipe(unsafe, dark).ok);
const corrected = science.correctRecipe(unsafe, dark);
check('science correction produces a valid dark-roast temperature', science.validateRecipe(corrected, dark).ok && corrected.params.find((p) => p.name === 'temp')?.value === '90°C');

console.log(`\n${pass}/${total} M1/M2 checks passed.`);
process.exit(pass === total ? 0 : 1);
