/**
 * Brew Helper — Extraction Strategy Generator (M1) — Stage 3, the product.
 * Rules-based: turns radar intent + applicable principles into a strategy.
 * Strategy is constructed BEFORE any recipe. Principles that apply are folded in
 * (e.g. PRN-0001 fires when clarity AND sweetness are both wanted → staged method).
 */
import type { StrategyGen, Strategy, RadarPriorities, Claim, Interpretation, Observation, Principle } from '../contracts';
import { interpretRadar } from './radar-interpreter';

type Axis = keyof RadarPriorities;

const APPROACH: Record<Axis, string> = {
  clarity: 'even, controlled extraction — moderate agitation, protect against fines',
  sweetness: 'improve evenness, saturation, and concentration before adding extraction energy',
  body: 'a fuller extraction — finer or immersion, more contact',
  acidity: 'integrate vibrant acidity with sweetness while correcting sour under-extraction',
  floral: 'improve aromatic clarity and avoid harsh extraction without assuming lower temperature',
  juiciness: 'integrate sweetness, acidity, texture, aroma, and palate flow through evenness',
};

function ranked(intent: RadarPriorities): Axis[] {
  return (Object.keys(intent) as Axis[]).sort((a, b) => intent[b] - intent[a]);
}

export function createStrategyGenerator(principles: Principle[] = []): StrategyGen {
  return {
    generate({ intent, interpretation, observation }: { claims: Claim[]; intent: RadarPriorities; interpretation: Interpretation; observation: Observation }): Strategy {
      const radar = interpretRadar(intent, observation);
      const order = ranked(intent);
      const primary = radar.balanced ? 'balance' : order[0];
      const secondary = radar.balanced ? 'evenness' : order[1];
      const tradeoff = order[order.length - 1];

      // Which active principles apply? A principle applies only when EVERY cup quality it
      // names is actually wanted (intent ≥ 0.55) — so PRN-0001 (clarity+sweetness) fires only
      // when both are high, not when just one is.
      const AXES = Object.keys(intent) as Axis[];
      // Only the appliesWhen conditions define applicability (the statement mentions other
      // axes incidentally while describing the mechanism).
      const axisMentions = (p: Principle): Axis[] => {
        const hay = p.appliesWhen.join(' ').toLowerCase();
        return AXES.filter((a) => hay.includes(a));
      };
      const applied = principles.filter((p) => {
        const named = axisMentions(p);
        return named.length > 0 && named.every((a) => radar.axes[a].relativeWeight >= 0.57);
      });

      // A staged-method principle (e.g. PRN-0001) that resolves a clarity+sweetness tension.
      const methodPrinciple = applied.find(
        (p) => /immersion|percolation|staged|switch/i.test(p.statement + p.strategyImplication),
      );
      const hasSwitch = /switch/i.test(observation.setup.brewer ?? '');
      const methodHint = methodPrinciple && hasSwitch
        ? 'staged percolation→immersion (Switch) — develop acidity/florals, then sweetness/body on separate clocks'
        : undefined;

      const difficult = interpretation.inferences.some((i) => i.property === 'extractionDifficulty' && i.value === 'higher');
      const delicate = /washed|anaerobic/.test(observation.coffee.process?.toLowerCase() ?? '') || primary === 'floral';

      const position =
        primary === 'balance' ? 'baseline character, refined through coherence and evenness'
          : primary === 'clarity' || primary === 'floral' || primary === 'acidity'
          ? 'mid, reached via evenness rather than aggression'
          : 'mid-to-upper, for sweetness support';

      const rationaleBits = [
        radar.balanced
          ? 'The radar is balanced, so there is no dominant sensory direction; preserve the coffee\'s baseline character and optimise coherence.'
          : `You're asking most for ${primary} and ${secondary}; ${APPROACH[primary as Axis]}.`,
        radar.balanced ? 'Low priorities may be traded away, but none are actively suppressed.' : `Accepting less ${tradeoff} is the trade.`,
      ];
      rationaleBits.push(...radar.interactions);
      if (radar.conflictNote) rationaleBits.push(radar.conflictNote);
      if (difficult) rationaleBits.push('This coffee needs enough energy to reach sweetness, but that energy should come from grind and contact before heat.');
      if (delicate) rationaleBits.push('Keep the delivery gentle so the cup stays articulate rather than drying.');
      if (methodPrinciple) rationaleBits.push(`Applies ${methodPrinciple.id}: ${methodPrinciple.strategyImplication}`);
      if (methodPrinciple && !hasSwitch) rationaleBits.push('The staged Switch method is compatible with a valve brewer only, so this plan keeps the same clarity-and-sweetness intent within your current setup.');
      if (observation.coffee.databaseProfile?.matchedLots) {
        const profile = observation.coffee.databaseProfile;
        const descriptors = profile.notes.slice(0, 4).join(', ');
        rationaleBits.push(`CoffeeDB context: ${profile.matchedLots} similar indexed lot(s) commonly list ${descriptors || 'no recurring tasting descriptors'}; this informs the read without overriding your chosen extraction intent.`);
      }

      return {
        id: `str_${Date.now().toString(36)}`,
        primary,
        secondary,
        tradeoffs: radar.balanced ? [] : [`accept less ${tradeoff}`],
        extractionTarget: { position: difficult && position === 'mid, reached via evenness rather than aggression' ? 'mid-to-upper, reached via evenness rather than aggression' : position, approach: `${radar.balanced ? 'preserve baseline character through evenness and small balancing changes' : APPROACH[primary as Axis]}${difficult ? '; add energy through grind/contact' : ''}${delicate ? '; keep the delivery gentle' : ''}` },
        constraintsFromIntent: order.map((a) => `${a}: ${radar.axes[a].rawPriority} (${radar.axes[a].interpretationZone})`),
        rationale: rationaleBits.join(' '),
        methodHint,
        appliedPrincipleIds: applied.map((p) => p.id),
        radarInterpretation: radar,
      };
    },
  };
}
