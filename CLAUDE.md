> **SEALED PROJECT.** Brew Helper is isolated from Steven OS by Joseph's instruction (2026-08-14).
> Its knowledge stays in this folder and never enters `Brain/`. No Steven intern or dashboard reads,
> cites or surfaces anything from here. When working in this folder, read only this file and the
> project's own docs — do not load Brain memory, principles or playbooks.

# Coffee — Brew Helper

**Read this file in full before making any change in `Coffee/`.** It is the permanent operating contract for every AI session on this project. It overrides default assistant behaviour.

---

## 1. Product Identity

Brew Helper is a **decision-intelligence product for filter coffee**, not a recipe catalogue.

Product flow:

`log coffee and setup → understand coffee → choose extraction intent → receive one plan → brew → reflect → diagnose → improve`

Recipes are **evidence used to support decisions**. The durable value is judgement, equipment awareness, scientific constraints, evidence quality, and the learning loop.

---

## 2. Core Preservation Rule

This is an evolving product, not a disposable prototype.

Never remove, replace, simplify, redesign, rename, disable, or silently change existing functionality unless Joseph explicitly asks for it. When adding a feature, assume all existing sections, controls, routes, data, interactions, visual language, disclosures, and behaviours must remain unchanged.

Default preference:

- `PRESERVE > REPLACE`
- `EXTEND > REWRITE`
- `TARGETED CHANGE > BROAD REFACTOR`

Never remove something because it appears unused, duplicated, outdated, overly complex, or unnecessary. **Flag the concern instead.**

---

## 3. Before Editing

1. Inspect the relevant implementation and its source-of-truth documents.
2. Identify affected state, routes, data, generated files, assets, and tests.
3. Check dependencies and existing functionality in that area.
4. Determine whether the change is functional, visual, architectural, generated, or deployment-related.
5. Make the smallest reasonable change.
6. State any conflict with an existing product contract **before** proceeding.

Do not rewrite an entire component, page, engine, or data file when a targeted modification is sufficient.
Do not treat a design plan, roadmap, wireframe, or proposal as authorisation to change the working product.

---

## 4. Functional Product Contracts (permanent invariants)

- Brew Session state is `draft → coffee understood → strategy set → plan generated → brewed → reflected → saved`.
- Progress reflects **session state**, never scroll position.
- Recommendations use only equipment the brewer has confirmed. Unknown equipment stays visibly unknown or an explicit assumption.
- Each session receives **one** confident, equipment-compatible, science-gated plan.
- Plan order: judgement and strategy first, then expected cup, parameters, steps, reasons, trade-off, adjustment.
- No simulated recipe comparisons or generic recipe browsing unless the engine produces genuinely distinct valid strategies **and** Joseph explicitly requests that experience.
- Expected expression and observed cup stay separate. The brewer's reflection is authoritative.
- Never present history, community data, saving, diagnosis, research, or persistence as real unless it is wired and verified.
- Learning stays scoped to the relevant coffee, equipment, or user preference. A session adjustment is not durable history unless persistence exists.
- Displayed pour targets round **up** to the next 5 g.
- Recipe evidence must match the relevant coffee process and equipment before anchoring a recommendation.
- General Advice and Coach copy: direct, action-first, peer-to-peer, limited to the highest-leverage move.

---

## 5. Architecture and Source of Truth

| Path | Role |
|---|---|
| `Dashboard/Product-Contracts.md` | Functional truth |
| `Dashboard/Brew-Helper-Master-Design-Plan.md` | Experience architecture + preservation baseline |
| `brew-helper-site/index.html` | **The one and only dashboard surface.** Deployed to brew-helper.pages.dev. Regression-protected. Also holds the design tokens (`:root`) and the live style-guide appendix (`#system`). |
| `Dashboard/*.html` | Low-fi IA wireframes only — **not** implementations. Never deployed. |
| `Design System/` | Visual language: Visual-Principles, Component-Inventory, Design-Language, token folders (Colors, Typography, Layout, Cards, Charts) |
| `References/UI_Personality.md` | The AI's voice |
| `Intelligence/Interpretation-Heuristics.md` | Human reasoning source of truth |
| `Intelligence/Extraction-Model.json` | Structured runtime projection of the above |
| `Intelligence/Knowledge-Repository/` | Raw sources, structured recipes, principles, candidates, promotion governance |
| `Platform/packages/contracts/` | Typed seams |
| `Platform/packages/engine/orchestrator.ts` | Decision-loop spine |
| `brew-helper-site/build/sync-brew-data.py` | Generates dashboard data → `brew-data.js` + inline `BH:DATA` block in `index.html` |
| `Platform/services/web/live.template.html` | Engine harness template (source; its generated page was retired) |

