/**
 * Stage 2 — Interpret.
 * Turns known coffee and setup facts into explicit extraction implications. It is deliberately
 * directional: unknown facts stay unknown rather than becoming invented precision.
 */
import type { Interpretation, Observation } from '../contracts';

const altitude = (value?: string) => {
  const match = value?.match(/\d[\d,]*/);
  return match ? Number(match[0].replace(',', '')) : undefined;
};

export function interpret(observation: Observation): Interpretation {
  const inferences: Interpretation['inferences'] = [];
  const risks: Interpretation['risks'] = [];
  const roast = observation.coffee.roastLevel?.toLowerCase() ?? '';
  const process = observation.coffee.process?.toLowerCase() ?? '';
  const elevation = altitude(observation.coffee.altitude);

  if (elevation !== undefined && elevation >= 1700) {
    inferences.push({ property: 'density', value: 'high', confidence: 0.75,
      because: `${observation.coffee.altitude} suggests slower maturation and denser bean structure.`, rule: 'heuristics#altitude-density' });
    inferences.push({ property: 'extractionDifficulty', value: 'higher', confidence: 0.75,
      because: 'Dense beans dissolve more slowly, so sweetness needs deliberate extraction energy.', rule: 'heuristics#altitude-density' });
    risks.push({ risk: 'under-extraction → hollow or sour', likelihood: 'high', because: 'High-grown coffees commonly need more energy to reach sweetness.' });
  }

  if (roast.includes('light')) {
    inferences.push({ property: 'solubility', value: 'low', confidence: 0.8,
      because: 'Light roasting leaves the bean less porous and harder to dissolve evenly.', rule: 'heuristics#roast-level' });
    inferences.push({ property: 'roastDevelopment', value: 'light', confidence: 0.95,
      because: 'Reported roast level is light.', rule: 'observation#roast-level' });
    risks.push({ risk: 'under-extraction → hollow or sour', likelihood: 'high', because: 'Light roasts generally need more extraction energy before sweetness develops.' });
  } else if (roast.includes('dark')) {
    inferences.push({ property: 'solubility', value: 'high', confidence: 0.8,
      because: 'Dark roasting makes beans more porous and quick to dissolve.', rule: 'heuristics#roast-level' });
    risks.push({ risk: 'over-extraction → bitter or ashy', likelihood: 'high', because: 'Dark roasts reach the bitter tail earlier.' });
  }

  if (process.includes('washed')) {
    inferences.push({ property: 'acidityStructure', value: 'clean and articulated', confidence: 0.7,
      because: 'Washed processing tends to preserve transparent acidity and a higher clarity ceiling.', rule: 'heuristics#process' });
    risks.push({ risk: 'astringency from aggressive agitation', likelihood: 'moderate', because: 'A washed coffee can lose clarity when fines are over-agitated.' });
  } else if (process.includes('natural') || process.includes('anaerobic')) {
    inferences.push({ property: 'bodyPotential', value: 'higher', confidence: 0.65,
      because: 'Fruit-forward processing commonly contributes more perceived sweetness and body.', rule: 'heuristics#process' });
    risks.push({ risk: 'muddiness from excessive agitation', likelihood: 'moderate', because: 'Heavy agitation can blur a natural or anaerobic coffee.' });
  }

  if (observation.setup.waterProfile === undefined || observation.unknowns.includes('waterProfile')) {
    risks.push({ risk: 'water may cap clarity or sweetness', likelihood: 'unknown', because: 'Water composition is unspecified, so it remains an explicit assumption.' });
  }

  const databaseProfile = observation.coffee.databaseProfile;
  if (databaseProfile?.matchedLots) {
    const notes = databaseProfile.notes.slice(0, 4).join(', ');
    inferences.push({
      property: 'indexedProfile',
      value: notes || 'catalogued flavour profile available',
      confidence: Math.min(0.55, 0.25 + databaseProfile.matchedLots * 0.04),
      because: `CoffeeDB's public index has ${databaseProfile.matchedLots} similar lot(s); use recurring descriptors as an expectation, not a target.`,
      rule: 'coffeedb#indexed-profile',
    });
  }

  return { inferences, risks };
}
