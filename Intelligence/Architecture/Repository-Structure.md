# Brew Helper — Repository Structure

**Type:** The definitive "where everything lives" — folders, services, APIs, prompts, data models
**Reads with:** `Platform-Architecture.md` · `Engineering-Blueprint.md` · `System-Architecture-Diagram.svg`
**Principle:** knowledge is **data** (the existing repository), reasoning is **code** (packages), the app **consumes an API**. Each module is a package so it stays independent and swappable.

> This is a scaffold a builder can create on day one. Every path has a single responsibility; nothing reaches across a package except through typed contracts.

---

## 1. Top level

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

## 2. `apps/web/` — the dashboard

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

## 3. `packages/` — engine + modules

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

## 4. `prompts/` — the reasoning text (versioned)

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
│   └── charter.v1.md         # standing rules (Reasoning-Scaffold §1): strategy-first, no unexplained number, cite mechanisms
└── registry.json             # active prompt versions + model pins
```
Each prompt encodes a stage from `Extraction-Intelligence-Layer.md`. Changing a prompt bumps its version; the engine records which version produced each recommendation.

---

## 5. `data/knowledge-repository/` — the principle library

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

## 6. `services/` — deployable surfaces

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

## 7. `config/` & `tests/`

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

## 8. Core data models (the contract surface)

Defined once in `packages/contracts/`; everything else references them. (Full shapes: `Engineering-Blueprint.md §2`.)

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

## 9. Reading order for a new builder

1. `contracts/` — learn the types (the whole system is these plus functions).
2. `Platform-Architecture.md` + the SVG — the shape.
3. `engine/orchestrator.ts` — the spine that calls everything.
4. The stage prompts — the reasoning text.
5. `data/knowledge-repository/` — the knowledge it reasons over.

*Knowledge is data, reasoning is code, the app is a client. That separation is what keeps this maintainable as it grows.*
