# Brew Helper — Reasoning Scaffold

**Type:** The operational template — how the loop actually runs, stage by stage
**Reads with:** `Extraction-Intelligence-Layer.md` (the framework) · `Interpretation-Heuristics.md` (the knowledge)
**Scope:** the I/O contract and reasoning discipline. Not code, not prompts-for-a-specific-model — a spec any implementation follows.

> The loop is a **pipeline**: each stage consumes the previous stage's structured output and emits its own. The strategy object (Stage 3) is the load-bearing artifact — everything downstream references it by id.

---

## 1. Operating rules (the standing instruction)

The reasoning engine operates under a fixed charter:

1. You are an elite World Brewers Cup coach reasoning aloud, then advising. Persona per `UI_Personality.md`.
2. **Never emit a recipe before a strategy exists.** Stages run in order; Recommend reads Decide's output or it does not run.
3. Every parameter you output carries a `because` that traces to the strategy. No orphan numbers.
4. Lead every user-facing recommendation with a **judgement** (one or two decisive sentences).
5. Cite **mechanisms**, not sources. Ground claims in the extraction curve (`Interpretation-Heuristics.md`), not "a champion did this."
6. State **confidence** and name **unknowns**. A first brew on an unfamiliar coffee is a *probe*, and you say so.
7. Apply the **user model** (equipment / preference / coffee) over generic defaults; when it changes your advice, surface it.
8. Teach in layers: headline reason always visible, mechanism one tap deeper. Never overwhelm.

---

## 2. The pipeline & its artifacts

```
observation ─▶ interpretation ─▶ strategy ─▶ recipe ─▶ teaching ─▶ learning
  (S1)            (S2)            (S3)★       (S4)       (S5)         (S6)
                                   │                                   │
             every recipe param ── refs ──▶ strategy.id                │
                                                                       ▼
                                        user model + history ◀── updated by S6
```

Each artifact is structured so the dashboard can render it directly (mapping in §4) and so the next stage can consume it without re-deriving.

---

## 3. Stage I/O contracts

Schemas are illustrative (field names + intent), not a wire format.

### S1 · Observe → `observation`
```
observation {
  coffee:  { origin, producer, variety, process, altitude, roast_level, roast_age_days, tasting_notes[] }
  setup:   { grinder, brewer, brewer_material:["plastic"|"ceramic"|"metal"|"glass"], filter, water_profile, batch_size }
  intent:  { sweetness, clarity, body, acidity, floral, juiciness }   // 0–1 from the radar
  unknowns: [ "water_profile", ... ]     // explicitly listed, never guessed
}
```
Rule: record only. No inference fields here.

### S2 · Interpret → `interpretation`
```
interpretation {
  inferences: [
    { property:"density", value:"high", confidence:0.8,
      because:"1,850 masl → slow maturation → dense cell structure",
      rule:"heuristics#altitude-density" }, ...
  ]
  // properties: density, solubility, roast_development, extraction_difficulty,
  //             sweetness_potential, acidity_structure, body_potential
  risks: [ { risk:"under-extraction → hollow/sour", likelihood:"high", because:"light + dense" } ]
}
```
Rule: every inference has `because` + `rule` + `confidence`.

### S3 · Decide → `strategy`  ★ load-bearing
```
strategy {
  id: "str_001"
  primary_objective:   "maximise clarity"
  secondary_objective: "preserve delicate florals"
  tradeoffs:          [ "accept lighter body" ]
  extraction_target:  { position:"mid-to-upper", approach:"energy via evenness, not aggression" }
  constraints_from_intent: [ "clarity high", "floral high", "body low" ]  // radar as constraints
  rationale: "the coffee needs energy (dense/light) but the cup needs gentleness (delicate washed) — resolve the tension toward even, controlled extraction"
}
```
Rule: this is the most important object. If it is weak or missing, halt — do not fabricate a recipe.

### S4 · Recommend → `recipe`

Before emitting the final recipe, run the bounded optimisation sub-loop:

`baseline recipe → estimated current profile → sensory gap → defect-first objective → smallest effective change → diagnostic next step`

- Build and retain the baseline independently of radar preferences. The radar cannot create a recipe without coffee and equipment context.
- Estimate the baseline cup from direct current feedback first, then similar brews, the coffee/equipment model, and finally general heuristics.
- Calculate each gap as `desired - current`. Gap size, confidence, defects, constraints, and conflicts determine movement; slider height alone never does.
- Couple radar inputs visibly before strategy generation: moving one axis updates its scientific synergies and antagonists through the shared coupling matrix. The values shown after that movement are the values passed into the strategy; no hidden second profile exists.
- Defect correction and evenness outrank stylistic optimisation. A thin, sour, hollow cup must not be ground coarser merely to chase clarity.
- Change one primary variable and at most one supporting variable. Hold everything else stable so the next brew remains diagnostic.
- Default bounds from baseline: grind ±2 calibrated steps, temperature ±2°C, ratio ±1.0, time ±20s, agitation one qualitative level. Bloom changes require freshness/degassing evidence.
- Use grinder-specific mappings only when calibration exists; otherwise return qualitative direction and mark the mapped value unavailable.

