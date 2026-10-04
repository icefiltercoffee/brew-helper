/** Composition root for isomorphic/browser use — principles injected as data. */
import { createStaticMemoryManager } from '../memory/static';
import { createFamiliarityRouter, createResearchManager } from '../research/router';
import { createScienceEngine } from '../science/validate';
import { createFeasibilityEngine } from '../feasibility/feasibility-engine';
import { createEvidenceSynth } from '../evidence/synthesise';
import { createStrategyGenerator } from '../strategy/strategy-generator';
import { createRecipeGenerator } from '../recipe/recipe-generator';
import type { Principle } from '../contracts';
import type { EngineDeps } from './orchestrator';

export function composeEngineStatic(principles: Principle[]): EngineDeps {
  return {
    memory: createStaticMemoryManager(principles),
    router: createFamiliarityRouter(),
    research: createResearchManager(),
    science: createScienceEngine(),
    feasibility: createFeasibilityEngine(),
    evidence: createEvidenceSynth(),
    makeStrategy: (ps) => createStrategyGenerator(ps),
    recipe: createRecipeGenerator(),
  };
}
