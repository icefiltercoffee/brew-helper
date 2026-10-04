/**
 * Brew Helper — Contracts
 * The typed seams between every module. Nothing crosses a package boundary
 * except through these types. Implements Engineering-Blueprint.md §2 and
 * Reasoning-Scaffold.md §3. If a module honours these, it can be swapped freely.
 */

// ---------- shared vocabulary ----------
export type Lever = 'grind' | 'temp' | 'time' | 'agitation' | 'ratio' | 'water' | 'pour' | 'bloom';
export type Tier = 'A' | 'B' | 'C';
export type ClaimKind = 'science' | 'competition' | 'roaster' | 'community' | 'history';

/** The six radar axes — user intent AND predicted/observed cup, each 0..1. */
export interface RadarPriorities {
  sweetness: number; clarity: number; body: number;
  acidity: number; floral: number; juiciness: number;
}
export type InterpretationZone = 'strongly deprioritised' | 'mildly deprioritised' | 'neutral' | 'moderately prioritised' | 'strongly prioritised';
export interface RadarAxisInterpretation {
  rawPriority: number;          // exact UI value, 0..100
  relativeWeight: number;       // smooth optimisation influence; never forced to a fixed total
  relativeRank: number;
  interpretationZone: InterpretationZone;
}
export interface RadarInterpretation {
  axes: Record<keyof RadarPriorities, RadarAxisInterpretation>;
  balanced: boolean;
  dominant?: keyof RadarPriorities;
  interactions: string[];
  conflictNote?: string;
}

// ---------- Stage 1: Observe ----------
export interface Observation {
  coffee: {
    origin?: string; producer?: string; variety?: string; process?: string;
    altitude?: string; roastLevel?: string; roastAgtron?: number; roastAgeDays?: number; tastingNotes?: string[];
    databaseProfile?: {
      matchedLots: number; notes: string[]; processes: string[]; origins: string[];
      farms: string[]; producers: string[]; roasters: string[]; source: string; retrievedAt?: string;
    };
  };
  setup: {
    grinder?: string; brewer?: string; filter?: string;
    waterProfile?: string; batchSizeG?: number;
  };
  intent: RadarPriorities;      // from the radar
  unknowns: string[];           // explicitly listed, never guessed
  fingerprint: string;          // hash of coffee dims → cache + familiarity key
  brewContext?: {
    currentRecipe?: Partial<Record<'dose' | 'water' | 'ratio' | 'temp' | 'grind' | 'bloom' | 'pour' | 'agitation' | 'total time', string>>;
    currentCup?: Partial<RadarPriorities> & { defects?: string[]; notes?: string[]; confidence?: EvidenceLevel };
    previousBrews?: { recipe: Record<string, string>; observed: Partial<RadarPriorities>; defects?: string[] }[];
  };
}

// ---------- knowledge items ----------
export interface SourceRef { id: string; title?: string; tier: Tier; }

export interface Claim {
  statement: string;
  source: SourceRef;
  tier: Tier;
  kind: ClaimKind;
  weight: number;               // credibility × reproducibility × recency × independence
  principleId?: string;         // provenance → lets the synthesiser boost applied principles
  domain?: string;              // grouping key for conflict detection
  independentCount?: number;    // convergence signal
}

export interface Principle {
  id: string;                   // PRN-####
  statement: string;
  domain: Lever | 'process' | 'roast' | 'equipment';
  mechanism: string;
  appliesWhen: string[];
  levers: Lever[];
  strategyImplication: string;
  confidence: number;           // 0..1
  evidence: {
    sources: string[]; recipes: string[]; independentCount: number;
    sourceMeta?: { id: string; tier: Tier; kind: ClaimKind }[];
  };
  status: 'candidate' | 'active' | 'deprecated';
  version: number;
}

export interface ResearchResult { url: string; tier: Tier; claims: Claim[]; fetchedAt: string; }

// ---------- Stage 2: Interpret ----------
export interface Inference {
  property: 'density' | 'solubility' | 'roastDevelopment' | 'extractionDifficulty'
    | 'sweetnessPotential' | 'acidityStructure' | 'bodyPotential' | 'indexedProfile';
  value: string;
  confidence: number;
  because: string;              // mechanism + rule ref
  rule: string;
}
export interface Interpretation { inferences: Inference[]; risks: { risk: string; likelihood: string; because: string }[]; }

