/**
 * Brew Helper — Evidence Profile + Bundle builder.
 * Formalises the M3 synthesiser output into an Evidence Bundle and computes the multi-dimensional
 * Evidence Profile + Recommendation State that REPLACE the old confidence number.
 * No new evidence is fetched or scored twice — this reads what synthesis already produced.
 */
import type {
  Claim, Conflict, EvidenceItem, EvidenceLevel, EvidenceProfile,
  RecommendationState, EvidenceBundle, Observation, ScienceFlag, PalateCalibration,
} from '../contracts';

const score = (l: EvidenceLevel) => (l === 'High' ? 2 : l === 'Moderate' ? 1 : 0);
const byCount = (n: number, hi: number, mod: number): EvidenceLevel => (n >= hi ? 'High' : n >= mod ? 'Moderate' : n > 0 ? 'Limited' : 'None');

export interface BundleInput {
  claims: Claim[];
  appliedIds: string[];
  familiarity: number;
  conflicts: Conflict[];
  evidenceItems: EvidenceItem[];
  coffee: Observation['coffee'];
  unknowns: string[];
  scienceFlags: ScienceFlag[];
  palate?: PalateCalibration;   // System 6 — how well-anchored the taster is
}

function computeProfile(inp: BundleInput): EvidenceProfile {
  const applied = inp.appliedIds.length;
  const distinctSources = new Set(inp.claims.map((c) => c.source.id)).size;
  const science = inp.claims.filter((c) => c.kind === 'science');
  const hasConflict = inp.conflicts.length > 0;

  const scientificSupport: EvidenceLevel = science.some((c) => c.tier === 'A') ? 'High' : science.length ? 'Moderate' : 'Limited';
  let expertConsensus: EvidenceLevel = applied >= 3 ? 'High' : applied >= 2 ? 'Moderate' : applied >= 1 ? 'Limited' : 'None';
  if (hasConflict && expertConsensus === 'High') expertConsensus = 'Moderate';
  const coffeeSimilarity: EvidenceLevel = inp.familiarity >= 0.75 ? 'Moderate' : 'Limited'; // no per-lot history yet → never High
  const evidenceFreshness: EvidenceLevel = applied > 0 ? 'High' : inp.claims.length ? 'Moderate' : 'None'; // durable principles = current
  const researchCoverage = byCount(applied, 3, 2);
  const sourceDiversity = byCount(distinctSources, 3, 2);
  const stab = Math.min(score(researchCoverage), score(sourceDiversity));
  const recommendationStability: EvidenceLevel = stab >= 2 ? 'High' : stab >= 1 ? 'Moderate' : 'Limited';

  // System 6 — palate calibration. Reported alongside the others but NOT averaged into
  // them: it qualifies the observation, whereas the rest qualify the evidence.
  const palateCalibration: EvidenceLevel = inp.palate?.reliability.level ?? 'None';

  return {
    scientificSupport, expertConsensus, coffeeSimilarity, evidenceFreshness,
    researchCoverage, sourceDiversity, recommendationStability, palateCalibration,
  };
}

export function deriveState(p: EvidenceProfile, familiarity: number, applied: number): RecommendationState {
  if (applied === 0 || familiarity < 0.3) return 'Experimental';
  // Coffee similarity earned from YOUR brew history is only as good as the palate that
  // logged it. Uncalibrated feedback cannot push a recommendation to the top band.
  if (p.coffeeSimilarity !== 'Limited' && p.palateCalibration === 'None') {
    return score(p.expertConsensus) >= 1 && score(p.sourceDiversity) >= 1 ? 'Well Supported' : 'Exploratory';
  }
  if (score(p.scientificSupport) >= 1 && p.expertConsensus === 'High' && score(p.sourceDiversity) >= 1) return 'Highly Supported';
  if (score(p.expertConsensus) >= 1 && score(p.sourceDiversity) >= 1) return 'Well Supported';
  return 'Exploratory';
}

export function buildEvidenceBundle(inp: BundleInput): EvidenceBundle {
  const profile = computeProfile(inp);
  const applied = inp.appliedIds.length;
  const state = deriveState(profile, inp.familiarity, applied);

  const appliedClaims = inp.claims.filter((c) => c.principleId && inp.appliedIds.includes(c.principleId));
  const domains = [...new Set(appliedClaims.map((c) => c.domain).filter(Boolean))] as string[];
  const science = inp.claims.filter((c) => c.kind === 'science');
  const distinctSources = new Set(inp.claims.map((c) => c.source.id)).size;

  // areas of agreement
  const consensus = domains.length ? domains.map((d) => `Practitioners align on ${d}`) : [];

  // primary assumption(s)
  const assumptions: string[] = [];
  if (profile.coffeeSimilarity !== 'High') {
    const desc = [inp.coffee.roastLevel, inp.coffee.process, inp.coffee.origin].filter(Boolean).join(' ') || 'this style of';
    assumptions.push(`Extrapolates from similar ${desc} coffees — limited direct data on this exact coffee.`);
  }

  // limitations / remaining unknowns
  const limitations: string[] = [];
  if (!science.length) limitations.push('No peer-reviewed source directly validates this — it rests on practitioner principles.');
  if (inp.unknowns.includes('waterProfile')) limitations.push('Water profile unspecified — flavour may shift with your water.');
  limitations.push('No brew history for this coffee yet — the first cup calibrates it.');
  const rel = inp.palate?.reliability;
  if (!rel || rel.level === 'None') {
    limitations.push(`Palate not calibrated against the panel${rel ? ` (${rel.sessions}/3 blind sessions logged)` : ''} — your tasting notes are taken at face value.`);
  } else {
    const weak = (Object.keys(rel.perAxis) as (keyof typeof rel.perAxis)[]).filter((a) => rel.perAxis[a].level === 'Limited');
    if (weak.length) limitations.push(`Your readings on ${weak.join(', ')} track the panel loosely — feedback on those axes is discounted.`);
  }
  if (inp.conflicts.length) limitations.push(`Sources differ on ${inp.conflicts.map((c) => c.on).join(', ')}.`);

  // evidence-summary narrative (prose, no %)
  const sci = science.length ? ', with scientific backing' : ', with no direct scientific citation';
  const div = distinctSources >= 3 ? '; convergent across independent sources' : distinctSources <= 1 ? '; from a single source' : '';
  const narrative = `Primarily supported by ${applied || 'no directly-applicable'} practitioner principle(s)${domains.length ? ` (${domains.join(', ')})` : ''}${sci}${div}.`;

  return {
    coffee: inp.coffee,
    scientificPrinciples: science,
    expertOpinions: inp.claims.filter((c) => c.kind !== 'science'),
    consensus,
    conflicts: inp.conflicts,
    keySupporting: inp.evidenceItems,
    freshness: profile.evidenceFreshness,
    assumptions,
    limitations,
    profile,
    state,
    narrative,
    reviewedCount: inp.claims.length,
  };
}
