import { createRecipeGenerator } from '../packages/recipe/recipe-generator.ts';

let pass = 0, total = 0;
const check = (label, condition) => { total++; if (condition) pass++; console.log(`${condition ? '✅' : '❌'} ${label}`); };
const intent = { sweetness: .7, clarity: .95, body: .4, acidity: .65, floral: .7, juiciness: .65 };
const strategy = { id: 's-gap', primary: 'clarity', secondary: 'floral', tradeoffs: ['accept less body'], extractionTarget: { position: 'mid', approach: 'evenness first' }, constraintsFromIntent: [], rationale: 'test' };
const observation = {
  coffee: { roastLevel: 'light', process: 'washed' }, setup: { brewer: 'V60', grinder: 'Unknown grinder' }, intent,
  unknowns: ['waterProfile'], fingerprint: 'gap-test',
  brewContext: { currentRecipe: { grind: 'medium-fine', temp: '93°C' }, currentCup: { sweetness: .35, clarity: .7, body: .3, acidity: .7, floral: .55, juiciness: .4, defects: ['thin', 'sour', 'hollow'], confidence: 'High' } },
};

const recipe = createRecipeGenerator().generate(strategy, {}, observation);
check('baseline retained separately', recipe.optimisation.baselineRecipe.find((p) => p.name === 'grind').value === 'medium-fine');
check('direct cup feedback overrides the model', recipe.optimisation.estimatedCurrentProfile.evidenceSource === 'current cup');
check('defect correction outranks high clarity', recipe.optimisation.primaryObjective.includes('under-extraction'));
check('under-extracted cup moves finer, never coarser', recipe.optimisation.grindAdjustment.direction === 'finer');
check('grind movement remains inside two-step guardrail', recipe.optimisation.grindAdjustment.calibratedSteps <= 2);
check('unknown grinder does not invent a mapping', recipe.optimisation.grindAdjustment.mappedValue === undefined && recipe.optimisation.grindAdjustment.confidence === 'Limited');
check('only one material change is made', recipe.optimisation.materialChanges.length === 1);
check('next step holds other variables stable', /Hold every other variable stable/.test(recipe.optimisation.nextAdjustment));
check('unknown water and grinder lower decision confidence', recipe.optimisation.confidence === 'Limited');

const calibrated = createRecipeGenerator().generate(strategy, { grinder: 'Ode', calibration: { grindUnit: 'calibrated step' } }, {
  ...observation,
  setup: { brewer: 'V60', grinder: 'Ode', waterProfile: 'known recipe water' },
  unknowns: [],
  brewContext: { ...observation.brewContext, currentRecipe: { ...observation.brewContext.currentRecipe, 'total time': '2:45' } },
});
check('direct feedback plus calibrated setup supports high confidence', calibrated.optimisation.confidence === 'High');

console.log(`\n${pass}/${total} optimisation checks passed.`);
process.exit(pass === total ? 0 : 1);