// ---------- Stage 3: Decide (the product) ----------
export interface Strategy {
  id: string;
  primary: string;
  secondary: string;
  tradeoffs: string[];
  extractionTarget: { position: string; approach: string };
  constraintsFromIntent: string[];
  rationale: string;
  methodHint?: string;          // e.g. "staged percolation→immersion (Switch)" — from an applied principle
  appliedPrincipleIds?: string[];
  radarInterpretation?: RadarInterpretation;
}

// ---------- Stage 4: Recommend ----------
export interface RecipeParam {
  name: string;                 // grind | temp | ratio | bloom | pour | agitation | drawdown | total
  value: string;
  because: string;              // traces to strategy
  serves: string;               // strategy id / objective
  lever: Lever;
}
/** A timed, executable action. This is the single source for the recipe card,
 * timer and saved brew record — never a decorative recipe-library step. */
export interface RecipeStep {
  atSeconds: number;
  label: string;
  action: string;
  targetWaterG?: number;
  rationale: string;
  checkpoint?: string;
}
export interface ScienceFlag { severity: 'veto' | 'warn'; message: string; }
export interface Recipe {
  strategyRef: string;
  params: RecipeParam[];
  steps: RecipeStep[];
  predictedCup: RadarPriorities;
  scienceFlags: ScienceFlag[];
  optimisation?: OptimisationRecord;
  /** Internal Stage 1 trace for learning and regression checks; never rendered by the dashboard. */
  feasibility?: FeasibilityResult;
}

export type SensoryAxis = keyof RadarPriorities;
export interface SensoryEstimate {
  profile: RadarPriorities;
  defects: string[];
  evidenceSource: 'current cup' | 'previous brews' | 'coffee and equipment model' | 'general heuristics';
  confidence: EvidenceLevel;
}
export interface SensoryGapItem { desired: number; current: number; gap: number; priority: 'high' | 'moderate' | 'low'; }
export interface GrindAdjustment {
  direction: 'finer' | 'coarser' | 'unchanged';
  calibratedSteps: number;
  grinderUnit?: string;
  mappedValue?: string;
  confidence: EvidenceLevel;
  limitReason: string;
}
export interface OptimisationRecord {
  baselineRecipe: RecipeParam[];
  estimatedCurrentProfile: SensoryEstimate;
  sensoryGap: Record<SensoryAxis, SensoryGapItem>;
  primaryObjective: string;
  materialChanges: string[];
  tradeoffs: string[];
  confidence: EvidenceLevel;
  observationTarget: string;
  nextAdjustment: string;
  grindAdjustment: GrindAdjustment;
}

// ---------- Brew Helper 2.0: decision intelligence ----------
export interface Counterfactual {
  variable: 'dose' | Lever | 'bypass' | 'drawdown';
  change: string;
  mechanism: string;
  sensoryImpact: string[];
}
export interface DecisionRecommendation {
  diagnosis: { label: string; because: string; confidence: EvidenceLevel };
  next: {
    lever: Lever | 'dose' | 'bypass' | 'drawdown';
    decision: string; why: string; expected: string[]; tradeoffs: string[];
    evidenceIds: string[];
  };
  counterfactuals: Counterfactual[];
}

// ---------- Evidence (transparency contract) ----------
export interface EvidenceItem { label: string; kind: ClaimKind; strength: 'strong' | 'moderate'; theme?: string; }
export interface Conflict { on: string; note: string; }
export interface Evidence { items: EvidenceItem[]; note?: string; conflicts?: Conflict[]; } // context, NOT chain-of-thought

// ---------- Evidence Profile (retires the confidence %) ----------
export type EvidenceLevel = 'High' | 'Moderate' | 'Limited' | 'None';
export interface EvidenceProfile {
  scientificSupport: EvidenceLevel;      // grounded in first-principles/peer-reviewed science?
  expertConsensus: EvidenceLevel;        // do multiple credible practitioners agree?
  coffeeSimilarity: EvidenceLevel;       // direct data for THIS coffee vs extrapolated
  evidenceFreshness: EvidenceLevel;      // how current is the support
  researchCoverage: EvidenceLevel;       // how much of the decision is evidenced vs inferred
  sourceDiversity: EvidenceLevel;        // how many independent sources
  recommendationStability: EvidenceLevel;// would small input changes flip it
  palateCalibration: EvidenceLevel;      // how well the taster's palate is anchored to the calibration panel
}
export type RecommendationState = 'Highly Supported' | 'Well Supported' | 'Exploratory' | 'Experimental';

