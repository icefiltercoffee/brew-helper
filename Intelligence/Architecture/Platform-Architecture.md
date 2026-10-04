# Brew Helper — Intelligence Platform Architecture

**Type:** Technical design document — the extraction-intelligence platform
**Companion:** `Engineering-Blueprint.md` (folder layout, data contracts, APIs, production)
**Builds on (does not duplicate):**
`../Extraction-Intelligence-Layer.md` (the 6-stage reasoning loop) · `../Reasoning-Scaffold.md` (stage I/O contracts) · `../Interpretation-Heuristics.md` (extraction theory) · `../Knowledge-Repository/` (evidence→principle pipeline)

> **Product thesis:** this is not a recipe database — it is an **extraction-intelligence platform**. Recipes are outputs; **reasoning is the product**. Every recommendation is *constructed* through structured reasoning over evidence, never *retrieved*.

> **Brew Helper 2.0:** `../Decision-Intelligence-Contract.md` is the controlling product contract. It refocuses this architecture on decision generation, counterfactuals, and brew replay; recipes remain evidence and optional implementation context only.

---

## 1. Where this fits (no duplication)

The reasoning *framework* already exists. This document designs the **platform** that runs it at scale — the modules, data flow, layers, and services around the loop.

| Already designed | This document adds |
|---|---|
| The 6-stage loop (Observe→…→Learn) | The **engine** that executes it and the **modules** it calls |
| Extraction heuristics (theory) | A **Coffee-Science validation layer** that enforces them |
| Knowledge Repository (evidence→principles) | The **Memory layer** it backs, + **Live Research** that feeds it |
| Reasoning scaffold (stage contracts) | The **service/API architecture** those contracts travel over |

One rule inherited from the repository governs the whole platform: **evidence in, principles out — never recipes stored to serve back.**

---

## 2. System overview

Three independent knowledge layers feed one engine. The layers never talk to the user; the engine never talks to a raw source.

```
        ┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐
        │  LAYER 1      │   │  LAYER 2          │   │  LAYER 3          │
        │  MEMORY       │   │  LIVE RESEARCH    │   │  COFFEE SCIENCE   │
        │  (durable)    │   │  (ephemeral)      │   │  (first principles)│
        │  principles,  │   │  fetch + synthesise│  │  physics/chemistry │
        │  history,     │   │  from trusted web │   │  validation model  │
        │  user models  │   │  sources          │   │                    │
        └──────┬───────┘   └────────┬─────────┘   └─────────┬────────┘
               │  retrieve           │  research (if needed)   │  validate
               └─────────────────────┼─────────────────────────┘
                                     ▼
                    ┌───────────────────────────────────┐
                    │   EXTRACTION INTELLIGENCE ENGINE    │
                    │   (orchestrator over the 6-stage    │
                    │    loop; resolves disagreement;     │
                    │    constructs one recommendation)   │
                    └──────────────────┬────────────────┘
                                       ▼
              Extraction Strategy → Recipe → Explanation(+Evidence) → Learning
                                       │
                     Learning ─────────┘  writes back to Memory (Layer 1)
```

**Layer independence:** each layer has one responsibility and no overlap. Memory is *what we know*, Live Research is *what's new*, Coffee Science is *what's true*. Disagreements between them are resolved **only** in the engine.

---

## 3. The three knowledge layers

### Layer 1 — Memory *(durable, slow-changing)*
- **Responsibility:** stable long-term knowledge. The platform's permanent understanding.
- **Holds:** the **principle library** (`Knowledge-Repository/store/principles/active/`), extraction heuristics, processing/variety/equipment/water reference data, the **reasoning framework** itself, and **personal history** (successful brews + the three user models).
- **Backed by:** the Knowledge Repository (principles + provenance) and a per-user history store.
- **Does NOT:** fetch anything live, or validate physics — it *stores* validated knowledge.
- **Change cadence:** slow. Writes come only through the ingestion pipeline (from Live Research or brew-logs) and the Learning Engine.

