# Brew Helper — Engineering Blueprint

**Type:** Buildable spec — folders, contracts, APIs, production
**Companion:** `Platform-Architecture.md` (the why + module responsibilities)
**Audience:** whoever implements the platform (incl. future-Claude).

> Concrete counterpart to the architecture. Interfaces are illustrative TypeScript; the shapes are the contract, the language is not.

---

## 1. Folder & file architecture

A monorepo. The **knowledge lives as data** (the existing repository), the **engine as code**, and the **web app** consumes the engine over an API. Modules are packages so they stay independent and swappable (`Platform-Architecture.md §5`).

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

## 2. Data contracts

The typed seams between modules (mirror `Reasoning-Scaffold.md §3`). If a module honours these, it can be replaced freely.

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

## 3. API architecture

### 3a. Engine API (internal HTTP; the web app calls only this)
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

### 3b. Live-Research adapter API (the pluggable seam)
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

### 3c. Contracts as the only coupling
Web ⟷ API ⟷ Engine ⟷ Modules ⟷ Layers all communicate through the §2 types. Swap any implementation (rules→ML, one search provider→another) without touching neighbours.

---

## 4. Production implementation recommendations

Prioritise **maintainability, explainability, evidence-backed reasoning** over cleverness.

**Stack (recommended, pragmatic):**
- **Web:** Next.js (React) — reuses the existing component system; server components for fast first paint.
- **API/Engine:** TypeScript on serverless/edge functions (stateless engine = trivial horizontal scale). Cloudflare Workers is a strong fit (you already have that connector): **D1** for user history/models, **R2** for raw captures, **Vectorize** for principle embeddings, **KV** for the fingerprint cache.
- **Retrieval:** embed `active` principles → vector store; retrieve by coffee-fingerprint + semantic match. Keep the markdown store as source of truth; the index is regenerable.
- **LLM orchestration:** the engine calls an LLM for the *linguistic* stages (judgement, teaching, synthesis narration) under the `Reasoning-Scaffold` charter. Keep prompts **versioned in-repo**; pin model + prompt version in the response `meta` for reproducibility.
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

Each phase ships value and leaves the core untouched — the invariant from `Platform-Architecture.md §10`.

---

## 5. How this stays in sync with the rest

- `data/knowledge-repository/` **is** `Coffee/Intelligence/Knowledge-Repository/` — the `Ingest:`/`Promote:` workflow already feeds Memory.
- The engine's stages implement `Extraction-Intelligence-Layer.md`; the Science model implements `Interpretation-Heuristics.md §0`; the contracts implement `Reasoning-Scaffold.md`.
- When a principle is promoted/deprecated, the vector index rebuilds (a job) — no code change.
- This blueprint is documentation-first: build against it, and update it if the build teaches you something (same standing rule as the IA sync).

*The engine stays small and fixed. Knowledge, evidence, and learning grow around it.*
