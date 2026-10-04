# Brew Helper — Architecture

> Merged on 2026-10-05 from five overlapping architecture specs. Content is preserved verbatim; each original document is one Part below, with headings demoted one level and cross-references pointed at the merged files.

**Contents**

1. [Platform Architecture](#part-1--platform-architecture) (was `Platform-Architecture.md`)
2. [Engineering Blueprint](#part-2--engineering-blueprint) (was `Engineering-Blueprint.md`)
3. [Repository Structure](#part-3--repository-structure) (was `Repository-Structure.md`)
4. [Implementation Roadmap](#part-4--implementation-roadmap) (was `Implementation-Roadmap.md`)
5. [Evidence Recommendation Enhancements](#part-5--evidence-recommendation-enhancements) (was `Evidence-Recommendation-Enhancements.md`)


---

# Part 1 — Platform Architecture

## Brew Helper — Intelligence Platform Architecture

**Type:** Technical design document — the extraction-intelligence platform
**Companion:** Part 2 (Engineering Blueprint) (folder layout, data contracts, APIs, production)
**Builds on (does not duplicate):**
`../Extraction-Intelligence-Layer.md` (the 6-stage reasoning loop) · `../Extraction-Intelligence-Layer.md (Part 2, Reasoning Scaffold)` (stage I/O contracts) · `../Interpretation-Heuristics.md` (extraction theory) · `../Knowledge-Repository/` (evidence→principle pipeline)

> **Product thesis:** this is not a recipe database — it is an **extraction-intelligence platform**. Recipes are outputs; **reasoning is the product**. Every recommendation is *constructed* through structured reasoning over evidence, never *retrieved*.

> **Brew Helper 2.0:** `../../Dashboard/Product-Contracts.md §5 (Decision Intelligence)` is the controlling product contract. It refocuses this architecture on decision generation, counterfactuals, and brew replay; recipes remain evidence and optional implementation context only.

---

### 1. Where this fits (no duplication)

The reasoning *framework* already exists. This document designs the **platform** that runs it at scale — the modules, data flow, layers, and services around the loop.

| Already designed | This document adds |
|---|---|
| The 6-stage loop (Observe→…→Learn) | The **engine** that executes it and the **modules** it calls |
| Extraction heuristics (theory) | A **Coffee-Science validation layer** that enforces them |
| Knowledge Repository (evidence→principles) | The **Memory layer** it backs, + **Live Research** that feeds it |
| Reasoning scaffold (stage contracts) | The **service/API architecture** those contracts travel over |

One rule inherited from the repository governs the whole platform: **evidence in, principles out — never recipes stored to serve back.**

---

### 2. System overview

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

### 3. The three knowledge layers

#### Layer 1 — Memory *(durable, slow-changing)*
- **Responsibility:** stable long-term knowledge. The platform's permanent understanding.
- **Holds:** the **principle library** (`Knowledge-Repository/store/principles/active/`), extraction heuristics, processing/variety/equipment/water reference data, the **reasoning framework** itself, and **personal history** (successful brews + the three user models).
- **Backed by:** the Knowledge Repository (principles + provenance) and a per-user history store.
- **Does NOT:** fetch anything live, or validate physics — it *stores* validated knowledge.
- **Change cadence:** slow. Writes come only through the ingestion pipeline (from Live Research or brew-logs) and the Learning Engine.

#### Layer 2 — Live Research *(ephemeral, on-demand)*
- **Responsibility:** gather the latest external information when it would *materially* improve a recommendation.
- **Sources:** roaster brew guides, WBrC routines, competition presentations, research articles, pro interviews, manufacturer guides, high-quality community — **only from a trusted-source registry** (allowlist; Joseph curates the list later — the platform ships the mechanism, not the list).
- **Behaviour:** fetch → extract → **synthesise multiple viewpoints**, weighing conflicts; never copy a single source.
- **Does NOT:** answer the user directly, or persist as-is. Findings are **cached short-term** and, if durable, **routed through the ingestion pipeline to become Memory** — this is the bridge that makes the platform compound.
- **Change cadence:** real-time, but gated (see §7 Adaptive Research).

#### Layer 3 — Coffee Science *(first principles, validation)*
- **Responsibility:** the physical/chemical model every recommendation must obey. **Validation, not reference.**
- **Holds:** extraction yield, solubility, diffusion, heat transfer, particle-size distribution, agitation, flow rate, percolation, channelling, water chemistry, temperature dynamics — formalised as **constraints and directional models** (seeded by `Interpretation-Heuristics.md §0`).
- **Role:** acts as a **gate** on candidate strategies/recipes — it can *veto or flag* anything inconsistent with physics (e.g. "this grind+time will over-extract a dark roast"), independent of what Memory or Research suggest.
- **Does NOT:** originate recommendations. It bounds them.

The distinction that keeps the layers clean: **Memory is precedent, Research is novelty, Science is law.** When they disagree, Science constrains, and the engine adjudicates the rest by evidence weight.

---

### 4. The Extraction Intelligence Engine

The engine is the **only** component that produces recommendations. It orchestrates the 6-stage loop (`Extraction-Intelligence-Layer.md`), calling modules and layers as needed, and emits one unified, validated, evidence-backed result.

**Engine responsibilities:**
1. Run the loop in order (never recipe-first).
2. Query the three layers and **resolve disagreement** into a single line.
3. Enforce the Science gate before any recipe is emitted.
4. Attach **evidence** (not internal reasoning) to the output.
5. Emit structured artifacts the dashboard renders (per Extraction-Intelligence-Layer.md (Part 2, Reasoning Scaffold) §4 bindings).

**The engine is stateless per request**; all durable state lives in Memory. This is what makes it horizontally scalable (Blueprint §production).

---

### 5. Modules & responsibilities

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

### 6. Reasoning pipeline (data flow)

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

### 7. Adaptive research workflow

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

### 8. Evidence synthesis framework

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

### 9. Learning pipeline

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

### 10. Scalability & extensibility

The core stays fixed as capability grows — new features are **plugins on the bus**, not surgery.

- **New brew methods** (espresso, immersion, cold brew) → **Method plugins**: each supplies its own parameter set, Science constraints, and recipe-generation rules; the engine, layers, and evidence framework are method-agnostic. The radar axes and loop don't change.
- **New science** → append to the Coffee-Science model; validation picks it up without engine changes.
- **Community intelligence** → a new Memory-adjacent source type feeding ingestion; same credibility weighting.
- **i18n** → the engine reasons in structured artifacts; language is a presentation concern at render + a source-language adapter in Research.
- **Future ML models** → any module can be swapped for a learned model behind its interface (e.g. an ML Familiarity scorer or extraction predictor) without touching the others — the contracts are the seam.

**Design invariant:** modules communicate only through typed contracts via the Orchestrator. As long as a new capability honours the contract, the platform absorbs it without redesign.

---

### 11. Cross-cutting concerns

- **Caching** — coffee-fingerprint cache (synthesis + research), principle retrieval cache; TTLs tuned per volatility.
- **Provenance & versioning** — every principle/recipe/evidence item carries source lineage and version (already in the repository schema); recommendations log which principle versions produced them (reproducibility).
- **Guardrails** — the Science gate (physics veto), source allowlist (no untrusted web), confidence calibration (never false precision), and the loop's "no recipe before strategy / no unexplained number" rules.
- **Observability** — trace each recommendation: layers hit, research fired?, principles used, science flags, latency, cost. Enables evals and debugging (Blueprint).
- **Privacy** — user history/models are per-user and private; never pooled into universal principles without de-identified, reviewed convergence.

---

### 12. Success = the platform compounds

The architecture is working when: recommendations are constructed not retrieved; research fires only when it adds value; evidence is visible and reasoning is not; every brew sharpens the right store; and familiarity rises so the system gets **faster and smarter together**. The engine stays small; the intelligence grows around it.

*Reasoning is the product. The three layers feed it, science bounds it, evidence explains it, and every brew teaches it.*


---

# Part 2 — Engineering Blueprint

## Brew Helper — Engineering Blueprint

**Type:** Buildable spec — folders, contracts, APIs, production
**Companion:** Part 1 (Platform Architecture) (the why + module responsibilities)
**Audience:** whoever implements the platform (incl. future-Claude).

> Concrete counterpart to the architecture. Interfaces are illustrative TypeScript; the shapes are the contract, the language is not.

---

### 1. Folder & file architecture

A monorepo. The **knowledge lives as data** (the existing repository), the **engine as code**, and the **web app** consumes the engine over an API. Modules are packages so they stay independent and swappable (`Part 1 (Platform Architecture) §5`).

```
brew-helper/
├── apps/
│   └── web/                       # the dashboard (already designed) — Next.js
│       ├── app/                   # routes, RSC
│       ├── components/            # from the Design System / Component-Inventory
│       └── lib/api-client.ts      # typed client → engine API
│
├── packages/
│   ├── engine/                    # Extraction Intelligence Engine (orchestrator + loop)
│   │   ├── orchestrator.ts        # runs the 6 stages, enforces ordering + science gate
│   │   ├── stages/                # observe · interpret · decide · recommend · teach · learn
│   │   └── contracts.ts           # shared types (§2) — the seams between modules
│   ├── memory/                    # Layer 1 — Memory Manager
│   │   ├── principles.ts          # read active principles + retrieval/ranking
│   │   ├── history.ts             # brew history
│   │   └── user-models.ts         # preference + equipment calibration
│   ├── research/                  # Layer 2 — Live Research Manager
│   │   ├── router.ts              # Familiarity Router (decide if research needed)
│   │   ├── manager.ts             # fetch orchestration + budget/cache
│   │   ├── adapters/              # one per source type (roaster, wbrc, research, video…)
│   │   └── source-registry.ts     # trusted allowlist (Joseph curates the list later)
│   ├── science/                   # Layer 3 — Scientific Validation Engine
│   │   ├── model.ts               # extraction-curve constraints (from Interpretation-Heuristics §0)
│   │   └── validate.ts            # veto/flag a strategy or recipe
│   ├── evidence/                  # Evidence Synthesiser
│   │   ├── synthesise.ts          # cluster · weight · consensus/conflict
│   │   └── evidence-object.ts     # user-facing Evidence (context, not citations)
│   ├── ingestion/                 # the Knowledge-Repository pipeline, as code
│   │   ├── pipeline.ts            # G0–G5 (capture→screen→normalize→extract→distil→review)
│   │   └── scoring.ts             # credibility tiers + confidence model
│   └── shared/                    # ids, logging, config, errors
│
├── data/
│   └── knowledge-repository/      # ← the existing Coffee/Intelligence/Knowledge-Repository
│       ├── store/{raw,structured,principles}/   # source of truth (git-versioned markdown/yaml)
│       └── index/                 # generated: embeddings + lookup for retrieval
│
├── services/
│   ├── api/                       # HTTP surface (§3) — thin, calls engine
│   └── jobs/                      # background: distillation, prefetch, index rebuild
│
└── docs/                          # points back to Coffee/Intelligence/* as canonical
```

**Principle:** `data/knowledge-repository` is the same plain-text store you already feed with `Ingest:`. Code reads it; the ingestion package writes it. Nothing about the reasoning docs changes — they become the spec these packages implement.

---

### 2. Data contracts

The typed seams between modules (mirror Extraction-Intelligence-Layer.md (Part 2, Reasoning Scaffold) §3). If a module honours these, it can be replaced freely.

```ts
// ---- domain ----
interface Observation {
  coffee: { origin?: string; producer?: string; variety?: string; process?: string;
            altitude?: string; roastLevel?: string; roastAgeDays?: number; tastingNotes?: string[] };
  setup:  { grinder?: string; brewer?: string; filter?: string; waterProfile?: string; batchSizeG?: number };
  intent: RadarPriorities;                 // {sweetness,clarity,body,acidity,floral,juiciness} 0..1
  unknowns: string[];                       // explicitly listed, never guessed
  fingerprint: string;                      // hash of coffee dims → cache/familiarity key
}

interface Claim { statement: string; source: SourceRef; tier: 'A'|'B'|'C';
                  type: 'science'|'competition'|'roaster'|'community'|'history'; weight: number }

interface Strategy { id: string; primary: string; secondary: string; tradeoffs: string[];
                     extractionTarget: { position: string; approach: string };
                     constraintsFromIntent: string[]; rationale: string }

interface RecipeParam { name: string; value: string; because: string; serves: string; lever: Lever }
interface Recipe { strategyRef: string; params: RecipeParam[]; predictedCup: RadarPriorities;
                   scienceFlags: ScienceFlag[] }

interface Evidence { items: { label: string; kind: Claim['type']; strength: 'strong'|'moderate' }[];
                     note?: string }          // user-facing: context, NOT chain-of-thought

interface Recommendation { judgement: string; strategy: Strategy; recipe: Recipe;
                           evidence: Evidence; confidence: number }

interface BrewOutcome { recipeRef: string; observed: RadarPriorities; notes: string[] }
interface Diagnosis { cause: string; because: string;
                      adjustments: { lever: Lever; move: string; loopsTo: string }[] }

// ---- module interfaces ----
interface MemoryManager   { retrieve(o: Observation): Promise<{ principles: Principle[]; history: Brew[]; familiarity: number }>;
                            learn(u: LearningUpdate): Promise<void> }
interface ResearchManager { maybeResearch(o: Observation, familiarity: number): Promise<ResearchResult[]> }
interface ScienceEngine   { validateStrategy(s: Strategy, o: Observation): Verdict;
                            validateRecipe(r: Recipe, o: Observation): Verdict }
interface EvidenceSynth   { synthesise(inputs: Claim[]): { decisionInput: WeightedClaims; evidence: Evidence; conflicts: Conflict[] } }
interface StrategyGen     { generate(x: { synthesis: WeightedClaims; intent: RadarPriorities }): Strategy }
interface RecipeGen       { generate(s: Strategy, gear: EquipmentModel): Recipe }
interface DiagnosisEngine { diagnose(expected: RadarPriorities, outcome: BrewOutcome, s: Strategy): Diagnosis }
interface LearningEngine  { apply(d: Diagnosis, outcome: BrewOutcome): LearningUpdate }  // routes to correct store
```

---

### 3. API architecture

#### 3a. Engine API (internal HTTP; the web app calls only this)
Thin transport over the engine — no reasoning in the API layer.

| Endpoint | Body → Returns | Notes |
|---|---|---|
| `POST /v1/recommend` | `Observation` → `Recommendation` | runs stages 1–10; fires research only if the router says so |
| `POST /v1/diagnose` | `BrewOutcome` → `Diagnosis` | stage 6a; adjustments loop back to strategy |
| `POST /v1/feedback` | `{outcome, diagnosis}` → `{applied: LearningUpdate}` | stage 6b; updates Memory |
| `GET  /v1/evidence/:recommendationId` | → `Evidence` | for the dashboard evidence panel |
| `POST /v1/research` *(internal/admin)* | `{query, dims}` → `ResearchResult[]` | manual trigger; normally engine-driven |
| `POST /v1/ingest` *(admin)* | `{url \| text}` → ingest report | wraps the `Ingest:` pipeline |

Response envelope: `{ data, meta: { latencyMs, researchFired, principlesUsed: [{id,version}], scienceFlags, confidence } }` — powers observability + reproducibility.

#### 3b. Live-Research adapter API (the pluggable seam)
Each source type is an adapter behind one interface, gated by the trusted-source registry.

```ts
interface SourceAdapter {
  type: 'roaster'|'wbrc'|'research'|'interview'|'manufacturer'|'community'|'video';
  canHandle(url: string): boolean;                       // registry-allowlisted only
  fetch(query: ResearchQuery): Promise<RawDoc[]>;         // respect robots.txt / ToS / rate limits
  extract(doc: RawDoc): Claim[];                          // → normalised claims for the synthesiser
}

interface SourceRegistry {                                // Joseph curates the allowlist later
  isTrusted(domain: string): boolean;
  tierOf(domain: string): 'A'|'B'|'C';
  list(): TrustedSource[];
}
```

Research flow: `router.maybeResearch()` → registry-filtered adapters `fetch` → `extract` → Evidence Synthesiser → (durable?) → `ingestion.pipeline` → Memory. **Search-provider abstraction** (`SearchProvider.search(query)`) sits behind adapters so the web-search backend is swappable. **Compliance built in:** allowlist only, robots/ToS respect, rate limiting, and per-request budget.

#### 3c. Contracts as the only coupling
Web ⟷ API ⟷ Engine ⟷ Modules ⟷ Layers all communicate through the §2 types. Swap any implementation (rules→ML, one search provider→another) without touching neighbours.

---

### 4. Production implementation recommendations

Prioritise **maintainability, explainability, evidence-backed reasoning** over cleverness.

**Stack (recommended, pragmatic):**
- **Web:** Next.js (React) — reuses the existing component system; server components for fast first paint.
- **API/Engine:** TypeScript on serverless/edge functions (stateless engine = trivial horizontal scale). Cloudflare Workers is a strong fit (you already have that connector): **D1** for user history/models, **R2** for raw captures, **Vectorize** for principle embeddings, **KV** for the fingerprint cache.
- **Retrieval:** embed `active` principles → vector store; retrieve by coffee-fingerprint + semantic match. Keep the markdown store as source of truth; the index is regenerable.
- **LLM orchestration:** the engine calls an LLM for the *linguistic* stages (judgement, teaching, synthesis narration) under the Extraction-Intelligence-Layer.md (Part 2, Reasoning Scaffold) charter. Keep prompts **versioned in-repo**; pin model + prompt version in the response `meta` for reproducibility.
- **Caching:** fingerprint cache (identical coffees reuse synthesis); research cache with volatility TTL; retrieval cache. Target: no live fetch on familiar coffees.
- **Background jobs:** nightly **distillation** (`Distil`), **prefetch** for trending coffees, **index rebuild**, **eval runs**.
- **Observability:** structured traces per recommendation (layers hit, research fired, principle versions, science flags, latency, token cost). Dashboards + alerts on latency/cost/flag-rate.
- **Evals:** a golden set of {coffee, intent → expected strategy shape}; assert the engine (a) never emits recipe-before-strategy, (b) always attaches evidence, (c) passes the science gate, (d) stays in voice. Run in CI on prompt/model/principle changes.
- **Guardrails:** science-gate veto, source allowlist, confidence calibration, "no unexplained number," PII isolation for user models.
- **Security/privacy:** per-user isolation for history/models; secrets for search/LLM providers; least-privilege adapters; audit log for ingestion.
- **Cost/latency control:** research budget per request; prefer local intelligence (the router); small models for extraction/scoring, larger only for final synthesis; stream the judgement first (fast perceived response), hydrate evidence after.

**Build phasing:**
1. **MVP** — Memory (read the existing repo) + Engine (loop) + Science gate + Evidence panel. No live research yet; familiarity always "use local." Ships real, explainable recommendations from your growing principle library.
2. **v1** — add Live Research Manager + Familiarity Router + one or two source adapters + the trusted-source registry (with Joseph's list) + ingestion-on-research. Adaptive research goes live.
3. **v2** — Learning Engine writing user/equipment models from real brews; background distillation/prefetch; evals in CI.
4. **v3+** — method plugins (espresso, immersion, cold brew), i18n, community intelligence, ML swap-ins behind existing interfaces.

Each phase ships value and leaves the core untouched — the invariant from `Part 1 (Platform Architecture) §10`.

---

### 5. How this stays in sync with the rest

- `data/knowledge-repository/` **is** `Coffee/Intelligence/Knowledge-Repository/` — the `Ingest:`/`Promote:` workflow already feeds Memory.
- The engine's stages implement `Extraction-Intelligence-Layer.md`; the Science model implements `Interpretation-Heuristics.md §0`; the contracts implement Extraction-Intelligence-Layer.md (Part 2, Reasoning Scaffold).
- When a principle is promoted/deprecated, the vector index rebuilds (a job) — no code change.
- This blueprint is documentation-first: build against it, and update it if the build teaches you something (same standing rule as the IA sync).

*The engine stays small and fixed. Knowledge, evidence, and learning grow around it.*


---

# Part 3 — Repository Structure

## Brew Helper — Repository Structure

**Type:** The definitive "where everything lives" — folders, services, APIs, prompts, data models
**Reads with:** Part 1 (Platform Architecture) · Part 2 (Engineering Blueprint) · `System-Architecture-Diagram.svg`
**Principle:** knowledge is **data** (the existing repository), reasoning is **code** (packages), the app **consumes an API**. Each module is a package so it stays independent and swappable.

> This is a scaffold a builder can create on day one. Every path has a single responsibility; nothing reaches across a package except through typed contracts.

---

### 1. Top level

```
brew-helper/
├── apps/web/                 # the dashboard (already designed)
├── packages/                 # the engine + modules (one package each)
├── prompts/                  # versioned LLM prompts (the "reasoning text")
├── data/knowledge-repository/# the principle library (source of truth, already exists)
├── services/                 # deployable surfaces: api, jobs
├── config/                   # env, source registry, model + tuning config
├── tests/                    # unit, contract, and eval suites
├── package.json              # workspace root (pnpm/turbo monorepo)
└── README.md
```

---

### 2. `apps/web/` — the dashboard

```
apps/web/
├── app/                      # routes (Next.js app router)
│   ├── brew/page.tsx         # the 6-section workflow
│   └── api-client.ts         # typed fetch → services/api (only coupling to the engine)
├── components/               # from Design System / Component-Inventory
│   ├── BeanCard.tsx  RadarCard.tsx  RecipeCard.tsx  ReflectionCard.tsx
│   ├── EvidencePanel.tsx     # renders the Evidence object (context, not citations)
│   └── primitives/           # Button, Chip, Tag, Field, SectionHeader
├── lib/                      # tokens (Colors/Typography/Layout mirror), formatters
└── styles/
```
The web app never imports `packages/*` directly — only `services/api` over HTTP. Keeps the engine replaceable and the app deployable alone.

---

### 3. `packages/` — engine + modules

```
packages/
├── engine/
│   ├── orchestrator.ts       # runs the 6 stages in order; enforces science gate + "no recipe before strategy"
│   ├── stages/{observe,interpret,decide,recommend,explain,learn}.ts
│   └── index.ts
├── contracts/                # ⭐ the seams — shared types every package depends on
│   └── index.ts              # Observation, Strategy, Recipe, Evidence, BrewOutcome, Diagnosis, Principle …
├── memory/                   # Layer 1
│   ├── memory-manager.ts     # retrieve + rank for a coffee fingerprint
│   ├── principles.ts         # read data/knowledge-repository/store/principles/active
│   ├── history.ts            # brew history
│   ├── user-models.ts        # preference + equipment calibration
│   └── index.ts
├── research/                 # Layer 2
│   ├── familiarity-router.ts # score coverage×freshness×confidence → research decision
│   ├── research-manager.ts   # budget, cache, orchestrate adapters
│   ├── adapters/{roaster,wbrc,research,interview,manufacturer,community,video}.ts
│   ├── search-provider.ts    # swappable web-search backend
│   └── index.ts
├── science/                  # Layer 3
│   ├── model.ts              # extraction-curve constraints (from Interpretation-Heuristics §0)
│   ├── validate.ts           # validateStrategy / validateRecipe → Verdict (veto/flag)
│   └── index.ts
├── evidence/
│   ├── synthesise.ts         # cluster · weight · consensus/conflict
│   ├── evidence-object.ts    # build user-facing Evidence (transparency contract)
│   └── index.ts
├── ingestion/                # the Knowledge-Repository pipeline, as code
│   ├── pipeline.ts           # G0–G5
│   ├── scoring.ts            # credibility tiers + confidence model
│   └── index.ts
├── strategy/strategy-generator.ts   # Stage 3
├── recipe/recipe-generator.ts       # Stage 4 (+ method plugins, below)
├── diagnosis/diagnosis-engine.ts    # Stage 6a
├── learning/learning-engine.ts      # Stage 6b — routes to correct store
├── methods/                  # brew-method PLUGINS (scalability seam)
│   ├── method.ts             # interface: params, science constraints, recipe rules
│   ├── pourover.ts  immersion.ts  switch-hybrid.ts   # espresso, cold-brew later
└── shared/                   # ids, logger, config, errors, llm-client
```

**Dependency rule:** everything depends on `contracts/`; nothing else is imported across packages except via those types. `engine` composes the modules; modules never import each other.

---

### 4. `prompts/` — the reasoning text (versioned)

LLM prompts are **code artifacts**: versioned, reviewed, pinned per response for reproducibility.

```
prompts/
├── stages/
│   ├── interpret.v1.md       # observation → extraction understanding
│   ├── decide.v1.md          # synthesis + intent → strategy (the product)
│   ├── recommend.v1.md       # strategy → params, each with `because`
│   ├── explain.v1.md         # judgement + evidence framing (voice: UI_Personality)
│   └── diagnose.v1.md        # outcome → diagnosis + adjustments
├── synthesis/
│   ├── extract-claims.v1.md  # source doc → normalised claims
│   └── weigh-conflicts.v1.md # consensus / conditional-principle resolution
├── system/
│   └── charter.v1.md         # standing rules (Extraction-Intelligence-Layer.md (Part 2, Reasoning Scaffold) §1): strategy-first, no unexplained number, cite mechanisms
└── registry.json             # active prompt versions + model pins
```
Each prompt encodes a stage from `Extraction-Intelligence-Layer.md`. Changing a prompt bumps its version; the engine records which version produced each recommendation.

---

### 5. `data/knowledge-repository/` — the principle library

This **is** the existing store (`Coffee/Intelligence/Knowledge-Repository/`) — the code reads it, the ingestion package writes it.

```
data/knowledge-repository/
├── store/
│   ├── raw/                  # immutable captures (audit trail)
│   ├── structured/{sources,recipes}/   # SRC-#### · RCP-####
│   └── principles/{candidates,active,deprecated}/  # PRN-####
├── templates/                # source · recipe · principle
└── index/                    # GENERATED: embeddings + lookup for retrieval (regenerable)
```
Markdown/YAML is the source of truth; `index/` is a derived vector/lookup cache rebuilt by a job on promote/deprecate.

---

### 6. `services/` — deployable surfaces

```
services/
├── api/                      # thin HTTP over the engine (no reasoning here)
│   ├── routes/{recommend,diagnose,feedback,evidence,ingest}.ts
│   ├── middleware/           # auth, rate-limit, tracing, error envelope
│   └── server.ts
└── jobs/                     # background workers
    ├── distil.ts             # periodic candidate consolidation (`Distil`)
    ├── prefetch.ts           # research prefetch for trending coffees
    ├── reindex.ts            # rebuild data/.../index on principle changes
    └── evals.ts              # run the golden-set eval suite
```

---

### 7. `config/` & `tests/`

```
config/
├── source-registry.json      # ⭐ trusted-source allowlist + tiers (Joseph curates later)
├── models.json               # model pins per stage (small for extraction, larger for synthesis)
├── budgets.json              # research budget, cache TTLs, familiarity thresholds
└── env.example

tests/
├── unit/                     # per module
├── contract/                 # assert modules honour contracts/ (the swap-safety net)
└── evals/
    ├── golden-set.jsonl      # {coffee, intent → expected strategy shape}
    └── invariants.test.ts    # never recipe-before-strategy · evidence always attached · science gate passes · in-voice
```

---

### 8. Core data models (the contract surface)

Defined once in `packages/contracts/`; everything else references them. (Full shapes: `Part 2 (Engineering Blueprint) §2`.)

| Model | Produced by | Consumed by |
|---|---|---|
| `Observation` | intake (web) | Memory, Router, engine |
| `Principle` | ingestion / Memory | Synthesiser, Strategy |
| `ResearchResult` → `Claim[]` | Research adapters | Synthesiser |
| `Evidence` | Synthesiser | web EvidencePanel |
| `Strategy` ★ | Strategy Generator | Recipe Generator, Science |
| `Recipe` | Recipe Generator | Science gate, web |
| `Recommendation` | engine | API → web |
| `BrewOutcome` | Reflection (web) | Diagnosis |
| `Diagnosis` | Diagnosis Engine | Learning |
| `LearningUpdate` | Learning Engine | Memory (routed to universal/user/equipment) |

---

### 9. Reading order for a new builder

1. `contracts/` — learn the types (the whole system is these plus functions).
2. Part 1 (Platform Architecture) + the SVG — the shape.
3. `engine/orchestrator.ts` — the spine that calls everything.
4. The stage prompts — the reasoning text.
5. `data/knowledge-repository/` — the knowledge it reasons over.

*Knowledge is data, reasoning is code, the app is a client. That separation is what keeps this maintainable as it grows.*


---

# Part 4 — Implementation Roadmap

## Brew Helper — Implementation Roadmap

**Type:** Build order — vertical slices, thinnest first
**Reads with:** Part 3 (Repository Structure) · Part 1 (Platform Architecture) · Part 2 (Engineering Blueprint)
**Principle:** every milestone ships a **working vertical slice** (something you can run and see), not a horizontal layer. The engine stays small; capability is added as plugins on the bus. The core is never rewritten.

> Rule of thumb: if a milestone doesn't end with "you can now do X end-to-end," it's scoped wrong. Build the spine before the limbs.

---

### Current status (visualised on `System-Architecture-Diagram.svg`)

| Stage | Status |
|---|---|
| **Base — design + knowledge** | ✅ **complete** — design system, IA, dashboard prototype, intelligence design, knowledge repo seeded (2 sources, 2 recipes, PRN-0001 active) |
| **M0 — Scaffold** | ✅ **complete** — `Platform/` monorepo; `contracts/index.ts` + module skeleton + config; `tsc` clean. |
| **M1 — Walking skeleton** | ✅ **complete** — engine runs end-to-end three ways: CLI (`npm run recommend`), **HTTP API** (`npm run serve` → `POST /v1/recommend`, ~11ms), and a **self-contained live browser page** (built from `Platform/services/web/live.template.html`; superseded by the single dashboard surface `brew-helper-site/index.html`, which inlines the same engine via `npm run build:public-engine`) where the radar drives strategy → recipe → evidence live. Reads the real `active/` library; PRN-0001 auto-applies only when clarity+sweetness are both high; science gate active. |
| **M2 — Science gate** | ✅ **complete** — `science/validate.ts` is a real extraction-curve model (temp/grind/agitation/ratio/time × roast/process/altitude). VETO blocks physically-wrong recipes, WARN annotates risks. Proven by `tests/science.test.mjs` (3/3). |
| **M3 — Evidence panel** | ✅ **complete** — evidence synthesiser weights claims (tier × confidence × convergence), **boosts the principles that actually drove the recommendation** (so evidence is scenario-relevant, not a global top-N), detects directional conflicts within a domain, and separates science (constraints) from anecdote (evidence). Rendered in the live page with strength + theme + a synthesis note. |
| **M4 — Reflect & learn (local)** | ✅ **complete** — Diagnosis Engine (tasted cup + notes → cause → smallest adjustment, from the defect map) + Learning Engine (routes to **user / equipment**; won't mint universal from one brew). Equipment calibration threads into the next recipe (learned "grind finer" → next grind shifts one step). Live page has a reflection panel that closes the loop. Proven by `tests/diagnosis.test.mjs` (5/5) + `tests/edge.test.mjs` (3/3, no crashes on degenerate input). |
| **M5 — Live research** | ✅ **complete** — governed research layer: **allowlist generated from the Governance registry** (`sources.yaml` → `config/source-registry.json`), a channel-specific Source-Registry gate (Hoffmann→C, Hedrick→B on the same host), a pluggable `SearchProvider` (ships with a Mock so it **never fabricates**), an adapter that extracts typed claims (tier/credibility from the registry), and the Familiarity Router gate (familiar → no fetch; unfamiliar → bounded research whose claims reach the evidence panel). Proven by `tests/research.test.mjs` (10/10). **To go live:** drop in a real web-search provider — the pipes are built. |
| **M6 — Learning → Memory** | ✅ **complete** — convergent findings persist as review-only D1 candidates; protected human review can promote or reject them, and approved records export cleanly for the existing human-controlled library reindex. |
| **M7 — Hardening** | ✅ **complete** — golden evaluations, scoped CORS, anonymous browser profiles, PII isolation, review actions, request logs, lifecycle traces, rolling seven-day metrics, release budgets, and a seven-day research cache are live. Google/CoffeeDB research remains deliberately disabled until an existing free Google Custom Search credential is supplied. |
| **M8+ — Scale** | ⬜ planned |

**Where we are:** M1–M5 are implemented. M6 and M7 are active work; D1-backed anonymous feedback is live without a Brew Helper account. Candidate promotion remains intentionally human-gated.

*(When a milestone is built, update its status here and re-colour its pill in the SVG — same standing sync rule as the IA.)*

---

### Sequencing at a glance

```
M0  Scaffold + contracts ......... the skeleton (no behaviour)
M1  Thinnest slice ............... coffee in → strategy → recipe → explanation out   ← walking skeleton
M2  Science gate ................. recommendations can't violate physics
M3  Evidence panel ............... recommendations show what informed them
M4  Reflect + learn (local) ...... brews update user & equipment models
M5  Live research + familiarity .. novel coffees trigger a research pass
M6  Learning → Memory ............ durable findings become principles (convergence)
M7  Hardening .................... caching, evals, observability, cost control
M8+ Scale ........................ method plugins (espresso/immersion/cold brew), i18n, ML swap-ins
```

Each builds only on the ones before it. You could stop after any milestone and have a coherent product.

---

### M0 — Scaffold & contracts
- **Goal:** the repository exists and types compile. No behaviour yet.
- **Build:** the monorepo tree (Part 3 (Repository Structure)); `packages/contracts/` with every data model; empty module packages exposing their interface signatures; `services/api` returning stubs; wire `apps/web` to the API client.
- **Modules:** contracts only.
- **Depends on:** nothing.
- **Done when:** `contracts` compiles; a `POST /recommend` returns a hard-coded `Recommendation`; the dashboard renders it. **The pipes connect before anything flows.**

### M1 — Thinnest working slice ⭐ (the walking skeleton)
- **Goal:** a real, explainable recommendation from local knowledge only. No research, no science gate, no learning.
- **Build:** `engine/orchestrator` running stages Observe→Interpret→Decide→Recommend→Explain; `memory` reads `data/knowledge-repository/store/principles/active` (you already have PRN-0001); `strategy` + `recipe` generators; stage prompts v1; `explain` returns judgement + a plain recipe.
- **Modules:** Orchestrator, Memory Manager (read-only), Strategy Generator, Recipe Generator.
- **Depends on:** M0.
- **Done when:** intake a coffee + radar intent → the engine emits a **strategy first**, then a recipe whose params each carry a `because`, then a judgement line — rendered in the dashboard. **This is the product in miniature.** Invariant test: never recipe-before-strategy.

### M2 — Coffee-Science validation gate
- **Goal:** no recommendation can contradict physics.
- **Build:** `science/model` (extraction-curve constraints from `Interpretation-Heuristics.md §0`) + `validate`; orchestrator calls it after Decide and after Recommend; veto → re-derive, flag → annotate.
- **Modules:** Scientific Validation Engine.
- **Depends on:** M1.
- **Done when:** a deliberately bad strategy (e.g. "boiling water + very fine + long time on a dark roast") is caught and corrected/flagged. Eval: science gate passes on the golden set.

### M3 — Evidence synthesis + panel
- **Goal:** recommendations show *what informed them* (context, not citations, not reasoning).
- **Build:** `evidence/synthesise` (cluster · weight · consensus/conflict over Memory claims) + `evidence-object`; `apps/web/EvidencePanel`.
- **Modules:** Evidence Synthesiser.
- **Depends on:** M1 (M2 optional-parallel).
- **Done when:** each recommendation renders an Evidence panel ("similar coffees · a competition routine · coffee science on extraction energy · your history") and the transparency contract holds (no chain-of-thought exposed). Eval: evidence always attached.

### M4 — Reflect & learn (local models)
- **Goal:** brewing improves *your* future recommendations.
- **Build:** `diagnosis/diagnosis-engine` (expected vs observed vs feedback → adjustments); `learning/learning-engine` writing **user preference** + **equipment calibration** models to `memory/user-models`; wire the Reflection section + `POST /diagnose`, `/feedback`.
- **Modules:** Diagnosis Engine, Learning Engine (user/equipment scope only).
- **Depends on:** M1.
- **Done when:** logging a debrief produces a diagnosis that loops back to the radar, and the next recommendation for the same gear reflects the calibration ("your grinder runs coarse, so…"). Universal principles are **not** minted here (that's M6).

### M5 — Live research + adaptive routing
- **Goal:** novel/unfamiliar coffees pull the latest external knowledge; familiar ones don't.
- **Build:** `research/familiarity-router` (coverage×freshness×confidence); `research-manager` (budget + cache); 1–2 `adapters` behind `search-provider`; `config/source-registry.json` seeded with **Joseph's curated allowlist**; feed results into the Evidence Synthesiser.
- **Modules:** Familiarity Router, Live Research Manager, Source Adapters.
- **Depends on:** M3 (synthesis must exist to merge research).
- **Done when:** a familiar coffee returns with **no fetch** (fast, local); an unfamiliar one triggers a bounded research pass whose findings appear in the Evidence panel. Requires the trusted-source list — **the one input still owed by Joseph.**

### M6 — Learning writes back to Memory (the compounding loop)
- **Goal:** durable findings (from research or repeated brews) become **principles**.
- **Build:** `ingestion/pipeline` as code (G0–G5) invoked by research + brew-logs; convergence + confidence scoring; candidates queue; `Promote` remains a human gate; `jobs/reindex` rebuilds the embedding index on promote.
- **Modules:** Ingestion Pipeline, Learning Engine (universal scope), reindex job.
- **Depends on:** M5 (research) + M4 (brew-logs).
- **Done when:** a research finding seen across ≥2 independent sources becomes a candidate principle awaiting review; promoting it raises familiarity so the same coffee needs no future fetch. **The platform now gets faster and smarter with use.**

### M7 — Hardening
- **Goal:** production-grade quality, speed, and cost.
- **Build:** fingerprint + research + retrieval caches; `tests/evals` in CI (invariants + golden set on any prompt/model/principle change); observability traces (layers hit, research fired, principle versions, science flags, latency, token cost); guardrails + PII isolation; stream the judgement first, hydrate evidence after.
- **Depends on:** M1–M6.
- **Done when:** p95 latency + cost within budget; evals gate merges; every recommendation is traceable and reproducible.

### M8+ — Scale (plugins, never rewrites)
- **Goal:** grow capability without touching the core.
- **Build, independently:** `methods/` plugins — **espresso**, **immersion**, **cold brew** (each supplies params + science constraints + recipe rules); **i18n** (render + source-language adapters); **community intelligence** as a source type; **ML swap-ins** behind existing interfaces (e.g. a learned Familiarity scorer or extraction predictor).
- **Depends on:** M1–M7 as needed; each plugin is isolated.
- **Done when:** a new brew method ships by adding a plugin — the engine, layers, evidence, and contracts are unchanged. This validates the whole architecture.

---

### What to build first, concretely

Start **M0 → M1** and stop to use it. You already have live Memory content (SRC-0001/0002, RCP-0001/0002, PRN-0001 active), so M1 produces genuine recommendations on day one — no research or ML required. Everything after M1 is additive and independently valuable.

**Critical path:** M0 → M1 → (M2 ∥ M3) → M4 → M5 → M6 → M7 → M8+.
**Blocked-on-you:** M5 needs the trusted-source allowlist; M6's promotions need your review (by design).

*Build the spine (M1), make it lawful (M2) and transparent (M3), let it learn locally (M4), then reach outward (M5) and compound (M6). The core you write in M1 is the core you keep.*


---

# Part 5 — Evidence Recommendation Enhancements

## Brew Helper — Evidence-Backed Recommendation Enhancements

**Type:** Enhancement spec (strengthen, don't replace) for the existing M1–M5 engine + governance
**Stance:** the architecture is correct. This improves *how the systems communicate and how their outputs are presented* — no new pipelines, no duplicated responsibilities.
**Touches (extends, never forks):** Evidence Synthesiser (M3), Recommendation output (M1), Trust Matrix (governance), the live UI.

> Goal: make every recommendation read like an experienced World Brewers Cup mentor — the brewer understands *why it exists, what supports it, where it's uncertain, and what it trades*. Retire the confidence percentage; it told a brewer nothing.

---

### 1. Review of the current implementation (M1–M5)

What's strong and stays:
- **Strategy-first reasoning**, science gate (M2), scenario-relevant evidence weighting (M3), diagnosis + local learning (M4), governed research (M5). The Trust Matrix already weights by tier × relevance × freshness × consensus.

Where it's weak (the targets of this pass):
- **A single `confidence: 0.58` number** is the headline uncertainty signal. It's arbitrary to an expert and hides *why*.
- **Evidence is a flat list** of top claims. It doesn't show agreement vs disagreement, what's assumed, or what's unknown.
- **The synthesis output is informal** — the engine reads a `{items, note}` object, not a named contract. There's no single artifact that *is* "the evidence for this recommendation."
- **The recommendation is a judgement line + params.** It doesn't consistently walk the brewer through intuition → strategy → evidence → trade-offs → recipe → expectation → adjustment.

None of this requires new systems — only richer *contracts and presentation* over what M3/M5 already produce.

---

### 2. Suggested improvements (summary)

1. **Retire "confidence."** Delete the term and the percentage from every output and UI surface.
2. **Evidence Profile** — a multi-dimensional quality read that replaces the number (§3).
3. **Evidence Bundle** — formalise the synthesiser's output into one named object that is *the* interface into the engine (§4).
4. **Recommendation Narrative** — a fixed 7-part mentor structure (§5).
5. **Recommendation State** — a human label (Highly Supported → Experimental) derived from the profile (§6).
6. **Evidence Transparency** — expose Reviewed / Key Supporting / Agreements / Disagreements / Unknowns (evidence summary, *not* chain-of-thought).
7. **Weighting clarity** — document conflict priority order in the Trust Matrix (§7).
8. **Progressive UI** — clean by default, evidence on demand (§8).

---

### 3. Evidence Profile framework (replaces confidence)

Seven dimensions, each a qualitative level — **High · Moderate · Limited · None** — never a percentage. Each tells the brewer something actionable.

| Dimension | What it means | How it should shape trust |
|---|---|---|
| **Scientific Support** | Is the call grounded in first-principles / peer-reviewed science? | High → physically sound, safe to trust the *direction*. Limited → it works by practice, not proven mechanism. |
| **Expert Consensus** | Do multiple credible practitioners agree? | High → low risk, well-trodden. Limited → one voice; expect to verify. |
| **Coffee Similarity** | Is there *direct* data for this coffee, or is it extrapolated from similar ones? | High → tuned to this bean. Limited → borrowed from its type; more iteration likely. |
| **Evidence Freshness** | How current is the supporting evidence? | High → reflects current practice. Limited → may be dated. (Fundamentals are evergreen.) |
| **Research Coverage** | How much of the decision is actually backed vs inferred to fill gaps? | High → few blind spots. Limited → parts are reasoned, not evidenced. |
| **Source Diversity** | How many *independent* sources back it? | High → convergent, robust. Limited → single-origin, fragile. |
| **Recommendation Stability** | Would the advice change with a small input change? | High → settled. Limited → sensitive; treat as a starting point. |

**Why this beats a number:** a brewer reading *"Scientific Support: Limited · Expert Consensus: High · Coffee Similarity: Limited"* immediately knows: practitioners agree, but there's little hard science and no direct data for *this* coffee — so trust the technique, expect to iterate. `71%` conveys none of that.

Computation (from data already in the pipeline — no new sources):
- **Scientific Support** ← presence/weight of `kind:'science'` claims (Trust Matrix tier).
- **Expert Consensus** ← count of agreeing applied principles vs conflicts.
- **Coffee Similarity** ← Familiarity Router score + brew-history match for this coffee.
- **Evidence Freshness** ← registry `freshness` of contributing sources (fundamentals = evergreen).
- **Research Coverage** ← share of the decision's axes covered by applied principles.
- **Source Diversity** ← distinct `source.id` / `independentCount` behind the claims.
- **Recommendation Stability** ← diversity × coverage (thin evidence → unstable).

---

### 4. Evidence Bundle specification

Formalise the M3 synthesiser output into one internal object. **One recommendation ← one Evidence Bundle.** It becomes the primary interface from Evidence Synthesis into the Extraction Intelligence Engine (replacing the loose `{items, note}` hand-off — a rename/upgrade, not a new pipeline).

```ts
interface EvidenceBundle {
  coffee: CoffeeMeta;                    // origin/process/roast/… (the subject)
  scientificPrinciples: Claim[];         // kind:'science' — constraints
  expertOpinions: Claim[];               // practice claims (competition/roaster/education)
  consensus: string[];                   // areas of agreement
  conflicts: Conflict[];                 // areas of disagreement (+ how resolved)
  keySupporting: EvidenceItem[];         // the user-facing "what supports this"
  freshness: EvidenceLevel;
  assumptions: string[];                 // e.g. "extrapolated from similar high-altitude washed Caturra"
  limitations: string[];                 // unknowns / gaps (water profile, no brew history…)
  profile: EvidenceProfile;              // the seven dimensions (§3)
  state: RecommendationState;            // derived label (§6)
  narrative: string;                     // the mentor's evidence summary (prose, no %)
  reviewedCount: number;                 // how many pieces of evidence were weighed
}
```

The engine constructs the Recommendation *from* the Bundle; the UI reads the Bundle for the evidence panel. Nothing else changes shape.

---

### 5. Recommendation Narrative template

Every recommendation follows this fixed order — the mentor's thought process, not a parameter dump:

1. **Expert Judgement** — *"My read is…"* (the opinion, first).
2. **Extraction Strategy** — *"What we're optimising: …"*
3. **Evidence Summary** — *"This is primarily supported by …"* (from the Bundle; no reasoning trace).
4. **Trade-offs** — *"What we're intentionally giving up: …"*
5. **Recipe** — the implementation (params, each with its `because`).
6. **Expected Cup** — *"You should taste …"* (from `predictedCup`).
7. **Adjustment Advice** — *"If it comes out different: …"* (contingencies from the diagnosis map).

This maps onto existing outputs: (1) is today's judgement line; (2) the Strategy; (4) `strategy.tradeoffs`; (5) the Recipe; (6) `predictedCup`; (7) the Diagnosis defect map (M4). Only (3) is new prose, drawn from the Bundle. **No new generator** — it's a template over what exists.

---

### 6. Recommendation State model

A single human label replaces the percentage, derived deterministically from the Evidence Profile:

| State | When | Message to brewer |
|---|---|---|
| **Highly Supported** | Scientific Support ≥ Moderate **and** Expert Consensus High **and** Source Diversity ≥ Moderate | Strong evidence + broad agreement — brew with confidence. |
| **Well Supported** | Expert Consensus ≥ Moderate **and** Source Diversity ≥ Moderate (minor gaps) | Good evidence, small uncertainty — reliable starting point. |
| **Exploratory** | Coverage or Diversity Limited; leans on extraction *principles* over direct data | Limited published info — the call rests on theory; expect to iterate. |
| **Experimental** | Novel coffee/process; Familiarity very low; few/no applicable principles | Treat this brew as a learning opportunity — we're finding out together. |

Determination: score the profile (High=2, Moderate=1, Limited/None=0), then apply the ordered rules top-down; the first match wins. The state is honest by construction — a novel Nitro Washed with one source *cannot* read "Highly Supported."

---

### 7. Evidence weighting — conflict priority (Trust Matrix addendum)

When evidence conflicts, resolve in this order (extends the existing Trust Matrix §4; no new logic, just documented priority):

1. **Scientific plausibility first (gate).** Science validates *what's physically possible*; it can veto any practical claim that breaks the extraction curve.
2. **Competition routines guide implementation.** Within the science boundary, champion routines lead on *how* to execute.
3. **Roaster guides add coffee-specific context.** They localise to the bean/lot.
4. **User brewing history personalises.** For *this* user, their own successful brews override contested external claims.
5. **Unresolved genuine dispute →** keep the higher-trust side, mark it in the Bundle's `conflicts`, and lower the profile's Expert Consensus (not a hidden number).

Rule of thumb: **science bounds it, competition executes it, roasters localise it, your history personalises it.**

---

### 8. UI recommendations (progressive disclosure)

Default view stays clean and mentor-like — the narrative + the recipe. Evidence is *available*, not *imposed*.

- **Header:** the **Recommendation State** as a quiet chip (e.g. "Exploratory"), not a number. One glance = how much to trust it.
- **Evidence Profile:** a compact row of the seven dimensions as small labelled pills (High/Moderate/Limited), collapsed by default behind an "Evidence profile" affordance.
- **Evidence panel (expandable):** Reviewed count → Key Supporting → Areas of Agreement → Areas of Disagreement → Remaining Unknowns. Editorial, scannable — an *evidence summary*, never chain-of-thought.
- **Primary Assumption** surfaces inline under the state when Coffee Similarity is Limited ("extrapolated from similar … due to limited direct data") — the single most useful uncertainty cue.
- Follows the design system: one focal point (the recipe), depth on demand, calm by default.

---

### 9. Integration notes (no duplication)

| Enhancement | Extends (does not replace) |
|---|---|
| Evidence Profile | the retired `confidence` number — *one* signal swapped for a richer *one*, same input data |
| Evidence Bundle | the M3 synthesiser's existing `{items, note, conflicts}` output — formalised + named, same producer |
| Recommendation Narrative | today's judgement line + Strategy + Recipe + Diagnosis — a template over existing fields |
| Recommendation State | derived from the Profile — no new scoring pipeline |
| Weighting priority | documented ordering of the existing Trust Matrix rules |
| UI evidence panel | the existing evidence panel — progressive disclosure added |

**Nothing new is fetched, scored twice, or reasoned twice.** The Evidence Synthesiser still produces the evidence; it now emits a *Bundle*. The engine still produces the recommendation; it now dresses it in a *narrative* with a *profile* and *state*. The brewer stops seeing a black-box percentage and starts seeing a mentor's honest read.

*Strengthens the identity: an evidence-backed extraction-intelligence platform, not an AI recipe generator.*
