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

## Design consequence

The dashboard is a guided coaching session: **log → understand → choose intent → receive one plan → brew → reflect → improve.** Each section is designed around the artifact it owns and hands forward; no card implies a capability the engine cannot provide.
