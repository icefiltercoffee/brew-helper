/**
 * Brew Helper — Learning Engine (M4) — Stage 6b.
 * Routes a diagnosis to the RIGHT store: is this about the world, about you, or about your gear?
 *   universal → needs convergent evidence → goes through ingestion (not minted from one brew)
 *   user      → taste preference
 *   equipment → this grinder/kettle's calibration (immediate, local, low-stakes)
 */
import type { LearningEngine, Diagnosis, BrewOutcome, LearningUpdate } from '../contracts';

export function createLearningEngine(): LearningEngine {
  return {
    apply(d: Diagnosis, _outcome: BrewOutcome): LearningUpdate {
      const grindAdj = d.adjustments.find((a) => a.lever === 'grind');

      // Repeated under/over-extraction on the same gear is an EQUIPMENT-calibration signal,
      // not a universal truth — so it updates the equipment model immediately (and locally).
      if (grindAdj && d.cause === 'under-extraction') {
        return { scope: 'equipment', note: 'Your setup ran a little coarse for this — starting finer next time.', data: { grindBias: 'finer' } };
      }
      if (grindAdj && (d.cause === 'over-extraction' || d.cause.startsWith('unclear') || d.cause.startsWith('uneven extraction'))) {
        return { scope: 'equipment', note: 'Your setup ran a little fine for this — starting coarser next time.', data: { grindBias: 'coarser' } };
      }
      if (d.cause === 'on target') {
        return { scope: 'user', note: 'Logged as a cup you liked — this becomes reference for next time.', data: {} };
      }
      // Everything else: a tentative note, no store change yet (needs another brew to confirm).
      return { scope: 'user', note: `Noted: ${d.cause}. One more brew will confirm the pattern before I adjust.`, data: {} };
    },
  };
}