The output retains `baselineRecipe`, `estimatedCurrentProfile`, `sensoryGap`, `primaryObjective`, final `params`, `materialChanges`, `tradeoffs`, qualitative `confidence`, `observationTarget`, and one-variable `nextAdjustment`.
```
recipe {
  strategy_ref: "str_001"
  params: [
    { name:"grind", value:"medium-fine",
      because:"add energy via surface area, not heat — protects florals",
      serves:"str_001.secondary_objective", lever:"grind" },
    { name:"temp", value:"93°C", because:"enough to extract a dense light roast without scorching aromatics", serves:"str_001", lever:"temp" },
    { name:"flow_rate", value:"4–5 g/s", because:"quantifies gentle pulse pours so agitation stays repeatable", serves:"str_001.primary_objective", lever:"agitation" },
    { name:"bypass_ml", value:"0–20g", because:"adjusts final strength without altering extraction yield", serves:"str_001.primary_objective", lever:"bypass" },
    { name:"brewer_material", value:"plastic", because:"low thermal mass requires no temperature compensation", serves:"str_001", lever:"temperature_compensation" },
    ...  // dose, water_comp, bloom, pour_structure, drawdown_target, total_time as needed
  ]
  predicted_cup: { clarity:"high", floral:"present", body:"light", sweetness:"medium" }
}
```
Rule: every `param` has `because` + `serves` (→ strategy). No param without both.

### S5 · Teach → `teaching`
```
teaching {
  judgement: "My read: this coffee's strength is clarity and florals, not body — so I'd chase a clean, articulate cup and let the weight be light."
  lessons: [
    { param:"grind", why:"finer, not hotter", principle:"grind is the scalpel; heat is the hammer",
      outcome:"more sweetness without losing florals", tradeoff:"slightly slower flow" }, ...
  ]
  depth:"layered"   // headline visible, mechanism on demand
}
```
Rule: `judgement` renders first, above the recipe. Lessons attach to the param they explain.

### S6 · Learn → `learning`
```
learning {
  expected: recipe.predicted_cup
  observed: { from debrief sliders + notes }      // e.g. { body:"thin", finish:"short", note:"hollow middle" }
  gap:      [ { axis:"sweetness", direction:"below target", read:"under-extraction" } ]
  diagnosis:{ cause:"under-extraction", because:"hollow middle = sweetness not reached" }
  adjustments: [ { lever:"grind", move:"2 steps finer", loops_to:"str_001" },
                 { lever:"temp", move:"+1°C to 94" } ]     // one primary lever, minimal
  model_updates: [ { model:"coffee", note:"this lot extracts slower than its roast implies" } ]
  surface_next_time: true   // tell the user when this changes future advice
}
```
Rule: adjustments **loop back to Decide** (re-enter S3 with a refined target), not straight to a new recipe. Prefer a single highest-leverage move (`Interpretation-Heuristics.md` §6).

---

## 4. Binding to the dashboard

| Artifact | Renders as |
|---|---|
| `observation` | New Brew intake (already user-entered) |
| `interpretation` | Coffee → "AI read": strengths ← positive inferences, challenges ← risks, advice ← lever hints |
| `strategy` | The framing above the Radar + the coach line that updates as priorities change |
| `recipe.params` | Recipe card params; `predicted_cup` seeds the match ranking |
| `teaching.judgement` | The opening sentence of the AI read and the recipe |
| `teaching.lessons` | The per-step **"why"** disclosures |
| `learning` | Reflection → diagnosis + next-brew checklist ("loops back to radar") |

The radar's live reactivity is Stage 3 recomputing in real time: moving a priority changes `strategy.constraints_from_intent`, which re-derives `recipe` and re-ranks matches — the user *sees* strategy become recipe.

---

## 5. Handling uncertainty & missing data

- **Missing input** → list it in `observation.unknowns`, proceed with a stated assumption, and lower `confidence`. e.g. no water profile → "assuming decent brew water; if the cup reads flat, suspect the water first."
- **Low confidence** → the judgement says so and frames the brew as a probe: *"I'm less sure here — let's treat this as a calibration brew and read the result."*
- **Conflicting priorities** (e.g. Clarity + Body both high) → the strategy **names the conflict** and takes a defensible side rather than splitting the difference into mush; the trade-off is stated plainly.
- **Contradiction with the user model** → the model usually wins ("your grinder runs coarse, so I've gone finer than the book"), and the AI says why.

Never resolve uncertainty by inventing precision. Under-specified is honest; falsely exact is not.

---

## 6. Worked trace (abridged)

*Colombia Risaralda · washed · light · 13 days · 1,850 masl · V60 · Comandante · radar: Clarity + Floral.*

- **S1** `observation` — records the above; `unknowns:["water_profile"]`.
- **S2** `interpretation` — density:high (altitude), solubility:low (light), difficulty:high; risks:[under-extraction, astringency-from-agitation].
- **S3** `strategy str_001` — primary:clarity, secondary:florals, tradeoff:lighter body, target:mid-upper via *evenness not aggression*.
- **S4** `recipe(str_001)` — grind medium-fine (energy via surface area) · 93°C (extract without scorching) · gentle pulse pours (no astringency) · brisk ~2:30 (stay bright). Every param `serves` str_001.
- **S5** `teaching` — judgement: "chase clarity and florals, let body be light"; lessons attach finer-not-hotter, gentle-not-aggressive.
- **S6** `learning` — if debrief = "hollow middle" → diagnosis under-extraction → adjustment: grind 2 finer (loops to str_001), +1°C; model_update: this lot extracts slow; surface next time.

---

## 7. Definition of done (per recommendation)

A recommendation may surface only when all are true:

- [ ] Ran S1→S5 in order; `strategy` exists before `recipe`.
- [ ] Every `recipe.param` has `because` + `serves`.
- [ ] A `judgement` leads.
- [ ] Claims cite mechanisms; confidence stated; unknowns named.
- [ ] User model applied (and surfaced if it changed the advice).
- [ ] Teaching is layered, not dumped.

If any box is unchecked, the recommendation is not ready — hold it, don't ship a guess.

---

*The scaffold guarantees the discipline: strategy first, every number earns its reason, every brew teaches — the system and the brewer both.*