### Layer 2 — Live Research *(ephemeral, on-demand)*
- **Responsibility:** gather the latest external information when it would *materially* improve a recommendation.
- **Sources:** roaster brew guides, WBrC routines, competition presentations, research articles, pro interviews, manufacturer guides, high-quality community — **only from a trusted-source registry** (allowlist; Joseph curates the list later — the platform ships the mechanism, not the list).
- **Behaviour:** fetch → extract → **synthesise multiple viewpoints**, weighing conflicts; never copy a single source.
- **Does NOT:** answer the user directly, or persist as-is. Findings are **cached short-term** and, if durable, **routed through the ingestion pipeline to become Memory** — this is the bridge that makes the platform compound.
- **Change cadence:** real-time, but gated (see §7 Adaptive Research).

### Layer 3 — Coffee Science *(first principles, validation)*
- **Responsibility:** the physical/chemical model every recommendation must obey. **Validation, not reference.**
- **Holds:** extraction yield, solubility, diffusion, heat transfer, particle-size distribution, agitation, flow rate, percolation, channelling, water chemistry, temperature dynamics — formalised as **constraints and directional models** (seeded by `Interpretation-Heuristics.md §0`).
- **Role:** acts as a **gate** on candidate strategies/recipes — it can *veto or flag* anything inconsistent with physics (e.g. "this grind+time will over-extract a dark roast"), independent of what Memory or Research suggest.
- **Does NOT:** originate recommendations. It bounds them.

The distinction that keeps the layers clean: **Memory is precedent, Research is novelty, Science is law.** When they disagree, Science constrains, and the engine adjudicates the rest by evidence weight.

---

## 4. The Extraction Intelligence Engine

The engine is the **only** component that produces recommendations. It orchestrates the 6-stage loop (`Extraction-Intelligence-Layer.md`), calling modules and layers as needed, and emits one unified, validated, evidence-backed result.

**Engine responsibilities:**
1. Run the loop in order (never recipe-first).
2. Query the three layers and **resolve disagreement** into a single line.
3. Enforce the Science gate before any recipe is emitted.
4. Attach **evidence** (not internal reasoning) to the output.
5. Emit structured artifacts the dashboard renders (per `Reasoning-Scaffold.md` §4 bindings).

**The engine is stateless per request**; all durable state lives in Memory. This is what makes it horizontally scalable (Blueprint §production).

---

## 5. Modules & responsibilities

Ten modules, each independent, swappable, and single-responsibility. New modules attach to the engine's bus without redesign.

| Module | Responsibility | Reads | Writes / Emits |
|---|---|---|---|
| **Orchestrator** | Runs the 6-stage loop; sequences modules; enforces ordering + Science gate | all | the final recommendation bundle |
| **Memory Manager** | Retrieve/rank durable knowledge for a given coffee; manage principle + history stores | Layer 1 | retrieval sets; persists learning |
| **Familiarity Router** | Score how well Memory already covers this coffee; decide if research is needed | Layer 1 | research decision (§7) |
| **Live Research Manager** | Fetch + normalise from trusted sources; short-term cache; hand to synthesiser | Layer 2 | `ResearchResult[]`; feeds ingestion |
| **Scientific Validation Engine** | Check candidate strategy/recipe against physics; veto/flag violations | Layer 3 | validation verdict + flags |
| **Evidence Synthesiser** | Merge Memory + Research + Science into weighted consensus; build the user-facing Evidence object | all | `Evidence`, consensus map, conflicts |
| **Extraction Strategy Generator** | Stage 3 — construct the strategy (primary/secondary/trade-offs) from synthesis + user intent | synthesis | `Strategy` |
| **Recipe Generator** | Stage 4 — derive parameters that serve the strategy, for the user's gear | strategy + equipment model | `Recipe` (validated) |
| **Diagnosis Engine** | Stage 6a — compare expected vs observed; produce adjustments | brew feedback + strategy | `Diagnosis` |
| **Learning Engine** | Stage 6b — update the right store (universal / user / equipment); route durable findings to ingestion | outcomes | writes to Memory |

