/**
 * Brew Helper — Scientific Validation Engine (M2) — Layer 3, the physics gate.
 * A real (directional) extraction-curve model derived from Interpretation-Heuristics.md §0.
 * VETO blocks a recipe (physically wrong); WARN annotates a risk. Science is a gate, not a source.
 */
import type { ScienceEngine, Strategy, Recipe, Observation, Verdict, ScienceFlag } from '../contracts';

// ---- parsing helpers ----
const num = (v: string | undefined): number => { const m = (v ?? '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
function ratioDenom(v: string | undefined): number { const m = (v ?? '').match(/1\s*:\s*(\d+(\.\d+)?)/); return m ? parseFloat(m[1]) : NaN; }
function timeSeconds(v: string | undefined): number {
  const m = (v ?? '').match(/(\d+):(\d{2})/); if (m) return (+m[1]) * 60 + (+m[2]);
  const s = (v ?? '').match(/(\d+)\s*s/); return s ? +s[1] : NaN;
}
/** grind → 0 (fine) … 1 (coarse) */
function grindScale(v: string | undefined): number {
  const g = (v ?? '').toLowerCase();
  if (g.includes('extra') && g.includes('fine')) return 0.05;
  if (g.includes('medium-fine') || g.includes('medium fine')) return 0.4;
  if (g.includes('medium-coarse') || g.includes('medium coarse')) return 0.75;
  if (g.includes('coarse')) return 0.9;
  if (g.includes('fine')) return 0.2;
  if (g.includes('immersion') || g.includes('medium')) return 0.6;
  return 0.5;
}
const has = (s: string | undefined, ...w: string[]) => w.some((x) => (s ?? '').toLowerCase().includes(x));

export function createScienceEngine(): ScienceEngine {
  return {
    validateStrategy(s: Strategy, o: Observation): Verdict {
      const flags: ScienceFlag[] = [];
      const roast = (o.coffee.roastLevel ?? '').toLowerCase();
      // Chasing high extraction on a dark roast fights the curve (bitter compounds dissolve early/fast).
      if (roast.includes('dark') && has(s.extractionTarget.position, 'upper', 'high')) {
        flags.push({ severity: 'warn', message: 'Dark roast aimed at high extraction — the curve turns bitter early here; keep it gentle.' });
      }
      // Wanting clarity by pushing MORE extraction is self-defeating on delicate coffees.
      if (s.primary === 'clarity' && has(s.extractionTarget.approach, 'upper', 'aggress')) {
        flags.push({ severity: 'warn', message: 'Clarity comes from evenness, not more extraction — ease the energy, not add to it.' });
      }
      return { ok: true, flags };
    },

    validateRecipe(r: Recipe, o: Observation): Verdict {
      const flags: ScienceFlag[] = [];
      const roast = (o.coffee.roastLevel ?? '').toLowerCase();
      const process = (o.coffee.process ?? '').toLowerCase();
      const altitude = num(o.coffee.altitude);            // masl if present
      const p = (name: string) => r.params.find((x) => x.name === name)?.value;
      const temp = num(p('temp'));
      const grind = grindScale(p('grind'));
      const ratio = ratioDenom(p('ratio'));
      const time = timeSeconds(p('total time'));
      const agitation = p('agitation');

      // ---- TEMPERATURE ----
      if (!Number.isNaN(temp)) {
        if (temp > 96) flags.push({ severity: 'veto', message: `${temp}°C scorches most filter coffee — stay ≤ 96°C.` });
        if (roast.includes('dark') && temp >= 94) flags.push({ severity: 'veto', message: `${temp}°C on a dark roast over-extracts (bitter/ashy) — drop to ≤ 90°C.` });
        else if (roast.includes('dark') && temp >= 92) flags.push({ severity: 'warn', message: 'Dark roast near 92°C — watch for bitterness; 88–90°C is safer.' });
        if (roast.includes('light') && temp < 90) flags.push({ severity: 'warn', message: 'Cool water on a light roast risks under-extraction (sour/hollow).' });
        if (roast.includes('light') && altitude >= 1700 && temp < 92) flags.push({ severity: 'warn', message: 'Dense high-grown light roast wants more energy — consider 92–94°C.' });
      }

      // ---- GRIND × ROAST (extraction energy) ----
      if (roast.includes('dark') && grind < 0.35) flags.push({ severity: 'warn', message: 'Fine grind on a dark roast accelerates over-extraction — go coarser.' });
      if (roast.includes('light') && altitude >= 1700 && grind > 0.8 && (Number.isNaN(temp) || temp < 92))
        flags.push({ severity: 'warn', message: 'Coarse grind + cool water on a dense light roast is an under-extraction combo (sour/thin).' });

      // ---- AGITATION × PROCESS ----
      if ((has(process, 'washed') || process === '') && has(agitation, 'strong') )
        flags.push({ severity: 'warn', message: 'Strong agitation on a washed coffee invites astringency — soften the pours.' });
      if (has(process, 'natural', 'anaerobic') && has(agitation, 'strong'))
        flags.push({ severity: 'warn', message: 'Strong agitation on a natural/anaerobic can turn muddy — keep it even and gentle.' });

      // ---- RATIO ----
      if (!Number.isNaN(ratio)) {
        if (ratio < 13) flags.push({ severity: 'warn', message: `1:${ratio} is very strong — fine for intensity, but easy to under-dilute.` });
        if (ratio > 18) flags.push({ severity: 'warn', message: `1:${ratio} is very dilute — the cup may read thin.` });
      }

      // ---- TIME ----
      if (!Number.isNaN(time)) {
        if (roast.includes('dark') && time > 210) flags.push({ severity: 'warn', message: 'Long contact on a dark roast pulls the bitter tail — shorten it.' });
        if (grind < 0.3 && time > 240) flags.push({ severity: 'warn', message: 'Fine grind + long time risks over-extraction (drying finish).' });
      }

      return { ok: !flags.some((f) => f.severity === 'veto'), flags };
    },

    correctRecipe(r: Recipe, o: Observation): Recipe {
      const roast = (o.coffee.roastLevel ?? '').toLowerCase();
      const revised = r.params.map((param) => ({ ...param }));
      const change = (name: string, value: string, because: string) => {
        const target = revised.find((p) => p.name === name);
        if (target) { target.value = value; target.because = `${target.because}; ${because}`; }
      };
      const temp = num(revised.find((p) => p.name === 'temp')?.value);
      if (temp > 96) change('temp', '96°C', 'science gate capped water temperature');
      if (roast.includes('dark') && temp >= 94) change('temp', '90°C', 'science gate protects a dark roast from the bitter tail');
      return { ...r, params: revised };
    },
  };
}