### One dashboard — do not create a second
There is exactly **one** rendering surface: `brew-helper-site/index.html`. It is the Pages build output root and the deploy target. Never create a parallel dashboard copy, a "non-scroll version", or a second HTML implementation. If a variant seems needed, ask first.

Deploy: merging to `main` on GitHub deploys automatically (`.github/workflows/deploy-site.yml`, runs when `brew-helper-site/**` changes). Manual fallback from a Mac: `cd brew-helper-site && npx wrangler pages deploy . --project-name=brew-helper --branch=main --commit-dirty=true`. See §10.

- Active principles are **human-controlled**. Never auto-promote candidates.
- Do not hand-edit generated regions without understanding the regeneration path.
- Scene animation is progressive enhancement only. It must never own session state or replace dashboard actions.
- **If multiple documents disagree, stop and report the conflict. Do not silently choose one.**

### IA sync rule
The information architecture is shared across: `Dashboard/Brew-Helper-Wireframe-Spec.md`, `Dashboard/Brew-Helper-Layout-Rationale.md`, `Dashboard/Brew-Helper-Wireframe-v2.html`, `Dashboard/Brew-Helper-Wireframe.html`, `Design System/Component-Inventory.md`. Whenever the IA changes, update all of them in the same pass. Promoting or deprecating a principle likewise updates `Intelligence/Interpretation-Heuristics.md`.

Current model: **6 sections** — New Brew → Coffee → Radar → Recipe → Reflection → Community.

---

## 6. Dashboard and Design Guardrails

- Change only the named section or component.
- Preserve existing information architecture, visual language, responsive behaviour, accessibility, navigation, controls, and unrelated sections.
- Do not replace functional controls with decorative interactions.
- Preserve keyboard and touch access; no essential information may be hover-only.
- Preserve reduced-motion and static fallbacks.
- No new imagery, generated assets, copied third-party imagery, or invented URLs without explicit approval.
- Obtain Joseph's explicit approval before any dashboard-facing edit or deployment when it is not already included in the current instruction.

---

## 7. Data and Knowledge Guardrails

- Recipes are evidence; **principles are the asset**. Never store or serve recipes as deliverables.
- Preserve raw source material verbatim.
- Extract mechanisms and principles rather than blindly copying recipe numbers.
- Keep unknowns as `unspecified`, unavailable, or assumed. Never fabricate completeness.
- Preserve source IDs; never reuse `SRC-####`, `RCP-####`, `PRN-####`. IDs increment globally.
- Keep provenance, confidence, conflicts, and evidence scope visible.
- Recipe-visual priority: exact recipe image → Lume image (where applicable) → coffee/origin/farm match → café fallback.

### Knowledge-Repository commands
Operate conversationally, following `Intelligence/Knowledge-Repository/Ingestion-Pipeline.md` exactly.

| Command | Action |
|---|---|
| `Ingest: <url or pasted recipe>` | G0–G4: capture verbatim to `store/raw/`; screen against the rubric (tier + completeness/reproducibility scores + reject/park/proceed); normalize to a `Recipe` (+ `Source`); extract candidate principles as *mechanisms*; distil against the library (merge/strengthen or new candidate; flag conflicts). **Never auto-promote.** |
| `Ingest batch: <urls>` | Per-item ingest + cross-batch dedupe + consolidated report. |
| `Review queue` | List `store/principles/candidates/` with evidence, confidence, conflicts. |
| `Promote PRN-####` | Move to `active/`, link into `Interpretation-Heuristics.md`, bump version. **Joseph only.** |
| `Deprecate PRN-#### (reason)` | Move to `deprecated/` with reason + `supersedes`. |
| `Distil` | Re-merge candidates, recompute confidence, surface stale conflicts. |
| `Trace PRN-####` | Walk a principle back through its recipes to raw sources. |

