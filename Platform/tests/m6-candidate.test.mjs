import { proposeCandidate } from '../packages/ingestion/candidate.ts';

let pass = 0, total = 0;
function check(label, condition) { total++; if (condition) pass++; console.log(`${condition ? '✅' : '❌'} ${label}`); }

const base = {
  statement: 'A longer bloom improves even extraction in fresh light roasts.',
  mechanism: 'CO₂ blocks saturation until it escapes.', domain: 'bloom', sourceIds: ['SRC-1', 'SRC-2'], independentCount: 2,
};
const candidate = proposeCandidate({ ...base, origin: 'research' }, new Date('2026-07-31T00:00:00Z'));
check('two independent research sources create a review-only candidate', candidate?.status === 'needs_review');
check('candidate is never activated automatically', candidate?.status !== 'active');
check('one source cannot create a candidate', proposeCandidate({ ...base, origin: 'research', sourceIds: ['SRC-1'], independentCount: 1 }) === null);
check('three matching brews can create a setup candidate', proposeCandidate({ ...base, origin: 'brew-history', sourceIds: ['BRW-1', 'BRW-2', 'BRW-3'], independentCount: 3 })?.status === 'needs_review');

console.log(`\n${pass}/${total} M6 candidate checks passed.`);
process.exit(pass === total ? 0 : 1);
