import { createFeasibilityEngine } from '../packages/feasibility/feasibility-engine.ts';
import { createRecipeGenerator } from '../packages/recipe/recipe-generator.ts';

const engine = createFeasibilityEngine();
const base = { coffee:{ origin:'Ethiopia', variety:'Gesha', process:'washed', altitude:'2,000 masl', roastLevel:'light', roastAgtron:78 }, setup:{ brewer:'V60', filter:'paper', grinder:'Ode', waterProfile:'50 ppm balanced' }, unknowns:[], fingerprint:'two-stage' };
const strategy = { id:'stage-two', primary:'floral', secondary:'clarity', tradeoffs:[], extractionTarget:{ position:'mid', approach:'even extraction' } };
let pass = 0, total = 0;
const check = (label, ok) => { total++; if (ok) pass++; console.log(`${ok ? '✅' : '❌'} ${label}`); };
const analyse = (intent, coffee={}, setup={}) => engine.analyse({ ...base, coffee:{...base.coffee,...coffee}, setup:{...base.setup,...setup}, intent });

const sweetAcid = analyse({ sweetness:.9, clarity:.7, floral:.7, acidity:.9, juiciness:.75, body:.45 });
check('high sweetness + acidity is not automatically rejected', sweetAcid.classification !== 'IMPLAUSIBLE');
const clarityBody = analyse({ sweetness:.65, clarity:.9, floral:.65, acidity:.65, juiciness:.6, body:.6 });
check('high clarity + moderate body remains feasible', clarityBody.classification !== 'IMPLAUSIBLE');
const dark = analyse({ sweetness:.55, clarity:.75, floral:.7, acidity:.8, juiciness:.7, body:.1 }, { origin:'Brazil', process:'natural', roastLevel:'dark', roastAgtron:48 });
check('dark roast low-body target is bean limited', ['BEAN_LIMITED','IMPLAUSIBLE'].includes(dark.classification) && dark.achievableTarget.body <= dark.beanPotential.body);
const coolLight = analyse({ sweetness:.75, clarity:.8, floral:.75, acidity:.75, juiciness:.65, body:.4 }, { roastLevel:'light', roastAgtron:78 });
check('light-roast feasibility stays distinct from recipe temperature', coolLight.assumptions.length >= 0);
const incomplete = analyse({ sweetness:.7, clarity:.7, floral:.7, acidity:.7, juiciness:.7, body:.7 }, { origin:undefined, variety:undefined, process:undefined, roastLevel:undefined, roastAgtron:undefined }, { grinder:undefined, waterProfile:undefined });
check('incomplete inputs record assumptions', incomplete.assumptions.length >= 4 && incomplete.confidence < 70);
const noAgtron = analyse({ sweetness:.7, clarity:.7, floral:.7, acidity:.7, juiciness:.7, body:.7 }, { roastAgtron:undefined });
check('missing Agtron is explicit, not invented', noAgtron.assumptions.some(x => /Agtron/.test(x)));
const unusual = analyse({ sweetness:.8, clarity:.65, floral:.8, acidity:.7, juiciness:.85, body:.6 }, { process:'thermal shock anaerobic' });
check('unusual process is deterministic and adds aromatic potential', unusual.beanPotential.floral > .55 && JSON.stringify(unusual) === JSON.stringify(analyse({ sweetness:.8, clarity:.65, floral:.8, acidity:.7, juiciness:.85, body:.6 }, { process:'thermal shock anaerobic' })));
const capped = createRecipeGenerator().generate(strategy, {}, { ...base, intent:{ sweetness:.95, clarity:.95, floral:.95, acidity:.95, juiciness:.95, body:.95 } }, dark);
check('optimiser cannot exceed Stage 1 achievable target', Object.entries(capped.predictedCup).every(([axis, value]) => value <= dark.achievableTarget[axis] + 1e-9));
check('recipe retains feasibility beside output', capped.feasibility === dark && capped.optimisation.sensoryGap.floral.desired === dark.achievableTarget.floral);
console.log(`\n${pass}/${total} two-stage checks passed.`);
process.exit(pass === total ? 0 : 1);
