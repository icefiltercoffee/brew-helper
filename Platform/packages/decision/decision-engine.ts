/** Brew Helper 2.0 — selects one context-specific brewing decision, never a recipe match. */
import type { DecisionRecommendation, EvidenceBundle, EvidenceLevel, Observation, Strategy } from '../contracts';

type Candidate = DecisionRecommendation['next'] & { score: number };
const impacts = (up: string, down?: string) => [up, ...(down ? [down] : [])];
const age = (n?: number) => n ?? 14;
function grinderTarget(grinder: string, roast: string, process: string) {
  const g = grinder.toLowerCase();
  const delicate = /washed|anaerobic|carbonic/.test(process) || roast.includes('light');
  if (g.includes('comandante')) return delicate ? 'Comandante C40: 24 clicks' : 'Comandante C40: 26 clicks';
  if (g.includes('ek43') || g.includes('mahlkönig')) return delicate ? 'EK43: ~850 µm' : 'EK43: ~900 µm';
  if (g.includes('ode')) return delicate ? 'Fellow Ode Gen 2: 5.2' : 'Fellow Ode Gen 2: 6.0';
  if (g.includes('encore')) return delicate ? 'Baratza Encore: 18' : 'Baratza Encore: 22';
  if (g.includes('j-max')) return delicate ? '1Zpresso J-Max: 1.5 rotations' : '1Zpresso J-Max: 1.75 rotations';
  if (g.includes('niche')) return delicate ? 'Niche Zero: 20' : 'Niche Zero: 24';
  return 'Assume Hario V60 + Comandante C40: 24 clicks';
}

function evidenceIds(strategy: Strategy) { return strategy.appliedPrincipleIds ?? []; }

