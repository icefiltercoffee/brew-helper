/**
 * Brew Helper — Diagnosis Engine (M4) — Stage 6a.
 * Compares the expected cup to what was tasted (sliders + notes), names the mechanism
 * (extraction curve, Interpretation-Heuristics §6), and prescribes the smallest effective move.
 * "One change at a time" — leads with a single primary adjustment.
 */
import type {
  DiagnosisEngine, RadarPriorities, BrewOutcome, Strategy, Diagnosis, Lever,
  PalateCalibration, EvidenceLevel, LexiconMapping,
} from '../contracts';
import { createPalateEngine } from '../palate/palate-engine';

type Axis = keyof RadarPriorities;
const has = (s: string, ...w: string[]) => w.some((x) => s.includes(x));

export function createDiagnosisEngine(): DiagnosisEngine {
  return {
    diagnose(expected: RadarPriorities, outcome: BrewOutcome, s: Strategy, cal?: PalateCalibration): Diagnosis {
      // ---- System 6: calibrate the instrument before reading it ----
      // Descriptors are translated into panel vocabulary and intensities are either
      // champion-overridden (calibrator tasted this cup) or bias-corrected (solo brew).
      let sensoryConfidence: EvidenceLevel | undefined;
      let calibrationNote: string | undefined;
      let translated: LexiconMapping[] | undefined;
      let obs = outcome.observed;
      let noteTerms = outcome.descriptors ?? outcome.notes ?? [];

      if (cal) {
        const r = createPalateEngine().resolve(outcome, cal);
        obs = r.radar;
        noteTerms = r.descriptors;
        sensoryConfidence = r.sensoryConfidence;
        calibrationNote = r.note;
        translated = r.used;
      }

      const notes = noteTerms.join(' ').toLowerCase();
      const gap = (a: Axis) => (obs[a] ?? expected[a]) - expected[a];   // negative = fell short
      const stalled = /stall|slow drawdown|clog|chok/.test(notes) || Boolean(outcome.execution?.drawdownSeconds && outcome.execution.drawdownSeconds > 210);
      const mixed = (has(notes, 'sour', 'hollow', 'thin') && has(notes, 'bitter', 'dry', 'astringent'));

      let cause = '', because = '';
      const adjustments: { lever: Lever; move: string; loopsTo: string }[] = [];
      const loop = s.id;

      if (stalled || mixed) {
        cause = 'uneven extraction / fines-heavy drawdown';
        because = 'the cup shows both early sourness and late dryness, so different parts of the bed are extracting at different rates.';
        adjustments.push({ lever: 'grind', move: 'grind 1 step coarser', loopsTo: loop });
      } else if (has(notes, 'bitter', 'harsh', 'ashy')) {
        cause = 'over-extraction';
        because = "the bitter, drying compounds dissolve last — you've gone past sweetness into the harsh tail.";
        adjustments.push({ lever: 'grind', move: 'grind 1–2 steps coarser', loopsTo: loop });
      } else if (has(notes, 'astringent', 'drying')) {
        cause = 'over-agitation (fines)';
        because = 'too much agitation or too many fines pulls a drying, astringent edge.';
        adjustments.push({ lever: 'agitation', move: 'pour more gently, fewer agitations', loopsTo: loop });
      } else if (has(notes, 'muddy', 'unclear', 'silty') || gap('clarity') < -0.2) {
        cause = 'unclear extraction (fines / uneven bed)';
        because = 'fines and an uneven bed blur flavour separation.';
        adjustments.push({ lever: 'grind', move: 'grind slightly coarser', loopsTo: loop });
      } else if (has(notes, 'sour', 'sharp', 'hollow', 'empty', 'thin') || gap('sweetness') < -0.15) {
        cause = 'under-extraction';
        because = "the sweetness hasn't developed yet — that hollow/sour edge means you stopped short of the mid-curve.";
        adjustments.push({ lever: 'grind', move: 'grind 1–2 steps finer', loopsTo: loop });
      } else if (has(notes, 'weak', 'watery')) {
        cause = 'low strength (fine, but dilute)';
        because = 'extraction is roughly right; the cup is just thin — concentration, not extraction.';
        adjustments.push({ lever: 'ratio', move: 'tighten the ratio (a little less water)', loopsTo: loop });
      } else if (has(notes, 'flat', 'dull', 'lifeless')) {
        cause = 'muted (water or stale coffee)';
        because = 'flatness usually points to over-buffered water or aged coffee, not technique.';
        adjustments.push({ lever: 'water', move: 'try lower-alkalinity water; check roast age', loopsTo: loop });
      } else {
        cause = 'on target';
        because = 'the cup matched the plan — no correction needed. Lock this in.';
      }

      // An uncalibrated or poorly-tracking palate must not produce a confident lever call.
      if (sensoryConfidence === 'None' || sensoryConfidence === 'Limited') {
        if (adjustments.length > 1) adjustments.length = 1;   // one lever only when the read is shaky
        because += sensoryConfidence === 'None'
          ? ' Treat this as provisional — your palate is not yet calibrated against the panel.'
          : ' Your palate tracks the panel loosely on this kind of cup, so this is a probe, not a verdict.';
      }

      return { cause, because, adjustments, sensoryConfidence, calibrationNote, translated };
    },
  };
}
