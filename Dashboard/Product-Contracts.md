# Brew Helper — Product Contracts

**Purpose:** The stable truths that keep the dashboard, engine, and future persistence aligned. A contract is not an API specification; it is the answer to what a section may show, change, and hand to the next section.

## 1. Brew Session

**Lifecycle:** draft → coffee understood → strategy set → plan generated → brewed → reflected → saved.

- The progress rail reflects this state, not mere scroll position.
- New Brew owns the draft; Coffee and Radar are unavailable until a coffee exists.
- Recipe is a committed plan, not an independent browsing surface.
- Reflection is available only after a plan has been brewed or deliberately logged as brewed.

## 2. Setup & Capability

**Truth:** a recommendation may only use the gear the brewer says they own.

- New Brew captures the relevant brewer, grinder, filter, water, and batch context; unknowns remain visible assumptions.
- Recipe shows the assumed equipment beside the plan.
- An incompatible technique is never rendered as the plan. It may appear as a future suggestion: “Try this if you add a Hario Switch.”

## 3. Recommendation

**Truth:** one session receives one confident, equipment-compatible, science-gated plan.

- Recipe leads with judgement → strategy → expected cup → plan → per-step why → trade-off → adjustment.
- It is not a three-card comparison or a generic recipe catalogue.
- “Why this plan?” expands the strategy and evidence; it does not ask the brewer to choose between simulated alternatives.
- A later “Explore approaches” mode may exist only when the engine genuinely produces distinct, valid strategies.

## 4. Learning

**Truth:** reflection produces a scoped learning record — coffee, equipment, or preference — and says when it changes future advice.

- Reflection captures observed cup and notes; Diagnosis returns the smallest useful adjustment.
- Until durable M4 storage exists, the UI calls this a session adjustment, not saved history.
- Community and Library surface durable history only after it is actually persisted.

## 5. Decision Intelligence (Brew Helper 2.0)

> Merged on 2026-10-05 from `Intelligence/Decision-Intelligence-Contract.md`. This is the controlling product contract: where it conflicts with §1–4, this section wins.

### Purpose

Brew Helper explains the next best brewing decision and why it is the best decision. It is not a recipe database, chatbot, or recipe recommender.

Recipes, research, competition routines, expert observations, and saved user brews are evidence. They must never be presented as the product or copied as a recommendation.

### Mandatory reasoning loop

1. Observe the bean, recipe, water, equipment, environment, user goal, and relevant saved brews.
2. Diagnose the current extraction problem before proposing a change.
3. Generate the single highest-value decision, with purpose and mechanism.
4. Predict sensory impact, trade-offs, confidence, and uncertainty.
5. Learn relationships between coffee characteristics, decisions, and outcomes. Do not memorise recipes as instructions.

### Decision record

Every recommendation is assembled from decision evidence with: decision, purpose, mechanism, sensory impact, scientific support, competition support, recipe support, contradictory evidence, confidence, applicable coffee types, and trade-offs.

### Required reasoning surfaces

- Counterfactuals: predict the qualitative effect of dose, grind, temperature, bloom, agitation, pour structure, bypass, water chemistry, and drawdown, including mechanism.
- Brew replay: reconstruct likely extraction events after a brew and identify the highest-leverage correction.
- Evidence hierarchy: science → repeated competition observations → independent recipes → experienced brewers → user history. Surface material conflict.
- User-facing output: answer only What should I change? Why? What result should I expect? Everything else is expandable.

### Guardrail

No dashboard-facing change may be made without Joseph's explicit approval. This section supersedes conflicting internal Brew Helper architecture language and §1–4 above where they conflict.

## Design consequence

The dashboard is a guided coaching session: **log → understand → choose intent → receive one plan → brew → reflect → improve.** Each section is designed around the artifact it owns and hands forward; no card implies a capability the engine cannot provide.
