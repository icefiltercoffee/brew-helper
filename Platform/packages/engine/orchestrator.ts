/**
 * Brew Helper — Engine / Orchestrator (M1)
 * Runs the 6-stage loop. Invariants enforced:
 *   1) strategy is constructed BEFORE any recipe
 *   2) the Science gate must pass before a recipe ships
 */
import type {
  Observation, Recommendation, Strategy, Recipe, Claim, Principle, EquipmentModel,
  RadarPriorities, RecommendationNarrative, RecommendationState, PalateCalibration,
  MemoryManager, FamiliarityRouter, ResearchManager, ScienceEngine,
  EvidenceSynth, StrategyGen, RecipeGen,
  FeasibilityEngine,
} from '../contracts';
import { buildEvidenceBundle } from '../evidence/profile';
import { interpret } from '../interpret/interpretation-engine';
import { buildDecision } from '../decision/decision-engine';
import { createFeasibilityEngine } from '../feasibility/feasibility-engine';

export interface EngineDeps {
  memory: MemoryManager;
  router: FamiliarityRouter;
  research: ResearchManager;
  science: ScienceEngine;
  feasibility?: FeasibilityEngine;
  evidence: EvidenceSynth;
  // strategy generator is created per-request with the retrieved principles (M1)
  makeStrategy: (principles: Principle[]) => StrategyGen;
  recipe: RecipeGen;
}

function toClaims(p: Principle): Claim[] {
  const sources = p.evidence.sourceMeta?.length
    ? p.evidence.sourceMeta
    : [{ id: p.evidence.sources[0] ?? p.id, tier: p.confidence >= 0.6 ? 'A' as const : 'B' as const, kind: 'community' as const }];
  return sources.map((source) => ({
    statement: p.statement,
    source: { id: source.id, tier: source.tier },
    tier: source.tier,
    kind: source.kind,
    weight: p.confidence,
    principleId: p.id,
    domain: p.domain,
    independentCount: p.evidence.independentCount,
  }));
}

export interface RecommendResult extends Recommendation {
  meta: { familiarity: number; researchFired: boolean; principlesUsed: { id: string; version: number }[]; scienceFlags: number; state: RecommendationState };
}

function topAxes(cup: RadarPriorities) {
  const order = (Object.keys(cup) as (keyof RadarPriorities)[]).sort((a, b) => cup[b] - cup[a]);
  return { hi1: order[0], hi2: order[1], lo: order[order.length - 1] };
}

export async function recommend(o: Observation, deps: EngineDeps, ctx?: { equipment?: EquipmentModel; palate?: PalateCalibration }): Promise<RecommendResult> {
  // Stage 1: establish the physical envelope before strategy or parameters.
  const feasibility = (deps.feasibility ?? createFeasibilityEngine()).analyse(o);
  // 2 · RETRIEVE
  const { principles } = await deps.memory.retrieve(o);

  // 3 · ROUTE (adaptive research — off in M1)
  const familiarity = deps.router.score(o, principles);
  const research = deps.router.needsResearch(familiarity) ? await deps.research.maybeResearch(o, familiarity) : [];

  // 4 · SYNTHESISE (pass 1) — principle claims + any governed research claims
  const researchClaims = research.flatMap((r) => r.claims);
  const claims = principles.flatMap(toClaims).concat(researchClaims);
  const { decisionInput } = deps.evidence.synthesise(claims);

  // 5·INTERPRET → 6·DECIDE (strategy first — the product)
  const interpretation = interpret(o);
  const strategy: Strategy = deps.makeStrategy(principles).generate({ claims: decisionInput, intent: o.intent, interpretation, observation: o });

  // 4b · SYNTHESISE (pass 2 — user-facing evidence, boosting what actually drove the strategy)
  const { evidence, conflicts } = deps.evidence.synthesise(claims, { appliedIds: strategy.appliedPrincipleIds });

  // 7 · VALIDATE strategy
  const sv = deps.science.validateStrategy(strategy, o);

  // 8 · RECOMMEND (never before a strategy exists) — apply learned equipment calibration
  // Stage 2: the optimiser receives Stage 1's target and cannot reinterpret it.
  const recipe: Recipe = deps.recipe.generate(strategy, ctx?.equipment ?? {}, o, feasibility);

  // 9 · VALIDATE recipe (veto blocks)
  let rv = deps.science.validateRecipe(recipe, o);
  if (!rv.ok) {
    const corrected = deps.science.correctRecipe(recipe, o);
    const correctedVerdict = deps.science.validateRecipe(corrected, o);
    if (!correctedVerdict.ok) throw new Error(`recipe vetoed: ${correctedVerdict.flags.filter((f) => f.severity === 'veto').map((f) => f.message).join('; ')}`);
    recipe.params = corrected.params;
    rv = { ok: true, flags: [...rv.flags, { severity: 'warn', message: 'Safety correction applied before this recipe was shown.' }, ...correctedVerdict.flags] };
  }
  recipe.scienceFlags = [...sv.flags, ...rv.flags];
  if (feasibility.classification === 'IMPLAUSIBLE') {
    recipe.scienceFlags.push({ severity: 'warn', message: `Bounded fallback: ${feasibility.primaryLimitingFactor}` });
  }

  // — Evidence Bundle: formalised synthesis output → the interface into the recommendation —
  const appliedIds = strategy.appliedPrincipleIds ?? [];
  const bundle = buildEvidenceBundle({
    claims, appliedIds, familiarity, conflicts,
    evidenceItems: evidence.items, coffee: o.coffee, unknowns: o.unknowns, scienceFlags: recipe.scienceFlags,
    palate: ctx?.palate,
  });

  // 10 · EXPLAIN — the mentor's 7-part narrative (no confidence %; the Evidence Profile carries uncertainty)
  const t = topAxes(recipe.predictedCup);
  const narrative: RecommendationNarrative = {
    judgement:
      `My read: this coffee wants ${strategy.primary} over ${strategy.tradeoffs[0]?.replace('accept less ', '') ?? 'the rest'}` +
      ` — ${strategy.methodHint ? `use a ${strategy.methodHint.split('—')[0].trim()}` : strategy.extractionTarget.approach}.`,
    strategyLine: `We're optimising ${strategy.primary}${strategy.secondary ? ` and ${strategy.secondary}` : ''} — ${strategy.extractionTarget.approach}.`,
    evidenceSummary: bundle.narrative,
    tradeoffs: strategy.tradeoffs.length ? `Intentionally giving up: ${strategy.tradeoffs.join('; ')}.` : 'No major trade-off here.',
    expectedCup: `Expect a ${t.hi1}, ${t.hi2} cup — lighter on ${t.lo}.`,
    adjustment: 'If it reads hollow or sour, grind a step finer. If it turns bitter or drying, ease the water temperature or coarsen slightly.',
  };
  const decision = buildDecision(strategy, o, bundle);

  return {
    narrative, strategy, recipe, evidence, bundle, decision,
    meta: {
      familiarity, researchFired: research.length > 0,
      principlesUsed: appliedIds.map((id) => {
        const p = principles.find((x) => x.id === id);
        return { id, version: p?.version ?? 1 };
      }),
      scienceFlags: recipe.scienceFlags.length,
      state: bundle.state,
    },
  };
}
