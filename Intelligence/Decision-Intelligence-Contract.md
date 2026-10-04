# Brew Helper 2.0 — Decision Intelligence Contract

## Purpose

Brew Helper explains the next best brewing decision and why it is the best decision. It is not a recipe database, chatbot, or recipe recommender.

Recipes, research, competition routines, expert observations, and saved user brews are evidence. They must never be presented as the product or copied as a recommendation.

## Mandatory reasoning loop

1. Observe the bean, recipe, water, equipment, environment, user goal, and relevant saved brews.
2. Diagnose the current extraction problem before proposing a change.
3. Generate the single highest-value decision, with purpose and mechanism.
4. Predict sensory impact, trade-offs, confidence, and uncertainty.
5. Learn relationships between coffee characteristics, decisions, and outcomes. Do not memorise recipes as instructions.

## Decision record

Every recommendation is assembled from decision evidence with: decision, purpose, mechanism, sensory impact, scientific support, competition support, recipe support, contradictory evidence, confidence, applicable coffee types, and trade-offs.

## Required reasoning surfaces

- Counterfactuals: predict the qualitative effect of dose, grind, temperature, bloom, agitation, pour structure, bypass, water chemistry, and drawdown, including mechanism.
- Brew replay: reconstruct likely extraction events after a brew and identify the highest-leverage correction.
- Evidence hierarchy: science → repeated competition observations → independent recipes → experienced brewers → user history. Surface material conflict.
- User-facing output: answer only What should I change? Why? What result should I expect? Everything else is expandable.

## Guardrail

No dashboard-facing change may be made without Joseph's explicit approval. This contract supersedes conflicting internal Brew Helper architecture and product-contract language.
