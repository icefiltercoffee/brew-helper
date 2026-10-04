/**
 * Brew Helper — Palate Calibration Engine (System 6).
 *
 * Why this exists: every other confidence signal in the platform scores the EVIDENCE
 * (source tier, completeness, convergence). None of them scored the INSTRUMENT — the
 * palate producing the observation. An immaculately-sourced diagnosis built on a
 * mis-read cup is still wrong. This module scores the instrument.
 *
 * Two jobs, deliberately kept apart:
 *   TRANSLATION  — vocabulary mapping ("chamomile" -> "jasmine"). Not a confidence factor.
 *   RELIABILITY  — per-axis agreement with the calibration panel. IS a confidence factor.
 *
 * Protocol: blind triangulation. Owner + calibrators taste the same brew independently,
 * no discussion, then log. Non-blind sessions are inadmissible (anchoring contaminates
 * the agreement rate — you cannot measure agreement with an answer you were shown).
 *
 * Conflict rule: champion overrides on the axis in dispute; the owner's raw read is
 * always retained, because the disagreement IS the training signal.
 */
import type {
  PalateEngine, PalateCalibration, CalibrationSession, TastingRecord, Taster, TasterId,
  RadarPriorities, AxisStats, PalateReliability, LexiconMapping, EvidenceLevel, BrewOutcome,
} from '../contracts';

const AXES: (keyof RadarPriorities)[] = ['sweetness', 'clarity', 'body', 'acidity', 'floral', 'juiciness'];

/** Sessions needed before reliability is quoted at all / before it is fully weighted. */
const MIN_SESSIONS = 3;
const MATURE_SESSIONS = 8;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function levelOf(r: number): EvidenceLevel {
  return r >= 0.8 ? 'High' : r >= 0.65 ? 'Moderate' : r > 0 ? 'Limited' : 'None';
}

/** Panel reference for one axis: authority-weighted mean of the calibrators. */
function panelValue(recs: TastingRecord[], cal: Map<TasterId, Taster>, axis: keyof RadarPriorities): number | null {
  const cs = recs.filter((r) => cal.get(r.taster)?.role === 'calibrator');
  if (!cs.length) return null;
  const wsum = cs.reduce((s, r) => s + (cal.get(r.taster)!.panelWeight || 1), 0);
  return cs.reduce((s, r) => s + r.radar[axis] * (cal.get(r.taster)!.panelWeight || 1), 0) / wsum;
}

/** How far apart the calibrators are from each other on an axis — the axis's inherent subjectivity. */
function spread(recs: TastingRecord[], cal: Map<TasterId, Taster>, axis: keyof RadarPriorities): number {
  const vs = recs.filter((r) => cal.get(r.taster)?.role === 'calibrator').map((r) => r.radar[axis]);
  return vs.length < 2 ? 0 : Math.max(...vs) - Math.min(...vs);
}

function computeReliability(
  sessions: CalibrationSession[], owner: TasterId, cal: Map<TasterId, Taster>,
): PalateReliability {
  const perAxis = {} as Record<keyof RadarPriorities, AxisStats>;
  const admissible = sessions.filter((s) => s.blind === true);

  for (const axis of AXES) {
    const errs: number[] = [];
    const biases: number[] = [];
    const spreads: number[] = [];

    for (const s of admissible) {
      const own = s.records.find((r) => r.taster === owner);
      const ref = panelValue(s.records, cal, axis);
      if (!own || ref === null) continue;
      const sp = spread(s.records, cal, axis);
      const raw = own.radar[axis] - ref;
      // Discount the panel's own disagreement: you are not penalised for missing a
      // target the champions themselves could not agree on.
      const adj = Math.max(0, Math.abs(raw) - sp / 2);
      errs.push(adj);
      biases.push(raw);
      spreads.push(sp);
    }

    const n = errs.length;
    // Radar axes are 0..1, so mean absolute error maps directly onto a 0..1 penalty.
    const reliability = n ? clamp01(1 - mean(errs)) : 0;
    perAxis[axis] = {
      reliability: n ? Number(reliability.toFixed(3)) : 0,
      bias: n ? Number(mean(biases).toFixed(3)) : 0,
      panelSpread: n ? Number(mean(spreads).toFixed(3)) : 0,
      n,
      level: n >= MIN_SESSIONS ? levelOf(reliability) : 'None',
    };
  }

  const sessionCount = admissible.length;
  const maturity = clamp01(sessionCount / MATURE_SESSIONS);
  const overall = Number(mean(AXES.map((a) => perAxis[a].reliability)).toFixed(3));
  // Below MIN_SESSIONS the number exists but is not quotable — level stays 'None'.
  const level: EvidenceLevel = sessionCount < MIN_SESSIONS ? 'None' : levelOf(overall * (0.7 + 0.3 * maturity));

  return { perAxis, overall, sessions: sessionCount, maturity: Number(maturity.toFixed(2)), level };
}

/**
 * Lexicon: which panel term shows up when the owner reaches for a given word, in the
 * same blind session on the same cup. Co-occurrence only — never a synonym dictionary,
 * because the whole point is that YOUR "chamomile" may not be anyone else's.
 */