Standing ingest behaviour: screen before distilling · never originate an `active` principle from Tier-C alone · extract mechanisms not numbers · flag unknowns as `unspecified` · propose confidence, never self-promote · report conflicts loudly · stay in the mentor voice (`References/UI_Personality.md`).

**Source defaults** — Lume: all Lume recipes use **Hario Switch** brewer + **Mola coffee filter paper** unless the recipe states otherwise.

---

## 8. Verification Before Finishing

Before reporting completion:

- Verify the requested change directly.
- Run relevant checks: `npm run typecheck`, `npm test`, `npm run eval` (or `npm run release:check`) in `Platform/`, plus build and data-sync steps where relevant.
- Confirm existing inputs, controls, routes, state transitions, engine outputs, disclosures, timer, reflection, diagnosis, and persistence behaviour remain available.
- Check unrelated UI and assets did not change.
- Check generated files remain consistent with their sources.
- Check no existing feature, route, data, asset, or behaviour disappeared.
- Report what was verified and clearly identify anything **not** verified.

---

## 9. Retired surfaces

Do not reintroduce `Brew-Helper-Dashboard.html` or `Brew-Helper-Live.html`; `brew-helper-site/index.html` remains the only dashboard surface.

---

## 10. Repository, workflow and deploy (laptop and phone sessions)

This folder is the GitHub repo `icefiltercoffee/brew-helper`. Sessions run either on Joseph's Mac (`~/Steven/Coffee`) or in a cloud clone started from his phone. Both follow this file; a cloud clone has nothing else.

### Working rules (carried over from Joseph's workspace contract)
- **Additive by default.** Do not delete, rename, retire, replace or broadly refactor anything unless Joseph names it in this session. "Improve X" never authorises removing part of X.
- **Rewrites publish an omissions list.** Rebuilding a section lists what did *not* carry across, before it ships.
- **No invented values.** Anything without a real source renders `unavailable`, `stale` or `needs refresh`.
- **Class the change first:** content · presentation · behavior · data/integration · security/auth · deployment. Data, security and deployment changes need Joseph's explicit approval.
- **Inventory protected functions before editing** the affected area (controls, routes, states, gates) and confirm each still works after.
- **Nothing verifies itself.** Report what was checked and what was not.
- **Conflicts are surfaced, never silently resolved.**
- **Sealed.** Never connect Brew Helper to Steven OS, its Brain, or other projects.

### Branches and deploy
- Merging to `main` **publishes the live site** (brew-helper.pages.dev) when `brew-helper-site/` changed. "Build", "fix", "edit" never mean deploy.
- So: work on a branch and open a pull request for Joseph to approve. Push to `main` directly only when Joseph says "deploy" / "ship it" for that change.
- `.github/workflows/checks.yml` runs the engine checks on every PR; `deploy-site.yml` deploys on merge (secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` are set in the repo).
- After a deploy, open https://brew-helper.pages.dev and confirm the change is live.

### Build and test
- Setup: `cd Platform && npm ci` (cloud sessions do this automatically via `.claude/settings.json`).
- Engine checks: `cd Platform && npm run release:check` (typecheck + tests + golden evals). Run before every PR that touches `Platform/`.
- Dashboard data: `python3 brew-helper-site/build/sync-brew-data.py` regenerates `brew-data.js` and the inline `BH:DATA` block in `index.html` from the Knowledge Repository (recipes, `Extraction-Model.json`, `Flavour-Lexicon.json`) and copies recipe visuals. Run after changing recipes, the model or the lexicon; never hand-edit the generated block.
- Engine bundle: `cd Platform && npm run build:public-engine` rebuilds the engine and inlines it into `index.html` (between the `PLATFORM_ENGINE` markers).
- No local server is needed: open `brew-helper-site/index.html` directly, or serve the folder with any static server.

### Syncing the Mac copy
Joseph double-clicks **`Get Phone Edits.command`** in this folder to pull changes made from the phone. Mac sessions should `git pull --rebase --autostash` before starting work.

The site folder's pre-GitHub history is kept locally in `.site-history.git/` (not pushed).

---

**Governing principle:** new work must add to Brew Helper without erasing, weakening, or silently redefining the product that already exists.
