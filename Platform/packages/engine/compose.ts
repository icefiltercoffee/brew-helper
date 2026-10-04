/** Composition root — wires the modules into EngineDeps (M1). */
import { createMemoryManager } from '../memory/memory-manager';
import { createFamiliarityRouter, createResearchManager } from '../research/router';
import { loadSourceRegistry } from '../research/source-registry';
import { MockSearchProvider, GoogleProgrammableSearchProvider } from '../research/search-provider';
import { createScienceEngine } from '../science/validate';
import { createFeasibilityEngine } from '../feasibility/feasibility-engine';
import { createEvidenceSynth } from '../evidence/synthesise';
import { createStrategyGenerator } from '../strategy/strategy-generator';
import { createRecipeGenerator } from '../recipe/recipe-generator';
import type { EngineDeps } from './orchestrator';

export function composeEngine(opts: { googleApiKey?: string; googleEngineId?: string } = {}): EngineDeps {
  const provider = opts.googleApiKey && opts.googleEngineId
    ? new GoogleProgrammableSearchProvider(opts.googleApiKey, opts.googleEngineId)
    : new MockSearchProvider();
  return {
    memory: createMemoryManager(),
    router: createFamiliarityRouter(),
    research: createResearchManager({ provider, registry: loadSourceRegistry() }),
    science: createScienceEngine(),
    feasibility: createFeasibilityEngine(),
    evidence: createEvidenceSynth(),
    makeStrategy: (principles) => createStrategyGenerator(principles),
    recipe: createRecipeGenerator(),
  };
}