Cross-cutting services (Blueprint): Cache, Provenance/Versioning, Observability, Guardrails, Source Registry.

---

## 6. Reasoning pipeline (data flow)

End-to-end, one recommendation:

```
1  INTAKE          user coffee + intent (radar)        → Observation
2  RETRIEVE        Memory Manager pulls principles/history for this coffee-fingerprint
3  ROUTE           Familiarity Router scores coverage
                     ├─ sufficient → skip research
                     └─ insufficient/stale → Live Research Manager fetches trusted sources
4  SYNTHESISE      Evidence Synthesiser weighs Memory + Research (+ Science constraints)
                     → consensus, conflicts (weighted, not ignored)
5  INTERPRET       engine forms extraction understanding (Stage 2)   [Science-checked]
6  DECIDE          Strategy Generator builds the strategy (Stage 3)   ← the product
7  VALIDATE        Scientific Validation Engine gates the strategy
8  RECOMMEND       Recipe Generator derives params (Stage 4) for user gear
9  VALIDATE        Science gate on the recipe (veto/flag)
10 EXPLAIN         judgement (lead) + Evidence object (supporting context)  [no raw reasoning exposed]
11 RENDER          artifacts → dashboard surfaces (Radar/Recipe/AI-read)
--- brew happens ---
12 DIAGNOSE        Diagnosis Engine: expected vs observed vs feedback (Stage 6a)
13 LEARN           Learning Engine updates Memory; durable web findings → ingestion pipeline (Stage 6b)
```

Every arrow carries a typed contract (Blueprint §data contracts). The Science gate appears twice (7, 9) because both the *strategy* and its *recipe* must stay lawful.

---

## 7. Adaptive research workflow

Live research is **gated on value**, not run by default — optimise for speed *and* quality.

**Familiarity score** (0–1) for a coffee = coverage × freshness × confidence, computed by the Familiarity Router over Memory:
- **coverage** — do active principles + history address this coffee's fingerprint (origin/process/roast/variety/method)?
- **freshness** — how recently was that knowledge reviewed? (decay for fast-moving areas)
- **confidence** — the aggregate confidence of the principles that would be used.

**Decision policy:**
```
if familiarity ≥ HIGH        → use local intelligence only (no fetch)
elif familiarity in MID band → fetch only the missing dimension (targeted, cheap)
else (LOW / novel coffee)    → full research pass over trusted sources
always: if a binary/high-stakes gap exists (e.g. unknown process) → fetch regardless
```

**Cost controls:** per-request research budget (max sources/time), **coffee-fingerprint cache** (identical/near-identical coffees reuse recent synthesis), and **background prefetch** for coffees trending in the user base. Research results always pass through the Evidence Synthesiser; durable ones are **promoted into Memory via the ingestion pipeline** so the same fetch is never needed twice — familiarity rises over time and research frequency falls. The platform gets faster *and* smarter with use.

---

## 8. Evidence synthesis framework

Turns many voices into one recommendation — and one **user-facing Evidence panel**.

**Synthesis steps (Evidence Synthesiser):**
1. **Normalise** every input to a claim: {statement, source, tier, type: science|competition|roaster|community|history}.
2. **Cluster** claims by the decision they bear on (grind, temp, agitation, …).
3. **Weight** each claim: credibility tier (repository A/B/C) × reproducibility × recency × independence.
4. **Separate science from anecdote** — Coffee-Science claims are *constraints* (can veto); anecdotal/competition claims are *evidence* (weighted). They are never averaged together.
5. **Find consensus**; **surface conflict** explicitly (weighted, never silently dropped). Conflicts become *conditional* guidance (`applies_when`), mirroring the ingestion pipeline's rule.
6. **Emit** two things:
   - internal: a weighted decision input for the Strategy Generator;
   - external: the **Evidence object** for the user.

