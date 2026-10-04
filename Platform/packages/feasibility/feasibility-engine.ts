import type { FeasibilityClassification, FeasibilityEngine, FeasibilityResult, Observation, RadarPriorities } from '../contracts';

const AXES: (keyof RadarPriorities)[] = ['sweetness', 'clarity', 'floral', 'acidity', 'juiciness', 'body'];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const numberFrom = (v?: string) => Number(v?.match(/\d+(?:\.\d+)?/)?.[0] ?? NaN);

function potentialFor(o: Observation): RadarPriorities {
  const p: RadarPriorities = { sweetness: .62, clarity: .62, floral: .48, acidity: .55, juiciness: .54, body: .55 };
  const process = (o.coffee.process ?? '').toLowerCase();
  const origin = (o.coffee.origin ?? '').toLowerCase();
  const variety = (o.coffee.variety ?? '').toLowerCase();
  const roast = (o.coffee.roastLevel ?? '').toLowerCase();
  const add = (axis: keyof RadarPriorities, n: number) => { p[axis] = clamp(p[axis] + n); };
  if (/washed|wet/.test(process)) { add('clarity', .16); add('floral', .07); add('acidity', .08); add('body', -.10); }
  if (/natural|honey/.test(process)) { add('sweetness', .12); add('juiciness', .10); add('body', .10); add('clarity', -.08); }
  if (/anaerobic|carbonic|thermal shock|co-ferment/.test(process)) { add('sweetness', .10); add('floral', .10); add('juiciness', .10); add('clarity', -.05); }
  if (numberFrom(o.coffee.altitude) >= 1600) { add('acidity', .08); add('clarity', .05); add('floral', .04); }
  if (/ethiopia|kenya|rwanda|burundi/.test(origin)) { add('floral', .10); add('acidity', .07); add('clarity', .05); }
  if (/geisha|gesha|sidra|typica mejorado|ombligon/.test(variety)) { add('floral', .13); add('clarity', .08); add('sweetness', .05); }
  if (/dark/.test(roast) || (o.coffee.roastAgtron ?? 100) < 55) { add('body', .14); add('sweetness', .05); add('floral', -.28); add('acidity', -.24); add('clarity', -.18); }
  else if (/medium-dark/.test(roast) || (o.coffee.roastAgtron ?? 100) < 65) { add('body', .09); add('sweetness', .05); add('floral', -.14); add('acidity', -.10); }
  else if (/light|medium-light/.test(roast) || (o.coffee.roastAgtron ?? 0) >= 75) { add('clarity', .06); add('floral', .05); add('acidity', .06); add('body', -.04); }
  return p;
}

export function createFeasibilityEngine(): FeasibilityEngine {
  return { analyse(o) {
    const beanPotential = potentialFor(o);
    const requestedProfile = { ...o.intent };
    const achievableTarget = AXES.reduce((a, axis) => { a[axis] = Math.min(requestedProfile[axis], beanPotential[axis]); return a; }, {} as RadarPriorities);
    const gaps = AXES.map((axis) => Math.max(0, requestedProfile[axis] - beanPotential[axis]));
    const maxGap = Math.max(...gaps);
    const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / AXES.length;
    const equipment = `${o.setup.brewer ?? ''} ${o.setup.filter ?? ''} ${o.setup.grinder ?? ''}`.toLowerCase();
    const paper = /v60|origami|kalita|orea|dripper|paper/.test(equipment);
    const constrainedGrinder = !o.setup.grinder || /blade|entry|unknown/.test(equipment);
    const clarityAndBody = requestedProfile.clarity >= .85 && requestedProfile.body >= .85;
    const feasibilityScore = Math.round(clamp(1 - averageGap * 1.25 - maxGap * .35 - (clarityAndBody && paper ? .08 : 0) - (constrainedGrinder ? .06 : 0) - (!o.setup.waterProfile ? .04 : 0)) * 100);
    const classification: FeasibilityClassification = feasibilityScore >= 85 ? 'ACHIEVABLE' : feasibilityScore >= 60 ? 'HIGH_EXECUTION' : feasibilityScore >= 30 ? 'BEAN_LIMITED' : 'IMPLAUSIBLE';
    const exceeded = AXES.filter((axis) => requestedProfile[axis] > beanPotential[axis] + .08);
    const assumptions = [!o.coffee.process && 'Process is unknown; process potential is neutral.', !o.coffee.roastLevel && o.coffee.roastAgtron === undefined && 'Roast development is unknown; solubility is neutral.', o.coffee.roastAgtron === undefined && 'Agtron is unavailable; roast level is a directional proxy.', !o.setup.waterProfile && 'Water chemistry is unknown; acidity retention is less certain.', !o.setup.grinder && 'Grinder distribution is unknown; grind remains directional.'].filter(Boolean) as string[];
    const tradeoffs = [clarityAndBody && 'High clarity and body can coexist, but paper filtration narrows the upper limit for both.', requestedProfile.floral >= .8 && requestedProfile.body >= .8 && 'More concentration may mask delicate aromatics.', requestedProfile.sweetness >= .8 && requestedProfile.acidity >= .8 && 'Sweetness and acidity can rise together with even extraction; the late extraction tail remains the risk.'].filter(Boolean) as string[];
    return { requestedProfile, beanPotential, achievableTarget, feasibilityScore, classification,
      primaryLimitingFactor: exceeded.length ? `Bean potential limits ${exceeded.join(', ')} at this roast and process.` : clarityAndBody && paper ? 'Paper filtration and particle distribution set the practical clarity/body ceiling.' : constrainedGrinder ? 'Particle distribution is the main uncertainty.' : 'No dominant physical constraint is evident from the supplied inputs.',
      tradeoffs, assumptions, confidence: Math.round((o.coffee.process && (o.coffee.roastLevel || o.coffee.roastAgtron !== undefined) ? .78 : .58) * 100) };
  }};
}
