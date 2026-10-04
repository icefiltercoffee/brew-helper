/**
 * Brew Helper — Recipe Generator (M1) — Stage 4.
 * Derives parameters FROM the strategy. Every param carries a `because` that traces back.
 * Reads roast level (obs) to set temperature sensibly. Uses the strategy's methodHint if present.
 */
import type { RecipeGen, Strategy, EquipmentModel, Observation, Recipe, RecipeParam, RecipeStep, RadarPriorities, EvidenceLevel, Lever, SensoryGapItem, FeasibilityResult } from '../contracts';

const GRIND_ORDER = ['extra fine', 'fine', 'medium-fine', 'medium', 'medium-coarse', 'coarse'];
const AXES = ['sweetness', 'clarity', 'body', 'acidity', 'floral', 'juiciness'] as const;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const confidenceRank: Record<EvidenceLevel, number> = { None: 0, Limited: 1, Moderate: 2, High: 3 };

function profileFor(obs: Observation): RadarPriorities {
  const roast = (obs.coffee.roastLevel ?? '').toLowerCase();
  const process = (obs.coffee.process ?? '').toLowerCase();
  const p: RadarPriorities = { sweetness: .6, clarity: .62, body: .52, acidity: .58, floral: .5, juiciness: .58 };
  if (roast.includes('light')) Object.assign(p, { clarity: .72, body: .4, acidity: .72, floral: .62 });
  if (roast.includes('dark')) Object.assign(p, { sweetness: .52, clarity: .38, body: .78, acidity: .25, floral: .2, juiciness: .35 });
  if (/natural|anaerobic|carbonic/.test(process)) Object.assign(p, { sweetness: clamp(p.sweetness + .12), body: clamp(p.body + .12), clarity: clamp(p.clarity - .12), juiciness: clamp(p.juiciness + .1) });
  if (/washed|nitro/.test(process)) Object.assign(p, { clarity: clamp(p.clarity + .1), body: clamp(p.body - .08), floral: clamp(p.floral + .08) });
  return p;
}

function estimateCurrent(obs: Observation, baseline: RadarPriorities) {
  const current = obs.brewContext?.currentCup;
  if (current && AXES.some((a) => current[a] !== undefined)) {
    return { profile: Object.fromEntries(AXES.map((a) => [a, clamp(current[a] ?? baseline[a])])) as unknown as RadarPriorities, defects: current.defects ?? [], evidenceSource: 'current cup' as const, confidence: current.confidence ?? 'High' as EvidenceLevel };
  }
  const previous = obs.brewContext?.previousBrews?.at(-1);
  if (previous) {
    return { profile: Object.fromEntries(AXES.map((a) => [a, clamp(previous.observed[a] ?? baseline[a])])) as unknown as RadarPriorities, defects: previous.defects ?? [], evidenceSource: 'previous brews' as const, confidence: 'Moderate' as EvidenceLevel };
  }
  const known = [obs.coffee.process, obs.coffee.roastLevel, obs.setup.brewer, obs.setup.grinder].filter(Boolean).length;
  return { profile: baseline, defects: [], evidenceSource: known >= 2 ? 'coffee and equipment model' as const : 'general heuristics' as const, confidence: known >= 2 ? 'Moderate' as EvidenceLevel : 'Limited' as EvidenceLevel };
}

function param(name: string, value: string, because: string, s: Strategy, lever: Lever): RecipeParam {
  return { name, value, because, serves: s.id, lever };
}
function shiftGrind(label: string, bias: 'finer' | 'coarser'): string {
  const l = label.toLowerCase();
  // Match the MOST SPECIFIC label ('medium-fine' beats 'fine' which is a substring of it).
  let i = 2, bestLen = 0;
  GRIND_ORDER.forEach((g, idx) => { if (l.includes(g) && g.length > bestLen) { i = idx; bestLen = g.length; } });
  const ni = Math.max(0, Math.min(GRIND_ORDER.length - 1, i + (bias === 'finer' ? -1 : 1)));
  return `${GRIND_ORDER[ni]} (calibrated ${bias})`;
}