function computeLexicon(sessions: CalibrationSession[], owner: TasterId, cal: Map<TasterId, Taster>): LexiconMapping[] {
  const pair = new Map<string, number>();
  const ownTotal = new Map<string, number>();

  for (const s of sessions.filter((x) => x.blind === true)) {
    const own = s.records.find((r) => r.taster === owner);
    if (!own) continue;
    const panelTerms = new Set(
      s.records.filter((r) => cal.get(r.taster)?.role === 'calibrator').flatMap((r) => r.descriptors.map((d) => d.toLowerCase().trim())),
    );
    for (const ut of new Set(own.descriptors.map((d) => d.toLowerCase().trim()))) {
      ownTotal.set(ut, (ownTotal.get(ut) ?? 0) + 1);
      // A term the panel also used is not a mistranslation — skip it.
      if (panelTerms.has(ut)) continue;
      for (const pt of panelTerms) pair.set(`${ut}|${pt}`, (pair.get(`${ut}|${pt}`) ?? 0) + 1);
    }
  }

  const out: LexiconMapping[] = [];
  for (const [k, count] of pair) {
    const [userTerm, panelTerm] = k.split('|');
    if (count < 2) continue;                       // one co-occurrence is coincidence
    const confidence = clamp01(count / (ownTotal.get(userTerm) || count));
    if (confidence < 0.6) continue;                // must be the DOMINANT partner, not one of five
    out.push({ userTerm, panelTerm, count, confidence: Number(confidence.toFixed(2)) });
  }
  // Keep only the single strongest mapping per user term.
  const best = new Map<string, LexiconMapping>();
  for (const m of out.sort((a, b) => b.confidence - a.confidence || b.count - a.count)) {
    if (!best.has(m.userTerm)) best.set(m.userTerm, m);
  }
  return [...best.values()];
}

export function createPalateEngine(): PalateEngine {
  return {
    calibrate(sessions, owner, calibrators) {
      const map = new Map<TasterId, Taster>(calibrators.map((c) => [c.id, c]));
      return {
        owner,
        calibrators,
        sessions,
        reliability: computeReliability(sessions, owner, map),
        lexicon: computeLexicon(sessions, owner, map),
      };
    },

    translate(descriptors, cal) {
      const used: LexiconMapping[] = [];
      const terms = descriptors.map((d) => {
        const hit = cal.lexicon.find((m) => m.userTerm === d.toLowerCase().trim());
        if (hit) { used.push(hit); return hit.panelTerm; }
        return d;
      });
      return { terms, used };
    },

    resolve(outcome: BrewOutcome, cal: PalateCalibration) {
      const map = new Map<TasterId, Taster>(cal.calibrators.map((c) => [c.id, c]));
      const radar = { ...outcome.observed } as RadarPriorities;
      const overridden: (keyof RadarPriorities)[] = [];
      const notes: string[] = [];

      const panelPresent = (outcome.panel ?? []).some((r) => map.get(r.taster)?.role === 'calibrator');

      for (const axis of AXES) {
        const stats = cal.reliability.perAxis[axis];
        if (panelPresent) {
          // CONFLICT RULE: a calibrator tasted this same cup — their read is the truth
          // for diagnosis. The owner's raw value stays in `outcome.observed` untouched,
          // so the disagreement still feeds the next calibration pass.
          const ref = panelValue(outcome.panel!, map, axis);
          if (ref !== null) {
            if (Math.abs(ref - outcome.observed[axis]) > 0.15) overridden.push(axis);
            radar[axis] = ref;
          }
        } else if (stats && stats.n >= MIN_SESSIONS && Math.abs(stats.bias) >= 0.08) {
          // Solo brew: apply the learned offset, scaled by how mature the calibration is.
          radar[axis] = clamp01(outcome.observed[axis] - stats.bias * cal.reliability.maturity);
        }
      }

      if (panelPresent) {
        notes.push(overridden.length
          ? `Calibrator present — their read overrode yours on ${overridden.join(', ')}; your reading logged for calibration.`
          : 'Calibrator present and your read agreed across the board.');
      } else if (cal.reliability.sessions < MIN_SESSIONS) {
        notes.push(`Palate not yet calibrated (${cal.reliability.sessions}/${MIN_SESSIONS} blind sessions) — diagnosis treats your notes at face value.`);
      } else {
        const corrected = AXES.filter((a) => Math.abs(cal.reliability.perAxis[a].bias) >= 0.08);
        notes.push(corrected.length
          ? `Bias-corrected against panel on ${corrected.join(', ')} (calibration maturity ${Math.round(cal.reliability.maturity * 100)}%).`
          : 'Your palate tracks the panel closely — no correction needed.');
      }

      const { terms, used } = this.translate(outcome.descriptors ?? outcome.notes ?? [], cal);
      if (used.length) notes.push(`Translated: ${used.map((m) => `"${m.userTerm}" → ${m.panelTerm}`).join(', ')}.`);

      // Sensory confidence: full trust when a champion tasted it; otherwise the owner's
      // calibrated reliability, capped by how mature that calibration is.
      const sensoryConfidence: EvidenceLevel = panelPresent
        ? 'High'
        : cal.reliability.sessions < MIN_SESSIONS
          ? 'None'
          : levelOf(cal.reliability.overall * (0.7 + 0.3 * cal.reliability.maturity));

      return { radar, descriptors: terms, sensoryConfidence, note: notes.join(' '), overridden, used };
    },
  };
}

/** Empty calibration — the honest default before any session is logged. */
export function uncalibrated(owner: TasterId = 'owner', calibrators: Taster[] = []): PalateCalibration {
  return createPalateEngine().calibrate([], owner, calibrators);
}
