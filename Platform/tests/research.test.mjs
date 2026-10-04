/** M5 proof: research is registry-gated, budget-bounded, and only fires when unfamiliar. */
import { loadSourceRegistry } from '../packages/research/source-registry.ts';
import { createResearchManager, createFamiliarityRouter } from '../packages/research/router.ts';
import { MockSearchProvider } from '../packages/research/search-provider.ts';
import { createStaticMemoryManager } from '../packages/memory/static.ts';
import { createScienceEngine } from '../packages/science/validate.ts';
import { createEvidenceSynth } from '../packages/evidence/synthesise.ts';
import { createStrategyGenerator } from '../packages/strategy/strategy-generator.ts';
import { createRecipeGenerator } from '../packages/recipe/recipe-generator.ts';
import { recommend } from '../packages/engine/orchestrator.ts';

let pass = 0, total = 0;
const check = (l, c) => { total++; if (c) pass++; console.log(`${c ? '✅' : '❌'} ${l}`); };

const reg = loadSourceRegistry();
check('registry: apartment.coffee trusted', reg.isTrusted('apartment.coffee'));
check('registry: apartment.coffee tier B', reg.tierOf('apartment.coffee') === 'B');
check('registry: random-blog.com NOT trusted', !reg.isTrusted('random-blog.com'));
// channel-specific trust: Hoffmann (C) vs Hedrick (B) both on youtube.com
check('youtube channel granularity: Hoffmann → C', reg.tierOf('youtube.com/@jameshoffmann') === 'C');
check('youtube channel granularity: Hedrick → B', reg.tierOf('youtube.com/@LanceHedrick') === 'B');

// fixture provider: one trusted (Apartment) + one untrusted doc
const fixtures = [
  { url: 'https://apartment.coffee/guide', domain: 'apartment.coffee', title: 'Clarity-first V60 uses a 1:17 ratio and gentle pours', text: 'ratio pour clarity washed ethiopia brewing' },
  { url: 'https://random-blog.com/x', domain: 'random-blog.com', title: 'Just blast boiling water', text: 'ethiopia brewing' },
];
const research = createResearchManager({ provider: new MockSearchProvider(fixtures), registry: reg, budget: 5 });
const obs = { coffee: { origin: 'Ethiopia', process: 'Washed' }, setup: {}, intent: { sweetness: .5, clarity: .9, body: .3, acidity: .7, floral: .6, juiciness: .5 }, unknowns: [], fingerprint: 'e' };
const results = await research.maybeResearch(obs, 0);
check(`research returns only trusted domain (got ${results.length})`, results.length === 1 && results[0].url.includes('apartment.coffee'));
check('untrusted domain filtered out', !results.some((r) => r.url.includes('random-blog')));

// engine wiring: unfamiliar (empty memory) → research fires and its claim reaches evidence
const deps = (mem, res) => ({
  memory: mem, router: createFamiliarityRouter(), research: res,
  science: createScienceEngine(), evidence: createEvidenceSynth(),
  makeStrategy: (ps) => createStrategyGenerator(ps), recipe: createRecipeGenerator(),
});
const rUnfamiliar = await recommend(obs, deps(createStaticMemoryManager([]), research));
check('unfamiliar coffee → research fired', rUnfamiliar.meta.researchFired === true);
check('research claim reached the evidence panel', rUnfamiliar.evidence.items.some((i) => /1:17|clarity-first/i.test(i.label)));

// familiar (stacked confident principles) → NO research
const fakePrinciples = Array.from({ length: 5 }, (_, i) => ({ id: 'P' + i, statement: 's', domain: 'grind', mechanism: '', appliesWhen: [], levers: [], strategyImplication: '', confidence: 0.7, evidence: { sources: [], recipes: [], independentCount: 1 }, status: 'active', version: 1 }));
const rFamiliar = await recommend(obs, deps(createStaticMemoryManager(fakePrinciples), research));
check('familiar coffee → NO research (adaptive gate)', rFamiliar.meta.researchFired === false);

console.log(`\n${pass}/${total} M5 checks passed.`);
process.exit(pass === total ? 0 : 1);