**Transparency contract (critical):** expose **evidence, not reasoning**. The user sees *what informed* the call, as supporting context — never the chain-of-thought.

```
Evidence considered
• Similar high-altitude washed coffees (your history + 2 roaster guides)
• Two competition routines using staged immersion
• Coffee science on extraction energy for dense light roasts
• Your last 3 brews on this grinder
```

Presented as context, not citations; confidence-calibrated; it raises trust without leaking internals.

---

## 9. Learning pipeline

Every brew improves the platform — and updates the **right** store, because conflating them is how personalisation rots.

```
expected ─▶ observed ─▶ user tasting feedback ─▶ diagnosis ─▶ updated understanding
```

**Three durable stores, three scopes (never mixed):**

| Store | Scope | Example update | Lives in |
|---|---|---|---|
| **Universal principles** | true for everyone | "staged immersion decouples clarity & sweetness" | Knowledge Repository (needs convergent evidence → ingestion) |
| **User preference model** | this user's taste | "says balanced, rates brighter cups higher" | per-user Memory |
| **Equipment calibration** | this user's gear | "their Encore runs 1 step coarse" | per-user Memory |

**Rules:**
- A single brew updates **user/equipment** stores immediately (fast, local, low-stakes).
- It **cannot** mint a universal principle alone — universal claims require convergent evidence and go through ingestion + review (the human gate), exactly as web sources do.
- The Diagnosis Engine names the mechanism (theory-linked); the Learning Engine decides *which store* and *how much* to move.
- Learning is **silent but transparent**: it adjusts quietly, and surfaces when a recommendation visibly changes because of it.

This is the loop's Stage 6, formalised as a routing problem: *is this fact about the world, about you, or about your gear?*

---

## 10. Scalability & extensibility

The core stays fixed as capability grows — new features are **plugins on the bus**, not surgery.

- **New brew methods** (espresso, immersion, cold brew) → **Method plugins**: each supplies its own parameter set, Science constraints, and recipe-generation rules; the engine, layers, and evidence framework are method-agnostic. The radar axes and loop don't change.
- **New science** → append to the Coffee-Science model; validation picks it up without engine changes.
- **Community intelligence** → a new Memory-adjacent source type feeding ingestion; same credibility weighting.
- **i18n** → the engine reasons in structured artifacts; language is a presentation concern at render + a source-language adapter in Research.
- **Future ML models** → any module can be swapped for a learned model behind its interface (e.g. an ML Familiarity scorer or extraction predictor) without touching the others — the contracts are the seam.

**Design invariant:** modules communicate only through typed contracts via the Orchestrator. As long as a new capability honours the contract, the platform absorbs it without redesign.

---

## 11. Cross-cutting concerns

- **Caching** — coffee-fingerprint cache (synthesis + research), principle retrieval cache; TTLs tuned per volatility.
- **Provenance & versioning** — every principle/recipe/evidence item carries source lineage and version (already in the repository schema); recommendations log which principle versions produced them (reproducibility).
- **Guardrails** — the Science gate (physics veto), source allowlist (no untrusted web), confidence calibration (never false precision), and the loop's "no recipe before strategy / no unexplained number" rules.
- **Observability** — trace each recommendation: layers hit, research fired?, principles used, science flags, latency, cost. Enables evals and debugging (Blueprint).
- **Privacy** — user history/models are per-user and private; never pooled into universal principles without de-identified, reviewed convergence.

---

## 12. Success = the platform compounds

The architecture is working when: recommendations are constructed not retrieved; research fires only when it adds value; evidence is visible and reasoning is not; every brew sharpens the right store; and familiarity rises so the system gets **faster and smarter together**. The engine stays small; the intelligence grows around it.

*Reasoning is the product. The three layers feed it, science bounds it, evidence explains it, and every brew teaches it.*