export function buildDecision(strategy: Strategy, observation: Observation, evidence: EvidenceBundle): DecisionRecommendation {
  const process = (observation.coffee.process ?? '').toLowerCase();
  const roast = (observation.coffee.roastLevel ?? '').toLowerCase();
  const grinder = observation.setup.grinder ?? '';
  const target = grinderTarget(grinder, roast, process);
  const altitude = Number(String(observation.coffee.altitude ?? '').match(/\d[\d,]*/)?.[0]?.replace(',', '') ?? 0);
  const ids = evidenceIds(strategy);
  const confidence: EvidenceLevel = evidence.state === 'Highly Supported' ? 'High' : evidence.state === 'Well Supported' ? 'Moderate' : 'Limited';
  const candidates: Candidate[] = [];
  const add = (c: Omit<Candidate, 'evidenceIds'>) => candidates.push({ ...c, evidenceIds: ids });

  if (age(observation.coffee.roastAgeDays) <= 7) add({
    score: 9, lever: 'bloom', decision: 'Use a 3× dose bloom for 40–45 seconds.',
    why: 'Fresh coffee releases enough CO₂ to block even wetting unless the bloom finishes first.',
    expected: impacts('↑ Evenness', '↑ Sweetness'), tradeoffs: ['Adds time before the first pour.'],
  });
  if (roast.includes('dark')) add({
    score: 10, lever: 'temp', decision: 'Set water to 89–90°C.',
    why: 'This roast dissolves quickly; more heat pushes the finish bitter before it improves sweetness.',
    expected: impacts('↓ Bitterness', '↑ Clean finish'), tradeoffs: ['Less heat can reduce intensity.'],
  });
  if (roast.includes('light') && altitude >= 1700) add({
    score: 10, lever: 'grind', decision: `Set ${target} and brew at 94°C.`,
    why: 'A dense light roast needs a concrete surface-area target before adding agitation or extra heat.',
    expected: impacts('↑ Sweetness', '↓ Sourness'), tradeoffs: ['Stop if drawdown runs past the plan.'],
  });
  if (/natural|anaerobic|carbonic/.test(process)) add({
    score: 8, lever: 'agitation', decision: 'Keep every pour centred and do not swirl after bloom.',
    why: 'This coffee is more likely to carry fines into the late brew, which makes fruit taste muddy or drying.',
    expected: impacts('↑ Clarity', '↓ Dryness'), tradeoffs: ['Too little saturation can leave the centre under-extracted.'],
  });
  if (/washed|nitro/.test(process) && (strategy.primary === 'clarity' || strategy.primary === 'floral')) add({
    score: 8, lever: 'agitation', decision: 'Use low, centred pours and one gentle bloom swirl only.',
    why: 'The cup has a high clarity ceiling, but excess bed movement will pull astringency ahead of flavour.',
    expected: impacts('↑ Clarity', '↑ Aromatic definition'), tradeoffs: ['Sweetness falls if the bed is not fully saturated.'],
  });
  if (strategy.primary === 'body') add({
    score: 7, lever: 'ratio', decision: 'Use a 1:15 ratio before grinding finer.',
    why: 'A tighter ratio raises concentration without forcing more late-stage extraction.',
    expected: impacts('↑ Body', '↓ Clarity'), tradeoffs: ['The cup will feel heavier.'],
  });
  if (strategy.primary === 'sweetness') add({
    score: 7, lever: 'grind', decision: `Set ${target}; if the brew finishes early, move 1 click finer.`,
    why: 'A model-specific starting point makes the sweetness target executable; the single-click correction is conditional on flow, not guesswork.',
    expected: impacts('↑ Sweetness', '↑ Body'), tradeoffs: ['Bitterness rises if drawdown slows sharply.'],
  });
  if (strategy.primary === 'acidity' || strategy.primary === 'floral') add({
    score: 7, lever: 'temp', decision: 'Use 92°C and keep the slurry shallow.',
    why: 'Moderate heat and a low slurry protect the early aromatic and acid structure.',
    expected: impacts('↑ Acidity', '↑ Floral definition'), tradeoffs: ['Too little contact can leave the cup hollow.'],
  });
  add({
    score: 1, lever: 'pour', decision: 'Use two centred pours and keep the bed level.',
    why: 'Even flow is the safest first-brew control when the coffee has not been brewed on this setup.',
    expected: impacts('↑ Evenness', '↑ Clarity'), tradeoffs: ['This is a probe, not a locked baseline.'],
  });

  const next = candidates.sort((a, b) => b.score - a.score)[0];
  const diagnosis = next.lever === 'bloom' ? { label: 'Uneven wetting risk', because: 'Fresh coffee can resist water during the first stage.', confidence }
    : next.lever === 'agitation' ? { label: 'Fines and flow risk', because: 'The cup is more likely to lose clarity through bed movement than lack of energy.', confidence }
      : next.lever === 'grind' ? { label: 'Extraction energy target', because: 'The coffee needs a precise change in surface area before a broader change in heat or agitation.', confidence }
        : { label: 'Extraction target', because: `The first brew is set to protect ${strategy.primary} without hiding the trade-off.`, confidence };

  return {
    diagnosis, next,
    counterfactuals: [
      { variable: 'dose', change: 'Increase dose by 1 g', mechanism: 'Raises concentration at the same water volume.', sensoryImpact: impacts('↑ Body', '↓ Clarity') },
      { variable: 'grind', change: 'Grind one step finer', mechanism: 'Adds surface area and slows flow.', sensoryImpact: impacts('↑ Sweetness', '↑ Bitterness risk') },
      { variable: 'temp', change: 'Raise water by 2°C', mechanism: 'Increases dissolution rate.', sensoryImpact: impacts('↑ Extraction', '↓ Aromatic precision') },
      { variable: 'bloom', change: 'Extend bloom by 15 seconds', mechanism: 'Releases more CO₂ before the main brew.', sensoryImpact: impacts('↑ Evenness', '↑ Sweetness') },
      { variable: 'agitation', change: 'Add a swirl', mechanism: 'Increases bed movement and fines migration.', sensoryImpact: impacts('↑ Extraction', '↓ Clarity') },
      { variable: 'pour', change: 'Pour faster', mechanism: 'Raises slurry depth and changes flow through the bed.', sensoryImpact: impacts('↑ Body', '↑ Channeling risk') },
      { variable: 'bypass', change: 'Add 20 g bypass', mechanism: 'Dilutes after extraction instead of extracting longer.', sensoryImpact: impacts('↓ Body', '↑ Clarity') },
      { variable: 'water', change: 'Use harder water', mechanism: 'Raises extraction capacity.', sensoryImpact: impacts('↑ Sweetness', '↑ Harshness risk') },
      { variable: 'drawdown', change: 'Extend drawdown by 20 seconds', mechanism: 'Extends late-stage contact.', sensoryImpact: impacts('↑ Body', '↑ Bitterness risk') },
    ],
  };
}