// ---------- Evidence Bundle: THE interface from synthesis into the engine ----------
export interface EvidenceBundle {
  coffee: Observation['coffee'];
  scientificPrinciples: Claim[];         // constraints
  expertOpinions: Claim[];               // practice
  consensus: string[];                   // areas of agreement
  conflicts: Conflict[];                 // areas of disagreement (+ resolution)
  keySupporting: EvidenceItem[];         // user-facing "what supports this"
  freshness: EvidenceLevel;
  assumptions: string[];                 // primary assumption(s)
  limitations: string[];                 // unknowns / gaps
  profile: EvidenceProfile;
  state: RecommendationState;
  narrative: string;                     // evidence summary (prose, no %)
  reviewedCount: number;
}

// ---------- Recommendation narrative (mentor structure, not a param dump) ----------
export interface RecommendationNarrative {
  judgement: string;        // "My read is…"
  strategyLine: string;     // what we're optimising
  evidenceSummary: string;  // primarily supported by…
  tradeoffs: string;        // intentionally sacrificed
  expectedCup: string;      // what to expect
  adjustment: string;       // if it behaves differently…
}

// ---------- the output ----------
export interface Recommendation {
  narrative: RecommendationNarrative;
  strategy: Strategy;
  recipe: Recipe;
  evidence: Evidence;
  bundle: EvidenceBundle;   // one recommendation ← one Evidence Bundle
  decision: DecisionRecommendation;
}

// ---------- Stage 6: Learn ----------
export interface BrewOutcome {
  recipeRef: string;
  observed: RadarPriorities;      // as tasted by `taster` — RAW, uncorrected
  notes: string[];
  taster?: TasterId;              // who tasted it (defaults to owner)
  descriptors?: string[];         // free-form flavour terms, pre-translation
  panel?: TastingRecord[];        // present when a calibrator tasted the same cup
  execution?: {
    actualDoseG?: number;
    actualWaterG?: number;
    drawdownSeconds?: number;
    completedSteps?: number;
    brewSeconds?: number;
  };
}
export interface Diagnosis {
  cause: string;
  because: string;
  adjustments: { lever: Lever; move: string; loopsTo: string }[];
  /** How much the sensory INPUT can be trusted — separate from evidence for the recipe. */
  sensoryConfidence?: EvidenceLevel;
  calibrationNote?: string;       // e.g. "Champion override applied on floral."
  translated?: LexiconMapping[];  // descriptor translations actually used
}
export type LearningScope = 'universal' | 'user' | 'equipment';
export interface LearningUpdate { scope: LearningScope; note: string; data?: Record<string, unknown>; }

// ---------- user models (Memory) ----------
export interface EquipmentModel { grinder?: string; calibration?: Record<string, string>; }
export interface PreferenceModel { leans?: Partial<RadarPriorities>; notes?: string[]; }

// ---------- module interfaces (the swap points) ----------
export interface Verdict { ok: boolean; flags: ScienceFlag[]; }
export type FeasibilityClassification = 'ACHIEVABLE' | 'HIGH_EXECUTION' | 'BEAN_LIMITED' | 'IMPLAUSIBLE';
/** Internal Stage 1 contract. */
export interface FeasibilityResult {
  requestedProfile: RadarPriorities;
  beanPotential: RadarPriorities;
  achievableTarget: RadarPriorities;
  feasibilityScore: number;
  classification: FeasibilityClassification;
  primaryLimitingFactor: string;
  tradeoffs: string[];
  assumptions: string[];
  confidence: number;
}

