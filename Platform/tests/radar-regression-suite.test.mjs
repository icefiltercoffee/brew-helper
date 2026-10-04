import { readFileSync } from 'node:fs';
import { interpret } from '../packages/interpret/interpretation-engine.ts';
import { createStrategyGenerator } from '../packages/strategy/strategy-generator.ts';
import { createRecipeGenerator } from '../packages/recipe/recipe-generator.ts';
import { coupleRadarValues } from '../packages/strategy/radar-interpreter.ts';

let pass = 0, total = 0;
const check = (label, condition) => { total++; if (condition) pass++; console.log(`${condition ? '✅' : '❌'} ${label}`); };
const mid = { sweetness:.5, clarity:.5, body:.5, acidity:.5, floral:.5, juiciness:.5 };
const setup = { brewer:'Hario V60', filter:'paper', grinder:'Ode', waterProfile:'known recipe water' };
const coffee = { roastLevel:'light', process:'washed', altitude:'1850 masl' };
const make = (intent, extra = {}, equipment = {}) => {
  const observation = {
    coffee: { ...coffee, ...(extra.coffee || {}) }, setup: { ...setup, ...(extra.setup || {}) }, intent,
    unknowns: extra.unknowns || [], fingerprint: extra.fingerprint || 'radar-regression',
    ...(extra.brewContext ? { brewContext: extra.brewContext } : {}),
  };
  const strategy = createStrategyGenerator().generate({ claims:[], intent, interpretation:interpret(observation), observation });
  return { observation, strategy, recipe:createRecipeGenerator().generate(strategy, equipment, observation) };
};
const p = (r, name, baseline = false) => (baseline ? r.optimisation.baselineRecipe : r.params).find(x => x.name === name);
const number = s => Number(String(s).match(/-?\d+(?:\.\d+)?/)?.[0]);
const clock = s => { const m = String(s).match(/(\d+):(\d+)/); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };

// 1 — High clarity, low body.
const t1 = make({ clarity:.9, body:.2, sweetness:.65, floral:.8, acidity:.6, juiciness:.55 });
check('T1 preserves raw clarity/body', t1.strategy.radarInterpretation.axes.clarity.rawPriority === 90 && t1.strategy.radarInterpretation.axes.body.rawPriority === 20);
check('T1 treats clarity/floral as dominant and states body trade-off', t1.strategy.primary === 'clarity' && t1.strategy.secondary === 'floral' && t1.strategy.tradeoffs.some(x => /body/.test(x)));
check('T1 creates baseline first and bounds a single adjustment', t1.recipe.optimisation.baselineRecipe.length > 0 && t1.recipe.optimisation.materialChanges.length <= 1 && t1.recipe.optimisation.grindAdjustment.calibratedSteps <= 2);
check('T1 protects extraction depth and is not High without feedback', number(p(t1.recipe,'temp').value) >= 93 && t1.recipe.optimisation.confidence !== 'High');

// 2 — High body, low clarity.
const t2 = make({ body:.9, clarity:.2, sweetness:.75, floral:.35, acidity:.45, juiciness:.7 });
check('T2 prioritises body and changes the minimum variables', t2.strategy.primary === 'body' && t2.recipe.optimisation.materialChanges.length === 1);
check('T2 uses bounded concentration without lowering temperature', p(t2.recipe,'ratio').value === '1:15.5' && p(t2.recipe,'temp').value === p(t2.recipe,'temp',true).value);
check('T2 protects sweetness and names muddiness/clogging risk', t2.recipe.predictedCup.sweetness >= t2.recipe.optimisation.estimatedCurrentProfile.profile.sweetness && /muddy|clog/i.test(p(t2.recipe,'ratio').because));
check('T2 avoids misleading scorching/heavy-compound claims', !/scorch|heavier compounds/i.test(t2.recipe.params.map(x => x.because).join(' ')));

// 3 — High clarity and high body.
const tensionSetup = { setup:{ grinder:'Unknown grinder' }, unknowns:['waterProfile'] };
const t3 = make({ ...mid, clarity:.9, body:.9 }, tensionSetup);
check('T3 detects a contextual tension without normalising inputs', Boolean(t3.strategy.radarInterpretation.conflictNote) && t3.strategy.radarInterpretation.axes.clarity.rawPriority === 90 && t3.strategy.radarInterpretation.axes.body.rawPriority === 90);
check('T3 still generates a bounded recipe and explains a trade-off', t3.recipe.params.length > 0 && t3.recipe.optimisation.materialChanges.length <= 2 && t3.strategy.tradeoffs.length === 1);
check('T3 never declares the combination impossible', !/impossible|can never coexist/i.test(t3.strategy.rationale));

