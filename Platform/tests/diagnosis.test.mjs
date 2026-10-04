/** M4 proof: tasted cup → correct cause → adjustment → equipment learning shifts the next recipe. */
import { createDiagnosisEngine } from '../packages/diagnosis/diagnosis-engine.ts';
import { createLearningEngine } from '../packages/learning/learning-engine.ts';
import { composeEngineStatic } from '../packages/engine/compose-static.ts';
import { recommend } from '../packages/engine/orchestrator.ts';

const dia = createDiagnosisEngine(), learn = createLearningEngine();
const strat = { id: 's1', primary: 'clarity', secondary: 'floral', tradeoffs: [], extractionTarget: { position: '', approach: '' }, constraintsFromIntent: [], rationale: '' };
const expected = { sweetness: .7, clarity: .8, body: .5, acidity: .6, floral: .6, juiciness: .6 };

let pass = 0, total = 0;
function check(label, cond) { total++; if (cond) pass++; console.log(`${cond ? '✅' : '❌'} ${label}`); }

// 1. hollow/sour → under-extraction → grind finer
const d1 = dia.diagnose(expected, { recipeRef: 's1', observed: { ...expected, sweetness: .35 }, notes: ['hollow'] }, strat);
check(`hollow → under-extraction (got "${d1.cause}")`, d1.cause === 'under-extraction');
check('under-extraction → grind finer', d1.adjustments.some(a => a.lever === 'grind' && /finer/.test(a.move)));

// 2. bitter → over-extraction → coarser
const d2 = dia.diagnose(expected, { recipeRef: 's1', observed: expected, notes: ['bitter'] }, strat);
check(`bitter → over-extraction (got "${d2.cause}")`, d2.cause === 'over-extraction');

// 2b. A stalled, mixed cup must not receive a finer-grind correction.
const d3 = dia.diagnose(expected, { recipeRef: 's1', observed: expected, notes: ['sour, bitter, drying, stalled drawdown'], execution: { drawdownSeconds: 245 } }, strat);
check(`stalled mixed cup → uneven extraction (got "${d3.cause}")`, d3.cause === 'uneven extraction / fines-heavy drawdown');
check('stalled mixed cup → one coarser correction only', d3.adjustments.length === 1 && d3.adjustments[0].lever === 'grind' && /coarser/.test(d3.adjustments[0].move));

// 3. learning routes under-extraction to equipment (grindBias finer)
const u = learn.apply(d1, { recipeRef: '', observed: {}, notes: [] });
check(`under-extraction learns equipment grindBias=finer (got ${u.scope}/${u.data?.grindBias})`, u.scope === 'equipment' && u.data?.grindBias === 'finer');

// 4. equipment calibration actually shifts the next recipe's grind
const deps = composeEngineStatic([]);
const obs = (eq) => recommend({ coffee: { roastLevel: 'light', process: 'washed' }, setup: {}, intent: { sweetness: .5, clarity: .9, body: .3, acidity: .7, floral: .6, juiciness: .5 }, unknowns: [], fingerprint: 'x' }, deps, eq);
const before = (await obs(undefined)).recipe.params.find(p => p.name === 'grind').value;
const after = (await obs({ equipment: { calibration: { grindBias: 'finer' } } })).recipe.params.find(p => p.name === 'grind').value;
check(`calibration shifts grind ONE step ("${before}" → "${after}")`, before !== after && /calibrated finer/.test(after) && /^fine/.test(after));

console.log(`\n${pass}/${total} M4 checks passed.`);
process.exit(pass === total ? 0 : 1);
