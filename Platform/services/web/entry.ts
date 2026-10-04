/**
 * Brew Helper — Browser entry (M4). Bundled to a single JS and inlined into the live page.
 * Exposes the full loop: recommend → (brew) → diagnose → learn, with a session-held
 * user/equipment model so the NEXT recommendation reflects what was learned.
 */
import principlesData from '../../data/principles.json';
import { composeEngineStatic } from '../../packages/engine/compose-static';
import { recommend } from '../../packages/engine/orchestrator';
import { createDiagnosisEngine } from '../../packages/diagnosis/diagnosis-engine';
import { createLearningEngine } from '../../packages/learning/learning-engine';
import { coupleRadarValues } from '../../packages/strategy/radar-interpreter';
import { createFeasibilityEngine } from '../../packages/feasibility/feasibility-engine';
import type { Observation, Principle, RadarPriorities, EquipmentModel, BrewOutcome, Diagnosis } from '../../packages/contracts';

const deps = composeEngineStatic(principlesData as unknown as Principle[]);
const diagnosisEngine = createDiagnosisEngine();
const learningEngine = createLearningEngine();
const feasibilityEngine = createFeasibilityEngine();

// session-held models (Stage 6 "local learning" — persists for the session)
const session: { equipment: EquipmentModel; last?: Awaited<ReturnType<typeof recommend>> } = { equipment: {} };

export interface BrowserRecommendationInput {
  coffee: Observation['coffee'];
  setup?: Observation['setup'];
  intent: RadarPriorities;
  unknowns?: string[];
  fingerprint?: string;
}

function buildObservation(input: BrowserRecommendationInput): Observation {
  return {
    coffee: input.coffee, setup: input.setup ?? {}, intent: input.intent, unknowns: input.unknowns ?? [],
    fingerprint: input.fingerprint ?? `${input.coffee.origin ?? ''}-${input.coffee.process ?? ''}-${input.coffee.roastLevel ?? ''}`.toLowerCase(),
  };
}

(globalThis as any).BrewEngine = {
  coupleRadarValues,
  assessFeasibility(input: BrowserRecommendationInput) {
    return feasibilityEngine.analyse(buildObservation(input));
  },
  async recommend(input: BrowserRecommendationInput) {
    const r = await recommend(buildObservation(input), deps, { equipment: session.equipment });
    session.last = r;
    return r;
  },
  diagnose(observed: RadarPriorities, notes: string[], execution?: BrewOutcome['execution']): Diagnosis | null {
    if (!session.last) return null;
    const outcome: BrewOutcome = { recipeRef: session.last.strategy.id, observed, notes, execution };
    return diagnosisEngine.diagnose(session.last.recipe.predictedCup, outcome, session.last.strategy);
  },
  applyLearning(d: Diagnosis) {
    const update = learningEngine.apply(d, { recipeRef: '', observed: {} as RadarPriorities, notes: [] });
    if (update.scope === 'equipment' && update.data && (update.data as any).grindBias) {
      session.equipment.calibration = { ...(session.equipment.calibration ?? {}), grindBias: (update.data as any).grindBias };
    }
    return update;
  },
  setEquipmentCalibration(calibration: Record<string, string>) {
    session.equipment.calibration = { ...(session.equipment.calibration ?? {}), ...calibration };
  },
  predictedCup: () => session.last?.recipe.predictedCup ?? null,
  equipment: () => session.equipment,
  principleCount: (principlesData as unknown as Principle[]).length,
};
