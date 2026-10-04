# Brew Helper — Platform (code)

The buildable platform. Design + knowledge live in `../` (Dashboard, Design System, Intelligence).
This folder implements `../Intelligence/Architecture/` (Repository-Structure, Blueprint, Roadmap).

**Status: M6/M7 in progress.** The decision engine, science gate, evidence, local learning, and governed-research seams are implemented. Current work adds review-gated learning-to-memory and production persistence/hardening.

## Layout (mirrors Repository-Structure.md)

```
Platform/
├── packages/
│   ├── contracts/index.ts     # ⭐ the typed seams — every module depends on this
│   ├── engine/orchestrator.ts # runs the decision loop and science gate
│   ├── ingestion/             # M6 candidate proposal gate
│   ├── memory/                # local principle retrieval
│   └── science/validate.ts    # physics gate
├── services/api/routes/recommend.ts   # thin HTTP over the engine (stub)
├── config/                    # source-registry (allowlist) · models · budgets
├── package.json  tsconfig.json
```

## Reading order
1. `packages/contracts/index.ts` — the whole system is these types + functions.
2. `packages/engine/orchestrator.ts` — the spine that calls the modules in order.
3. `../Intelligence/Architecture/Implementation-Roadmap.md` — what to build next.

Run `npm test`, `npm run eval`, and `npm run typecheck` before deployment. The D1 Worker preparation lives in `worker/`.
