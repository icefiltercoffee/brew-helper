# Brew Helper — Implementation Roadmap

**Type:** Build order — vertical slices, thinnest first
**Reads with:** `Repository-Structure.md` · `Platform-Architecture.md` · `Engineering-Blueprint.md`
**Principle:** every milestone ships a **working vertical slice** (something you can run and see), not a horizontal layer. The engine stays small; capability is added as plugins on the bus. The core is never rewritten.

> Rule of thumb: if a milestone doesn't end with "you can now do X end-to-end," it's scoped wrong. Build the spine before the limbs.

---

## Current status (visualised on `System-Architecture-Diagram.svg`)

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

## Sequencing at a glance

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

## M0 — Scaffold & contracts
- **Goal:** the repository exists and types compile. No behaviour yet.
- **Build:** the monorepo tree (`Repository-Structure.md`); `packages/contracts/` with every data model; empty module packages exposing their interface signatures; `services/api` returning stubs; wire `apps/web` to the API client.
- **Modules:** contracts only.
- **Depends on:** nothing.
- **Done when:** `contracts` compiles; a `POST /recommend` returns a hard-coded `Recommendation`; the dashboard renders it. **The pipes connect before anything flows.**

## M1 — Thinnest working slice ⭐ (the walking skeleton)
- **Goal:** a real, explainable recommendation from local knowledge only. No research, no science gate, no learning.
- **Build:** `engine/orchestrator` running stages Observe→Interpret→Decide→Recommend→Explain; `memory` reads `data/knowledge-repository/store/principles/active` (you already have PRN-0001); `strategy` + `recipe` generators; stage prompts v1; `explain` returns judgement + a plain recipe.
- **Modules:** Orchestrator, Memory Manager (read-only), Strategy Generator, Recipe Generator.
- **Depends on:** M0.
- **Done when:** intake a coffee + radar intent → the engine emits a **strategy first**, then a recipe whose params each carry a `because`, then a judgement line — rendered in the dashboard. **This is the product in miniature.** Invariant test: never recipe-before-strategy.

## M2 — Coffee-Science validation gate
- **Goal:** no recommendation can contradict physics.
- **Build:** `science/model` (extraction-curve constraints from `Interpretation-Heuristics.md §0`) + `validate`; orchestrator calls it after Decide and after Recommend; veto → re-derive, flag → annotate.
- **Modules:** Scientific Validation Engine.
- **Depends on:** M1.
- **Done when:** a deliberately bad strategy (e.g. "boiling water + very fine + long time on a dark roast") is caught and corrected/flagged. Eval: science gate passes on the golden set.

## M3 — Evidence synthesis + panel
- **Goal:** recommendations show *what informed them* (context, not citations, not reasoning).
- **Build:** `evidence/synthesise` (cluster · weight · consensus/conflict over Memory claims) + `evidence-object`; `apps/web/EvidencePanel`.
- **Modules:** Evidence Synthesiser.
- **Depends on:** M1 (M2 optional-parallel).
- **Done when:** each recommendation renders an Evidence panel ("similar coffees · a competition routine · coffee science on extraction energy · your history") and the transparency contract holds (no chain-of-thought exposed). Eval: evidence always attached.

## M4 — Reflect & learn (local models)
- **Goal:** brewing improves *your* future recommendations.
- **Build:** `diagnosis/diagnosis-engine` (expected vs observed vs feedback → adjustments); `learning/learning-engine` writing **user preference** + **equipment calibration** models to `memory/user-models`; wire the Reflection section + `POST /diagnose`, `/feedback`.
- **Modules:** Diagnosis Engine, Learning Engine (user/equipment scope only).
- **Depends on:** M1.
- **Done when:** logging a debrief produces a diagnosis that loops back to the radar, and the next recommendation for the same gear reflects the calibration ("your grinder runs coarse, so…"). Universal principles are **not** minted here (that's M6).

## M5 — Live research + adaptive routing
- **Goal:** novel/unfamiliar coffees pull the latest external knowledge; familiar ones don't.
- **Build:** `research/familiarity-router` (coverage×freshness×confidence); `research-manager` (budget + cache); 1–2 `adapters` behind `search-provider`; `config/source-registry.json` seeded with **Joseph's curated allowlist**; feed results into the Evidence Synthesiser.
- **Modules:** Familiarity Router, Live Research Manager, Source Adapters.
- **Depends on:** M3 (synthesis must exist to merge research).
- **Done when:** a familiar coffee returns with **no fetch** (fast, local); an unfamiliar one triggers a bounded research pass whose findings appear in the Evidence panel. Requires the trusted-source list — **the one input still owed by Joseph.**

## M6 — Learning writes back to Memory (the compounding loop)
- **Goal:** durable findings (from research or repeated brews) become **principles**.
- **Build:** `ingestion/pipeline` as code (G0–G5) invoked by research + brew-logs; convergence + confidence scoring; candidates queue; `Promote` remains a human gate; `jobs/reindex` rebuilds the embedding index on promote.
- **Modules:** Ingestion Pipeline, Learning Engine (universal scope), reindex job.
- **Depends on:** M5 (research) + M4 (brew-logs).
- **Done when:** a research finding seen across ≥2 independent sources becomes a candidate principle awaiting review; promoting it raises familiarity so the same coffee needs no future fetch. **The platform now gets faster and smarter with use.**

## M7 — Hardening
- **Goal:** production-grade quality, speed, and cost.
- **Build:** fingerprint + research + retrieval caches; `tests/evals` in CI (invariants + golden set on any prompt/model/principle change); observability traces (layers hit, research fired, principle versions, science flags, latency, token cost); guardrails + PII isolation; stream the judgement first, hydrate evidence after.
- **Depends on:** M1–M6.
- **Done when:** p95 latency + cost within budget; evals gate merges; every recommendation is traceable and reproducible.

## M8+ — Scale (plugins, never rewrites)
- **Goal:** grow capability without touching the core.
- **Build, independently:** `methods/` plugins — **espresso**, **immersion**, **cold brew** (each supplies params + science constraints + recipe rules); **i18n** (render + source-language adapters); **community intelligence** as a source type; **ML swap-ins** behind existing interfaces (e.g. a learned Familiarity scorer or extraction predictor).
- **Depends on:** M1–M7 as needed; each plugin is isolated.
- **Done when:** a new brew method ships by adding a plugin — the engine, layers, evidence, and contracts are unchanged. This validates the whole architecture.

---

## What to build first, concretely

Start **M0 → M1** and stop to use it. You already have live Memory content (SRC-0001/0002, RCP-0001/0002, PRN-0001 active), so M1 produces genuine recommendations on day one — no research or ML required. Everything after M1 is additive and independently valuable.

**Critical path:** M0 → M1 → (M2 ∥ M3) → M4 → M5 → M6 → M7 → M8+.
**Blocked-on-you:** M5 needs the trusted-source allowlist; M6's promotions need your review (by design).

*Build the spine (M1), make it lawful (M2) and transparent (M3), let it learn locally (M4), then reach outward (M5) and compound (M6). The core you write in M1 is the core you keep.*