export interface MemoryManager {
  retrieve(o: Observation): Promise<{ principles: Principle[]; history: BrewOutcome[]; familiarity: number }>;
  learn(u: LearningUpdate): Promise<void>;
}
export interface FamiliarityRouter { score(o: Observation, principles: Principle[]): number; needsResearch(score: number): boolean; }
export interface ResearchManager { maybeResearch(o: Observation, familiarity: number): Promise<ResearchResult[]>; }
export interface ScienceEngine {
  validateStrategy(s: Strategy, o: Observation): Verdict;
  validateRecipe(r: Recipe, o: Observation): Verdict;
  /** Correct only a safety-vetoed recipe, then require a second validation pass. */
  correctRecipe(r: Recipe, o: Observation): Recipe;
}
export interface FeasibilityEngine { analyse(o: Observation): FeasibilityResult; }
export interface EvidenceSynth {
  synthesise(claims: Claim[], ctx?: { appliedIds?: string[] }): { decisionInput: Claim[]; evidence: Evidence; conflicts: Conflict[] };
}
export interface StrategyGen {
  generate(input: { claims: Claim[]; intent: RadarPriorities; interpretation: Interpretation; observation: Observation }): Strategy;
}
export interface RecipeGen { generate(s: Strategy, gear: EquipmentModel, obs?: Observation, feasibility?: FeasibilityResult): Recipe; }
export interface DiagnosisEngine { diagnose(expected: RadarPriorities, outcome: BrewOutcome, s: Strategy, cal?: PalateCalibration): Diagnosis; }
export interface LearningEngine { apply(d: Diagnosis, outcome: BrewOutcome): LearningUpdate; }

// ---------- System 6: Palate Calibration ----------
/**
 * Flavour perception is subjective. Calibration does TWO separable jobs and they are
 * never conflated: TRANSLATION (your vocabulary -> the panel's) and RELIABILITY
 * (how closely your intensity readings track the panel's, per axis).
 * Protocol: blind triangulation — all tasters score the same brew independently.
 */
export type TasterId = string;
export type TasterRole = 'owner' | 'calibrator';

export interface Taster {
  id: TasterId;
  name: string;
  role: TasterRole;
  credential?: string;    // e.g. "SCA Q-grader; 2x national brewers cup finalist"
  panelWeight: number;    // 0..1 — relative authority within the calibration panel
}

export interface TastingRecord {
  taster: TasterId;
  radar: RadarPriorities;   // 0..1 intensity on the six axes
  descriptors: string[];    // free-form terms, verbatim
}

export interface CalibrationSession {
  id: string;
  date: string;
  brewRef: string;              // recipe/brew this was tasted from
  coffeeFingerprint: string;
  blind: true;                  // protocol constant — non-blind sessions are not admissible
  records: TastingRecord[];     // owner + >=1 calibrator, independently logged
}

export interface AxisStats {
  reliability: number;   // 0..1 — agreement with panel after discounting the panel's own spread
  bias: number;          // signed mean (owner - panel): +ve = you read this axis HOTTER than the panel
  panelSpread: number;   // 0..1 — how much the calibrators disagree with each other on this axis
  n: number;             // sessions contributing
  level: EvidenceLevel;
}

export interface PalateReliability {
  perAxis: Record<keyof RadarPriorities, AxisStats>;
  overall: number;                        // 0..1, panel-spread-adjusted mean
  sessions: number;
  maturity: number;                       // 0..1 — confidence in the reliability figure itself
  level: EvidenceLevel;                   // 'None' == not yet calibrated
}

export interface LexiconMapping {
  userTerm: string;      // "chamomile"
  panelTerm: string;     // "jasmine"
  count: number;         // co-occurrences in blind sessions
  confidence: number;    // 0..1
}

export interface PalateCalibration {
  owner: TasterId;
  calibrators: Taster[];
  sessions: CalibrationSession[];
  reliability: PalateReliability;
  lexicon: LexiconMapping[];
}

export interface PalateEngine {
  /** Recompute reliability + lexicon from the blind session log. */
  calibrate(sessions: CalibrationSession[], owner: TasterId, calibrators: Taster[]): PalateCalibration;
  /** Map the owner's descriptors into panel vocabulary before diagnosis reads them. */
  translate(descriptors: string[], cal: PalateCalibration): { terms: string[]; used: LexiconMapping[] };
  /** Bias-correct a solo reading; when a calibrator tasted the same cup, the champion overrides. */
  resolve(outcome: BrewOutcome, cal: PalateCalibration): {
    radar: RadarPriorities;
    descriptors: string[];
    sensoryConfidence: EvidenceLevel;
    note: string;
    overridden: (keyof RadarPriorities)[];
    used: LexiconMapping[];
  };
}