// 4 — All values at 90.
const all90 = make({ sweetness:.9, clarity:.9, body:.9, acidity:.9, floral:.9, juiciness:.9 });
check('T4 keeps every raw value at 90 and finds no dominant direction', Object.values(all90.strategy.radarInterpretation.axes).every(x => x.rawPriority === 90) && all90.strategy.primary === 'balance');
check('T4 preserves baseline with no large adjustment and continues', all90.recipe.optimisation.materialChanges.length === 0 && all90.recipe.params.length > 0 && /coherence|evenness/.test(all90.strategy.extractionTarget.approach));

// 5 — Clarity target with thin, sour, hollow, fast cup.
const t5 = make({ ...mid, clarity:.9 }, { brewContext:{ currentRecipe:{ grind:'medium-fine', temp:'94°C', 'total time':'2:10' }, currentCup:{ ...mid, clarity:.7, sweetness:.25, body:.2, defects:['thin','sour','hollow','unusually fast'], confidence:'High' } } });
check('T5 direct defects override clarity and diagnose under-extraction', /under-extraction/.test(t5.recipe.optimisation.primaryObjective) && t5.recipe.optimisation.estimatedCurrentProfile.evidenceSource === 'current cup');
check('T5 moves finer, never coarser or shorter', t5.recipe.optimisation.grindAdjustment.direction === 'finer' && clock(p(t5.recipe,'total time').value) >= clock(p(t5.recipe,'total time',true).value));
check('T5 does not relabel sourness as desirable acidity', !/desirable acidity/i.test(t5.recipe.params.map(x => x.because).join(' ')));

// 6 — Several priorities suggest related levers.
const t6 = make({ ...mid, clarity:.9, floral:.9, acidity:.85 });
check('T6 resolves interaction before one bounded change', t6.strategy.radarInterpretation.interactions.length > 0 && t6.recipe.optimisation.materialChanges.length <= 1 && t6.recipe.optimisation.grindAdjustment.calibratedSteps <= 2);
check('T6 does not reduce both temperature and time', !(p(t6.recipe,'temp').value !== p(t6.recipe,'temp',true).value && p(t6.recipe,'total time').value !== p(t6.recipe,'total time',true).value));
check('T6 protects sweetness/extraction from a hollow result', number(p(t6.recipe,'temp').value) >= 92 && p(t6.recipe,'total time').value === p(t6.recipe,'total time',true).value);

// 7 — Unknown grinder.
const t7 = make({ ...mid, sweetness:.9 }, { setup:{ grinder:undefined }, unknowns:['grinder','waterProfile'] });
check('T7 uses direction without invented grinder units', t7.recipe.optimisation.grindAdjustment.mappedValue === undefined && !/click|dial|setting \d/i.test(t7.recipe.params.map(x => x.value).join(' ')));
check('T7 reduces confidence and invites calibration honestly', t7.recipe.optimisation.confidence === 'Limited' && /calibration|approximate/i.test(t7.recipe.optimisation.grindAdjustment.limitReason));

// 8 — Neutral profile.
const neutral = make({ sweetness:.48, clarity:.52, body:.5, acidity:.49, floral:.51, juiciness:.5 });
check('T8 preserves baseline with no conflict or random dominant axis', neutral.strategy.primary === 'balance' && !neutral.strategy.radarInterpretation.conflictNote && neutral.recipe.optimisation.materialChanges.length === 0);

// 9 — Direct bitter/dry feedback overrides a sweet model.
const t9 = make({ ...mid, sweetness:.8 }, { brewContext:{ currentRecipe:{ grind:'medium-fine', temp:'94°C', 'total time':'3:05' }, currentCup:{ sweetness:.25, clarity:.45, body:.65, acidity:.3, floral:.3, juiciness:.3, defects:['dry','bitter'], confidence:'High' } } });
check('T9 uses reported cup instead of model sweetness', t9.recipe.optimisation.estimatedCurrentProfile.evidenceSource === 'current cup' && t9.recipe.optimisation.estimatedCurrentProfile.profile.sweetness === .25);
check('T9 investigates over-extraction and moves coarser', /over-extraction/.test(t9.recipe.optimisation.primaryObjective) && t9.recipe.optimisation.grindAdjustment.direction === 'coarser');

// 10–11 — Guardrails and minimum-change principle.
for (const [name, run] of [['clarity',t1],['body',t2],['feedback',t5],['interaction',t6]]) {
  const tempDelta = Math.abs(number(p(run.recipe,'temp').value) - number(p(run.recipe,'temp',true).value));
  const ratioDelta = Math.abs(number(p(run.recipe,'ratio').value.split(':')[1]) - number(p(run.recipe,'ratio',true).value.split(':')[1]));
  const timeDelta = Math.abs(clock(p(run.recipe,'total time').value) - clock(p(run.recipe,'total time',true).value));
  check(`T10 ${name} remains inside all numeric guardrails`, run.recipe.optimisation.grindAdjustment.calibratedSteps <= 2 && tempDelta <= 2 && ratioDelta <= 1 && timeDelta <= 20);
}
check('T11 one defect changes one primary and at most one support', t5.recipe.optimisation.materialChanges.length <= 2 && /Hold every other variable stable/.test(t5.recipe.optimisation.nextAdjustment));

