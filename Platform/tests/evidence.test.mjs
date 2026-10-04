/** Evidence-Profile enhancement proof: no confidence %, rich Evidence Profile + Bundle + narrative + state. */
import { composeEngine } from '../packages/engine/compose.ts';
import { composeEngineStatic } from '../packages/engine/compose-static.ts';
import { recommend } from '../packages/engine/orchestrator.ts';

let pass = 0, total = 0;
const check = (l, c) => { total++; if (c) pass++; console.log(`${c ? '✅' : '❌'} ${l}`); };
const obs = (o) => ({ coffee: o.coffee, setup: {}, intent: o.intent, unknowns: o.unknowns ?? [], fingerprint: 'x' });

const rich = await recommend(obs({
  coffee: { origin: 'Panama', process: 'Anaerobic Natural', roastLevel: 'light' },
  intent: { sweetness: .8, clarity: .85, body: .45, acidity: .7, floral: .6, juiciness: .7 }, unknowns: ['waterProfile'],
}), composeEngine());

check('confidence retired (no confidence field anywhere)', !('confidence' in rich) && !('confidence' in rich.meta));
check('Evidence Profile has all 8 dimensions', Object.keys(rich.bundle.profile).length === 8);
check('state is a valid label', ['Highly Supported', 'Well Supported', 'Exploratory', 'Experimental'].includes(rich.bundle.state));
check('narrative has 6 mentor fields', ['judgement', 'strategyLine', 'evidenceSummary', 'tradeoffs', 'expectedCup', 'adjustment'].every((k) => typeof rich.narrative[k] === 'string' && rich.narrative[k].length));
check('bundle reviewedCount > 0', rich.bundle.reviewedCount > 0);
check('primary assumption present (limited direct data)', rich.bundle.assumptions.length > 0);
check('remaining unknowns present', rich.bundle.limitations.length > 0);
check('profile levels are qualitative (not numbers)', Object.values(rich.bundle.profile).every((v) => ['High', 'Moderate', 'Limited', 'None'].includes(v)));

const novel = await recommend(obs({
  coffee: { origin: 'Narnia', process: 'Mystery' },
  intent: { sweetness: .5, clarity: .5, body: .5, acidity: .5, floral: .5, juiciness: .5 },
}), composeEngineStatic([]));
check('novel coffee → Experimental state', novel.bundle.state === 'Experimental');

console.log(`\n${pass}/${total} evidence-profile checks passed.`);
process.exit(pass === total ? 0 : 1);