const roundPour = (n: number) => Math.ceil(n / 5) * 5;
function executableSteps(brewer: string | undefined, dose: number, water: number, strategy: Strategy): RecipeStep[] {
  const bloom = roundPour(dose * 3);
  const first = roundPour(water * .6);
  const lowPour = 'Pour low and centred; keep the bed level.';
  const bloomStep: RecipeStep = { atSeconds: 0, label: `Bloom to ${bloom} g`, action: 'Wet all grounds, then use one gentle swirl.', targetWaterG: bloom, rationale: 'Even wetting releases CO₂ before the main extraction.', checkpoint: 'The bed should be fully wet with no dry pockets.' };
  if (/switch/i.test(brewer ?? '')) return [
    bloomStep,
    { atSeconds: 45, label: `Percolate to ${first} g`, action: lowPour, targetWaterG: first, rationale: 'Fresh flow develops aromatic clarity before immersion.', checkpoint: 'Keep the valve open.' },
    { atSeconds: 80, label: `Close valve and pour to ${water} g`, action: 'Add the remaining water, then let it steep.', targetWaterG: water, rationale: 'Contact time reaches sweetness without extra agitation.', checkpoint: 'The valve is closed.' },
    { atSeconds: 130, label: 'Open valve', action: 'Let the brew draw down without stirring.', rationale: 'Controlled drawdown limits late fines extraction.', checkpoint: 'Flow should finish by 3:00.' },
    { atSeconds: 180, label: 'Remove brewer', action: 'Swirl the server and taste as it cools.', rationale: 'Ends the extraction consistently for the next comparison.' },
  ];
  return [
    bloomStep,
    { atSeconds: 45, label: `Pour to ${first} g`, action: lowPour, targetWaterG: first, rationale: 'A shallow slurry protects evenness and flavour separation.' },
    { atSeconds: 80, label: `Pour to ${water} g`, action: 'Finish steadily; do not wash the walls.', targetWaterG: water, rationale: strategy.primary === 'body' ? 'Preserves concentration while keeping flow stable.' : 'Limits fines migration while completing extraction.' },
    { atSeconds: 150, label: 'Assess drawdown', action: 'Remove the brewer when the bed is flat.', rationale: 'Drawdown is a diagnostic signal, not a target to force.', checkpoint: 'Target finish: 2:30–3:00.' },
  ];
}