// 12 — Explanation contract and UI binding.
const html = readFileSync(new URL('../../brew-helper-site/index.html', import.meta.url), 'utf8');
const recipeUi = html.slice(html.indexOf('id="recipeDetail"'), html.indexOf('/* concrete inline explanation'));
check('T12 every recommendation retains explanation inputs', [t1,t2,t5].every(x => x.recipe.optimisation.baselineRecipe.length && x.recipe.optimisation.primaryObjective && x.recipe.optimisation.tradeoffs && x.recipe.optimisation.confidence && x.recipe.optimisation.observationTarget && x.recipe.optimisation.nextAdjustment));
check('T12 every final parameter has contextual reason and strategy trace', [t1,t2,t5].every(x => x.recipe.params.every(y => y.because && y.serves === x.strategy.id)));
check('T12 Recipe keeps the prior compact presentation', !recipeUi.includes('Plan logic') && recipeUi.includes('Why this recipe?'));
check('T12 observation and adjustment stay internal, not in recipe UI', !recipeUi.includes('>Next observation<') && !recipeUi.includes('>Next adjustment<'));
const coachUi = html.slice(html.indexOf('function updateCoach()'), html.indexOf('/* dragging */'));
check('T12 coach follows the selected priority before bean descriptors', !coachUi.includes('noteMove') && ['Clarity','Floral','Sweetness','Body','Acidity','Juiciness'].every(x => coachUi.includes(`${x}:`)));

// 13 — Confidence calibration.
const scenario = { ...mid, sweetness:.8 };
const a = make(scenario, { brewContext:{ currentRecipe:{ grind:'medium', 'total time':'2:45' }, currentCup:{ ...mid, sweetness:.3, defects:['hollow'], confidence:'High' } } }, { grinder:'Ode', calibration:{ grindUnit:'calibrated step' } });
const b = make(scenario);
const c = make(scenario, { coffee:{ roastLevel:undefined }, setup:{ grinder:undefined, waterProfile:undefined }, unknowns:['grinder','waterProfile','roastLevel'] });
check('T13 A/B/C map to High/Medium/Low reliability', a.recipe.optimisation.confidence === 'High' && b.recipe.optimisation.confidence === 'Moderate' && c.recipe.optimisation.confidence === 'Limited');
check('T13 confidence contains no unsupported percentages', !/confidence[^\n%]{0,40}%/i.test(html));

// 14 — Existing surfaces and one reasoning engine remain intact.
check('T14 intake, recipe, reflection, evidence, history and comparison surfaces remain', ['new-brew','brewText','recipeDetail','diagnoseBtn','successList','brewHistory'].every(id => html.includes(`id="${id}"`)));
check('T14 radar extends the existing strategy/recipe contracts', t1.recipe.strategyRef === t1.strategy.id && t1.strategy.radarInterpretation && !html.includes('parallelRadarEngine'));

// Saved-bean and future-input coverage — all use the same coupled path.
const coupling = [[0,-.3,0,.4,-.35,-.15],[-.3,0,.35,0,-.4,.35],[0,.35,0,.35,-.25,.3],[.4,0,.35,0,0,0],[-.35,-.4,-.25,0,0,-.6],[-.15,.35,.3,0,-.6,0]];
let coupled = [.5,.5,.5,.5,.5,.5];
for (let i=0;i<6;i++) coupled=coupleRadarValues(coupled,i,1,coupling);
const coupledIntent = { sweetness:coupled[0], floral:coupled[1], acidity:coupled[2], juiciness:coupled[3], body:coupled[4], clarity:coupled[5] };
const beans = [
  ['Franceschi','washed','medium-light'],['Corpachi','honey','medium-light'],['Urabeast','honey','medium-light'],
  ['Huro','anaerobic','medium-light'],['Handege','washed','medium-light'],['Sidra','washed','medium-light'],['Mejorado','washed','medium-light'],
];
for (const [name,process,roastLevel] of beans) {
  const run=make(coupledIntent,{coffee:{process,roastLevel},fingerprint:`bean-${name}`});
  check(`Bean ${name} uses coupled values and still generates one bounded plan`, !Object.values(run.observation.intent).every(v=>v>=.99) && run.recipe.params.length>0 && run.recipe.optimisation.materialChanges.length<=2);
}
check('Future manual inputs call the shared coupling engine', html.includes('window.BrewEngine.coupleRadarValues(vals,i'));

console.log(`\n${pass}/${total} Prompt 4 radar regression checks passed.`);
process.exit(pass === total ? 0 : 1);
