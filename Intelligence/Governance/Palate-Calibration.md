# System 6 — Palate Calibration

**Purpose:** the permanent editorial policy for *how much the taster's own perception counts*. Every other confidence signal in this platform scores the **evidence**. This one scores the **instrument**.

**Implemented by:** `Platform/packages/palate/palate-engine.ts`, consumed by the Diagnosis Engine (M4) and reported as the `palateCalibration` dimension of the Evidence Profile.

> Principle: **science sets the boundaries; practice fills them; the palate reads the result — and the reading needs its own error bar.**

---

## 0. The problem this solves

The Trust Matrix will happily score a Tier-A championship recipe at 0.85 and then diagnose your cup against a tasting note you got wrong. Sourcing quality and observation quality are independent failure modes, and until now only the first was measured.

Flavour perception is genuinely subjective — not merely noisy. You taste *chamomile* where a champion tastes *jasmine*. That divergence has two entirely different causes, and treating them as one thing is the central design trap:

| | What it is | Fix | Is it a confidence factor? |
|---|---|---|---|
| **Vocabulary divergence** | You both perceive the same thing, you label it differently | Translation map | **No** — it is a dictionary |
| **Intensity divergence** | You genuinely read the axis higher or lower than the panel | Bias offset + reliability weight | **Yes** |

Conflating them produces a system that punishes you for having your own words, or trusts you for using the right ones. They are kept strictly separate.

---

## 1. The calibration panel

Three champion brewers at your café, logged as `calibrator` tasters with a `panelWeight` (0–1) reflecting relative authority:

| id | Name | Slot |
|---|---|---|
| `champ-darren` | Darren | Champion 1 |
| `champ-sweefong` | Swee Fong | Champion 2 |
| `champ-xiaoqian` | Xiao Qian | Champion 3 |

The panel is the reference, not the truth — where they disagree with each other, that axis is treated as inherently subjective and you are not penalised for missing it (see §3).

**Two calibrators is the working minimum per session; three is materially better.** Panel spread from two tasters is a single distance and is easily distorted by one off day. With three, the spread is a real distribution — an outlier reads as an outlier rather than doubling the tolerance band. All three need not attend every session: any two present makes it admissible. A session with only one calibrator still yields translation data, but contributes no reliability (no measurable spread means every disagreement gets charged to you).

---

## 2. Protocol — blind triangulation

**Admissibility rule: a non-blind session is not evidence.** If you see a champion's score before logging yours, the agreement rate measures anchoring, not perception. The engine drops any session without `blind: true`.

1. One brew, one batch, poured into identical cups, tasted at the same temperature.
2. All three taste independently. No discussion, no visible logging.
3. Each logs: six radar axes 0–1, plus **verbatim** free descriptors. Write "chamomile" if that is what you taste — do not pre-translate.
4. Records submitted, then discussed. Discussion after logging is encouraged; it is how you learn. It just cannot happen before.
5. **Vary the coffee across sessions.** Washed / natural / anaerobic, light and medium. Calibrating exclusively on light washed Ethiopians teaches the system exactly one thing.

Thresholds: **3 blind sessions** before any reliability figure is quoted; **8 sessions** for full maturity weighting.

---

## 3. The reliability computation

Per axis, per session:

```
panelRef    = weighted mean of calibrator scores
panelSpread = max(calibrator) - min(calibrator)        # the axis's inherent subjectivity
rawError    = owner - panelRef                          # signed → this is the BIAS
adjError    = max(0, |rawError| - panelSpread / 2)      # spread-discounted → this is the ERROR
```

Aggregated across sessions:

| Output | Meaning | Use |
|---|---|---|
| **reliability** = `1 - mean(adjError)` | how closely you track the panel on this axis | weights your feedback |
| **bias** = `mean(rawError)` | signed — `+` means you read this axis *hotter* than the panel | corrects your solo readings |
| **panelSpread** | how much the champions disagree | protects you on subjective axes |
| **maturity** = `min(1, sessions / 8)` | confidence in the reliability figure itself | scales the correction |