export function createRecipeGenerator(): RecipeGen {
  return {
    generate(s: Strategy, _gear: EquipmentModel, obs?: Observation, feasibility?: FeasibilityResult): Recipe {
      const primary = s.primary;
      const roast = (obs?.coffee.roastLevel ?? '').toLowerCase();

      // Build a coffee/setup baseline before reading sensory preference deltas.
      // Radar intent may adjust this later, but it never authors the baseline.
      let temp = roast.includes('dark') ? 90 : roast.includes('light') ? 94 : 93;
      let grind = roast.includes('dark') ? 'medium-coarse' : roast.includes('light') ? 'medium-fine' : 'medium';
      // Equipment calibration learned from past brews (Stage 6) shifts the starting grind.
      const bias = _gear?.calibration?.grindBias;
      if (bias === 'finer' || bias === 'coarser') grind = shiftGrind(grind, bias);

      const agitation = 'moderate, even agitation';

      const baselineParams: RecipeParam[] = [
        { name: 'dose', value: '15 g', because: 'a standard single-cup dose to anchor the ratio', serves: s.id, lever: 'ratio' },
        { name: 'ratio', value: '1:16.5', because: 'a neutral concentration baseline for a diagnostic filter brew', serves: s.id, lever: 'ratio' },
        { name: 'grind', value: grind, because: 'coffee- and roast-compatible extraction baseline', serves: s.id, lever: 'grind' },
        { name: 'temp', value: `${temp}°C`, because: roast.includes('light') ? 'protect extraction depth for a lightly roasted coffee' : roast.includes('dark') ? 'limit rapid extraction in a developed roast' : 'neutral thermal baseline for this roast', serves: s.id, lever: 'temp' },
        { name: 'agitation', value: agitation, because: 'repeatable saturation without deliberately pushing texture or clarity', serves: s.id, lever: 'agitation' },
        { name: 'total time', value: '~2:45', because: 'diagnostic contact-time baseline', serves: s.id, lever: 'time' },
      ];

      // A supplied existing recipe is the baseline; absent values retain the context-built defaults.
      const supplied = obs?.brewContext?.currentRecipe ?? {};
      for (const p of baselineParams) if (supplied[p.name as keyof typeof supplied]) p.value = supplied[p.name as keyof typeof supplied]!;
      const params = baselineParams.map((p) => ({ ...p }));

      if (s.methodHint) {
        params.unshift({
          name: 'method', value: s.methodHint,
          because: `applies ${(s.appliedPrincipleIds ?? []).join(', ')} to develop your top two priorities on separate clocks`,
          serves: s.id, lever: 'pour',
        });
      }

      const modelProfile = profileFor(obs ?? { coffee: {}, setup: {}, intent: { sweetness:.5, clarity:.5, body:.5, acidity:.5, floral:.5, juiciness:.5 }, unknowns: [], fingerprint: '' });
      const estimated = estimateCurrent(obs!, modelProfile);
      const target = feasibility?.achievableTarget ?? obs?.intent;
      const sensoryGap = Object.fromEntries(AXES.map((axis) => {
        const desired = target?.[axis] ?? .5;
        const gap = desired - estimated.profile[axis];
        return [axis, { desired, current: estimated.profile[axis], gap, priority: Math.abs(gap) >= .25 ? 'high' : Math.abs(gap) >= .1 ? 'moderate' : 'low' }];
      })) as Record<keyof RadarPriorities, SensoryGapItem>;

      const defectText = estimated.defects.join(' ').toLowerCase();
      const under = /sour|hollow|thin|uneven/.test(defectText);
      const over = /bitter|dry|astringent|muddy/.test(defectText);
      // Low slider values mean "do not prioritise", not "actively suppress".
      // Optimisation therefore closes positive gaps; it never spends a second
      // adjustment pushing an already-low axis further down.
      const positiveGaps = [...AXES].filter((a) => sensoryGap[a].gap > 0);
      const biggest = (positiveGaps.length ? positiveGaps : [...AXES])
        .sort((a, b) => sensoryGap[b].gap - sensoryGap[a].gap)[0];
      let objective = `${biggest} optimisation`;
      let grindDirection: 'finer' | 'coarser' | 'unchanged' = 'unchanged';
      let grindSteps = 0;
      let supporting: { name: string; value: string; lever: Lever; reason: string } | undefined;
      if (under) { objective = 'correct likely under-extraction or unevenness'; grindDirection = 'finer'; grindSteps = 1; }
      else if (over) { objective = 'correct likely over-extraction or unevenness'; grindDirection = 'coarser'; grindSteps = 1; }
      else if (s.primary !== 'balance' && sensoryGap[biggest].priority !== 'low') {
        if (biggest === 'sweetness' || biggest === 'body') grindDirection = 'finer';
        if (biggest === 'clarity' && sensoryGap.clarity.gap > 0 && estimated.profile.body >= .45) grindDirection = 'coarser';
        if (grindDirection !== 'unchanged') grindSteps = Math.min(2, sensoryGap[biggest].priority === 'high' && confidenceRank[estimated.confidence] >= 2 ? 2 : 1);
        if (biggest === 'floral' || biggest === 'acidity') supporting = { name: 'temp', value: `${Math.max(88, temp - Math.min(2, sensoryGap[biggest].priority === 'high' ? 2 : 1))}°C`, lever: 'temp', reason: 'protect early aromatics while holding the rest stable' };
        if (biggest === 'body' && sensoryGap.body.gap > 0) supporting = { name: 'ratio', value: '1:15.5', lever: 'ratio', reason: 'increase concentration and texture while keeping sweetness and extraction depth protected; stop if the bed turns muddy or clogs' };
      }

      const materialChanges: string[] = [];
      if (grindDirection !== 'unchanged') {
        const grindParam = params.find((p) => p.name === 'grind')!;
        grindParam.value = shiftGrind(grindParam.value, grindDirection);
        grindParam.because = `${objective}; bounded to ${grindSteps} calibrated step${grindSteps === 1 ? '' : 's'}`;
        materialChanges.push(`Grind ${grindSteps} calibrated step${grindSteps === 1 ? '' : 's'} ${grindDirection}`);
      }
      if (supporting) {
        const p = params.find((x) => x.name === supporting!.name);
        if (p) { p.value = supporting.value; p.because = supporting.reason; materialChanges.push(`${supporting.name}: ${supporting.value}`); }
        else params.push(param(supporting.name, supporting.value, supporting.reason, s, supporting.lever));
      }

      // Body is best tested through concentration first. Do not stack a grind
      // move on the same preference when one bounded ratio change is diagnostic.
      if (!under && !over && biggest === 'body' && supporting?.name === 'ratio') {
        const grindParam = params.find((p) => p.name === 'grind')!;
        const grindBase = baselineParams.find((p) => p.name === 'grind')!;
        grindParam.value = grindBase.value;
        grindParam.because = grindBase.because;
        grindDirection = 'unchanged';
        grindSteps = 0;
        const grindChange = materialChanges.findIndex((x) => /^Grind /i.test(x));
        if (grindChange >= 0) materialChanges.splice(grindChange, 1);
      }

      const predictedCup = { ...estimated.profile };
      if (biggest) predictedCup[biggest] = clamp(predictedCup[biggest] + Math.sign(sensoryGap[biggest].gap) * (grindSteps ? .08 * grindSteps : supporting ? .07 : 0));
      // Stage 2 may optimise only inside Stage 1's envelope. This is deliberately
      // applied after the model estimate so no parameter change can claim more.
      if (feasibility) for (const axis of AXES) predictedCup[axis] = Math.min(predictedCup[axis], feasibility.achievableTarget[axis]);
      const mappedValue = _gear?.grinder && _gear.calibration?.grindUnit
        ? `${grindSteps} ${_gear.calibration.grindUnit} ${grindDirection}`
        : undefined;
      const hasCurrentCup = estimated.evidenceSource === 'current cup';
      const grinderCalibrated = Boolean(_gear?.calibration?.grindUnit);
      const waterKnown = Boolean(obs?.setup.waterProfile) && !obs?.unknowns.includes('waterProfile');
      const drawdownKnown = Boolean(obs?.brewContext?.currentRecipe?.['total time']);
      const conflicting = Boolean(s.radarInterpretation?.conflictNote) || s.tradeoffs.length > 1;
      let decisionConfidence: EvidenceLevel = 'Moderate';
      if (!obs?.setup.grinder || !waterKnown || conflicting || materialChanges.length > 1 || estimated.evidenceSource === 'general heuristics') decisionConfidence = 'Limited';
      if (hasCurrentCup && grinderCalibrated && drawdownKnown && waterKnown && materialChanges.length <= 1 && !conflicting) decisionConfidence = 'High';

      const dose = Number(params.find((p) => p.name === 'dose')?.value.match(/[\d.]+/)?.[0] ?? 15);
      const ratio = Number(params.find((p) => p.name === 'ratio')?.value.match(/:(\d+(?:\.\d+)?)/)?.[1] ?? 16.5);
      const water = roundPour(dose * ratio);
      return { strategyRef: s.id, params, steps: executableSteps(obs?.setup.brewer, dose, water, s), predictedCup, scienceFlags: [], feasibility, optimisation: {
        baselineRecipe: baselineParams.map((p) => ({ ...p })), estimatedCurrentProfile: estimated, sensoryGap,
        primaryObjective: objective, materialChanges, tradeoffs: s.tradeoffs,
        confidence: decisionConfidence,
        observationTarget: under ? 'Look for the hollow/sour centre to fill with sweetness.' : over ? 'Look for dryness or bitterness to recede without losing sweetness.' : `Check whether ${biggest} improves without degrading ${s.secondary || 'the secondary priorities'}.`,
        nextAdjustment: materialChanges.length ? `Hold every other variable stable; repeat or reverse the ${materialChanges[0].toLowerCase()} only after tasting.` : 'Keep the baseline unchanged; use the next cup as the diagnostic observation.',
        grindAdjustment: { direction: grindDirection, calibratedSteps: grindSteps, grinderUnit: _gear?.calibration?.grindUnit, mappedValue, confidence: mappedValue ? decisionConfidence : 'Limited', limitReason: 'Without grinder calibration, display only an approximate directional move.' },
      } };
    },
  };
}
