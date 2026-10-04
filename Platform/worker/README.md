# Brew Helper persistence API

This Worker persists brew outcomes, grinder calibration, review-only M6 candidates, and minimal recommendation traces in D1. It does not generate recommendations and it cannot activate a principle.

## Before first deployment

1. Create the D1 database: `npx wrangler d1 create brew-helper`.
2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc` with the returned database ID.
3. Set the admin secret: `npx wrangler secret put ADMIN_TOKEN`.
4. Apply the migration: `npx wrangler d1 migrations apply brew-helper --remote`.
5. Deploy: `npx wrangler deploy`.

The API permits the production Pages origin only. `/v1/feedback` uses an anonymous browser profile ID generated locally; there is no sign-in. Tasting notes stay in the browser and are not sent to D1. Candidate-queue endpoints require the `ADMIN_TOKEN` bearer token so public visitors cannot inject principles.

`POST /v1/traces` stores only the anonymous profile, coffee fingerprint, state, principle IDs, science flags, latency and an optional model-cost estimate. `GET /v1/metrics` returns a rolling seven-day trace count, average latency, p95 latency and total estimated cost, plus an explicit release-budget result (p95 ≤1,000 ms; seven-day cost ≤US$1). `POST /v1/ingestion/candidates/:id/review` is admin-only and can mark a candidate promoted or rejected. A promotion remains non-active; `GET /v1/ingestion/export` produces a reviewed, human-readable export for the Principle Library and its existing reindex step.

## Governed free research

Google Programmable Search is optional and searches coffeeDB only. Set `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` for an existing free-tier Google Custom Search project. The provider is disabled without both values and Brew Helper never scrapes google.com. coffeeDB is discovery metadata (Tier C), not brewing-mechanics evidence.
