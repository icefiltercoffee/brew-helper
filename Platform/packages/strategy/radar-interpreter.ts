import type { InterpretationZone, Observation, RadarInterpretation, RadarPriorities } from '../contracts';

type Axis = keyof RadarPriorities;
const AXES: Axis[] = ['clarity', 'body', 'sweetness', 'floral', 'acidity', 'juiciness'];
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Apply one visible radar move and its scientific interactions. */
export function coupleRadarValues(values: number[], changedIndex: number, target: number, coupling: number[][], gain = 0.55, floor = 0.08): number[] {
  const next = values.map((v) => Math.max(floor, Math.min(1, v)));
  const moved = Math.max(floor, Math.min(1, target));
  const delta = moved - next[changedIndex];
  next[changedIndex] = moved;
  for (let i = 0; i < next.length; i++) {
    if (i === changedIndex) continue;
    const interaction = coupling[changedIndex]?.[i] ?? 0;
    next[i] = Math.max(floor, Math.min(1, next[i] + gain * interaction * delta));
  }
  return next;
}

function zone(raw: number): InterpretationZone {
  if (raw <= 20) return 'strongly deprioritised';
  if (raw <= 40) return 'mildly deprioritised';
  if (raw < 60) return 'neutral';
  if (raw < 80) return 'moderately prioritised';
  return 'strongly prioritised';
}

/** Smoothstep removes recipe cliffs at display-zone boundaries. */
function influence(value: number): number {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

export function interpretRadar(intent: RadarPriorities, observation: Observation): RadarInterpretation {
  const raw = Object.fromEntries(AXES.map((axis) => [axis, Math.round(clamp(intent[axis]) * 100)])) as Record<Axis, number>;
  const order = [...AXES].sort((a, b) => raw[b] - raw[a]);
  const spread = raw[order[0]] - raw[order[order.length - 1]];
  const balanced = spread <= 10;
  const axes = Object.fromEntries(AXES.map((axis) => [axis, {
    rawPriority: raw[axis], relativeWeight: influence(intent[axis]), relativeRank: order.indexOf(axis) + 1, interpretationZone: zone(raw[axis]),
  }])) as RadarInterpretation['axes'];

  const interactions: string[] = [];
  if (raw.clarity >= 60 && raw.floral >= 60) interactions.push('clarity + floral: pursue aromatic separation through controlled flow and sufficient extraction');
  if (raw.clarity >= 60 && raw.body >= 60) interactions.push('clarity + body: preserve concentration through ratio while controlling fines migration');
  if (raw.sweetness >= 60 && raw.acidity >= 60) interactions.push('sweetness + acidity: build both through even extraction, saturation, and suitable water');
  if (raw.body >= 60 && raw.juiciness >= 60) interactions.push('body + juiciness: keep texture lively without excessive resistance or muddiness');
  if (raw.floral >= 60 && raw.body >= 60) interactions.push('floral + body: use moderate texture and state the risk of concentration masking aromatics');

  const brewer = (observation.setup.brewer ?? '').toLowerCase();
  const grinder = (observation.setup.grinder ?? '').toLowerCase();
  const paperFiltered = /v60|origami|kalita|orea|dripper|paper/.test(`${brewer} ${observation.setup.filter ?? ''}`.toLowerCase());
  const limitedGrinder = !grinder || /blade|entry|unknown/.test(grinder);
  const extremeClarityBody = raw.clarity >= 90 && raw.body >= 90;
  const conflictNote = extremeClarityBody && paperFiltered && limitedGrinder
    ? 'Clarity and Body are both strongly prioritised. This paper-filtered setup cannot confidently maximise both with the current grinder information; preserve both moderately and choose a dominant objective only if the cup proves the compromise weak.'
    : undefined;

  return { axes, balanced, dominant: balanced ? undefined : order[0], interactions, conflictNote };
}
