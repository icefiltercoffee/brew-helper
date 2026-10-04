import { coupleRadarValues, interpretRadar } from '../packages/strategy/radar-interpreter.ts';
import { createStrategyGenerator } from '../packages/strategy/strategy-generator.ts';

let pass = 0, total = 0;
const check = (label, condition) => { total++; if (condition) pass++; console.log(`${condition ? '✅' : '❌'} ${label}`); };
const obs = (intent, setup = { brewer: 'V60', filter: 'paper', grinder: 'Unknown grinder' }) => ({ coffee: { roastLevel: 'light', process: 'washed' }, setup, intent, unknowns: [], fingerprint: 'radar' });
const reading = { inferences: [], risks: [] };

const a69 = interpretRadar({ clarity:.69, body:.4, sweetness:.5, floral:.5, acidity:.5, juiciness:.5 }, obs({ clarity:.69, body:.4, sweetness:.5, floral:.5, acidity:.5, juiciness:.5 }));
const a70 = interpretRadar({ clarity:.70, body:.4, sweetness:.5, floral:.5, acidity:.5, juiciness:.5 }, obs({ clarity:.70, body:.4, sweetness:.5, floral:.5, acidity:.5, juiciness:.5 }));
check('raw priorities are preserved as 0–100', a69.axes.clarity.rawPriority === 69);
check('zone boundary remains smooth', Math.abs(a70.axes.clarity.relativeWeight - a69.axes.clarity.relativeWeight) < .02);

const flatIntent = { clarity:.9, body:.92, sweetness:.88, floral:.91, acidity:.89, juiciness:.9 };
const flatObs = obs(flatIntent);
const flat = createStrategyGenerator().generate({ claims: [], intent: flatIntent, interpretation: reading, observation: flatObs });
check('all-high flat profile is balanced', flat.radarInterpretation.balanced && flat.primary === 'balance');
check('flat profile does not manufacture a trade-off', flat.tradeoffs.length === 0);

const compatibleIntent = { clarity:.8, floral:.82, body:.4, sweetness:.6, acidity:.65, juiciness:.55 };
const compatible = interpretRadar(compatibleIntent, obs(compatibleIntent, { brewer:'V60', filter:'paper', grinder:'Ode flat burr' }));
check('clarity + floral resolves as an interaction', compatible.interactions.some((x) => x.startsWith('clarity + floral')));
check('compatible high priorities do not trigger conflict', compatible.conflictNote === undefined);

const conflictIntent = { clarity:.95, body:.94, sweetness:.5, floral:.5, acidity:.5, juiciness:.5 };
const constrained = interpretRadar(conflictIntent, obs(conflictIntent));
const capable = interpretRadar(conflictIntent, obs(conflictIntent, { brewer:'Switch', filter:'paper', grinder:'Ode flat burr' }));
check('equipment-constrained extreme clarity + body can trigger conflict', Boolean(constrained.conflictNote));
check('capable equipment avoids automatic conflict', capable.conflictNote === undefined);

const coupling = [
  [0,-.3,0,.4,-.35,-.15],[-.3,0,.35,0,-.4,.35],[0,.35,0,.35,-.25,.3],
  [.4,0,.35,0,0,0],[-.35,-.4,-.25,0,0,-.6],[-.15,.35,.3,0,-.6,0],
];
const raisedBody = coupleRadarValues([.5,.5,.5,.5,.5,.5], 4, 1, coupling);
check('direct coupling visibly lowers clarity when body rises', raisedBody[4] === 1 && raisedBody[5] < .5);
let allMaxAttempt = [.5,.5,.5,.5,.5,.5];
for (let i = 0; i < 6; i++) allMaxAttempt = coupleRadarValues(allMaxAttempt, i, 1, coupling);
check('sequential max attempt cannot leave every axis maxed', !allMaxAttempt.every((v) => v >= .99));
check('direct coupling always remains inside visible bounds', allMaxAttempt.every((v) => v >= .08 && v <= 1));

console.log(`\n${pass}/${total} radar interpretation checks passed.`);
process.exit(pass === total ? 0 : 1);