**The spread discount is the important line.** If your two champions land 0.3 apart on *floral*, floral is not a thing you can be objectively wrong about, and the engine stops pretending otherwise. Half the spread is forgiven before any error is charged.

**Bands** (reliability → level): High ≥ 0.80 · Moderate ≥ 0.65 · Limited > 0 · None (< 3 sessions). Same shape as the Trust Matrix bands, deliberately — one vocabulary across the platform.

---

## 4. The translation layer

Descriptor co-occurrence within blind sessions on the same cup. When you write "chamomile" and the panel writes "jasmine" on that same brew, the pair gets a count.

A mapping is admitted only when it is: **repeated** (count ≥ 2 — one co-occurrence is coincidence) and **dominant** (≥ 60% of your uses of that term). Terms the panel also used are never mapped — you agreed, there is nothing to translate.

This is explicitly **not** a synonym dictionary. Generic flavour-wheel synonyms would defeat the point: the whole premise is that *your* "chamomile" may not be anyone else's, and only your own session data can establish what it means.

Translations apply before the Diagnosis Engine reads your notes, and are surfaced in the diagnosis output (`translated`) — never applied silently.

---

## 5. The conflict rule — champion overrides

When a calibrator tasted **the same cup**:

- The panel's reading drives the diagnosis, axis by axis.
- Your raw reading is **retained untouched** in `outcome.observed`. The disagreement is the training signal — discarding it would stop the calibration improving.
- Axes diverging by > 0.15 are named explicitly in the diagnosis note. No silent overriding, ever.

When brewing solo (the normal case):

- Your reading is **bias-corrected**: `corrected = observed - bias × maturity`. Immature calibration corrects gently; mature calibration corrects fully.
- Correction only fires where `|bias| ≥ 0.08` — below that it is noise, not a systematic offset.
- Diagnosis confidence is set to your calibrated reliability, not to 'High'.

---

## 6. How it changes the recommendation

**`sensoryConfidence` on the Diagnosis** — a first-class output alongside cause and adjustments:

| Condition | Level | Behaviour |
|---|---|---|
| Calibrator tasted this cup | **High** | Full confidence; normal multi-lever diagnosis |
| Calibrated, good tracking | **High / Moderate** | Bias-corrected; normal diagnosis |
| Calibrated, loose tracking | **Limited** | Single lever only; framed as a probe, not a verdict |
| < 3 blind sessions | **None** | Single lever only; explicitly flagged provisional |

**`palateCalibration` on the Evidence Profile** — reported as an eighth dimension, and deliberately **not averaged into the other seven**. The other seven qualify the *evidence*; this one qualifies the *observation*. Averaging them would let a well-sourced recipe launder a badly-read cup.

**State gate:** an uncalibrated palate cannot lift a recommendation into **Highly Supported** on the strength of your own brew history. Familiarity earned from feedback is only as trustworthy as the palate that logged it — so `coffeeSimilarity` above `Limited` combined with `palateCalibration: None` caps the state at **Well Supported**.

---

## 7. What this does not claim

- It does not make flavour objective. It makes your readings *translatable* and *bounded*.
- It does not make the champions right. They are a reference standard with a measurable internal spread, and that spread is treated as real uncertainty rather than hidden.
- It does not override your **preferences**. Calibration governs *description* ("how floral is this cup"), never *target* ("how floral do I want it"). Your radar intent is yours and is never corrected.

---

## 8. Governance

- Calibrators are declared in `Platform/data/palate-calibration.json` and mirrored in the site's `TASTERS` map — the ids must match (`champ-darren`, `champ-sweefong`, `champ-xiaoqian`).
- Sessions live in `Platform/data/palate-calibration.json`, append-only. Corrections are new sessions, never edits.
- Recalibrate on material change: new grinder, palate drift, a long break, or a new calibrator joining.
- A calibrator who stops being available keeps their historical weight; sessions are not retroactively rescored.
- Editor-in-chief (Joseph) may adjust `panelWeight`, but not delete a logged session — the disagreement record is the asset.
