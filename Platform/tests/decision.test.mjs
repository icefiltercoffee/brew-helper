import { buildDecision } from '../packages/decision/decision-engine.ts';

let pass = 0, total = 0;
function check(label, condition) { total++; if (condition) pass++; console.log(`${condition ? '✅' : '❌'} ${label}`); }

const evidence = { state: 'Well Supported' };
const strategy = { primary: 'clarity', secondary: 'floral', appliedPrincipleIds: ['PRN-0002'] };
const lightWashed = {
  coffee: { process: 'Washed', roastLevel: 'Light', altitude: '1,850 masl', roastAgeDays: 12 },
  setup: { brewer: 'Hario V60', grinder: 'Comandante C40' }, intent: {}, unknowns: ['waterProfile'], fingerprint: 'ethiopia-washed-light',
};
const dark = { ...lightWashed, coffee: { process: 'Natural', roastLevel: 'Dark', roastAgeDays: 18 } };

const a = buildDecision(strategy, lightWashed, evidence);
const b = buildDecision(strategy, dark, evidence);
check('dense light coffee selects a specific grinder target', a.next.lever === 'grind' && /Comandante C40: 24 clicks.+94°C/i.test(a.next.decision));
check('dark coffee selects a lower-temperature decision', b.next.lever === 'temp' && /89–90°C/.test(b.next.decision));
check('decision carries supporting principle ids', a.next.evidenceIds.includes('PRN-0002'));
check('counterfactuals cover all required controls', new Set(a.counterfactuals.map((x) => x.variable)).size === 9);

console.log(`\n${pass}/${total} decision checks passed.`);
process.exit(pass === total ? 0 : 1);
