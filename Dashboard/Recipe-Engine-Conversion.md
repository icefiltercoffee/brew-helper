# Brew Helper — Test Page → Working Page (conversion log)

Converted `Brew-Helper-Dashboard.html` from a static mock into a working dashboard
driven by the **real ingested recipes** in
`Intelligence/Knowledge-Repository/store/structured/recipes/` (RCP-0001…RCP-0011).

## Key steps taken

1. **Read the governing docs first** — `Product-Contracts.md` and
   `Brew-Helper-Master-Design-Plan.md`. The binding rule: the recommendation is
   *one confident, best-fit plan*, not a three-card catalogue.

2. **Found the mock scaffolding.** The page hard-coded `RECIPES = {A,B,C}` and
   fed them to `updateRecipes()`, which targeted `.recipe[data-recipe]` elements
   that no longer existed — dead code. The Recipe section, coffee card, and
   "Most successful recipes" list were all static placeholder copy.

3. **Built a real recipe library.** Embedded all 11 KB recipes as `LIB` in the
   page script — each with its real `target_profile`, gear, ratio, dose/water,
   temperature, pour steps (from `pour_structure`), designed-for context, and
   `claimed_outcome`. Profiles are stored in radar-axis order
   `[Sweetness, Floral, Acidity, Juiciness, Body, Clarity]`.

4. **Wired the radar to the data.** `rankLibrary()` scores every real recipe
   against the radar intent by cosine similarity. `updateRecipes()` (called on
   every radar change) sets `bestId` and refreshes the "Closest recipes to your
   goal" reference list with live match %.

5. **Committed one plan, per contract.** `renderRecipe()` writes the single
   best-fit recipe into the Brew Plan section — title, ratio/dose/water,
   strategy + setup, "Why this plan" (expected cup), and its real timed steps
   with per-step *Why*. It runs on load and on **Generate your plan** (not a
   comparison of simulated alternatives).

6. **Verified in-browser.** No console errors. Default clarity-leaning radar →
   **RCP-0005 Apartment Coffee** (clarity .95). Body preset → **RCP-0006
   Alchemist** (full body, rounded). Matching re-commits a real plan as intent
   changes.

## Notes / not yet wired

- The **coffee card** (name, flavour tags, AI read) is still driven by the New
  Brew form inputs, not a coffee database — recipe matching is what became real.
- Recipes are surfaced as *evidence for a plan*, honouring the standing rule
  that principles, not recipes, are the asset — no recipe is served as a
  standalone deliverable.
- Unchanged: scene/scroll layer, sliders, diagnosis (still scripted demo),
  timer, persistence.

## Follow-up fixes (round 2)

1. **Brew now reflects your coffee.** Previously it updated only the title/subtitle;
   the flavour tags and AI read stayed hard-coded "Colombia". Now `#brewBtn`
   parses tasting notes from the description into the flavour chips and
   regenerates the AI read (quote + strengths/challenges/advice) rule-based from
   roast · process · age, grounded in `Interpretation-Heuristics §2`.

2. **Radar drag no longer shows a selection box.** Added `user-select:none`
   (+ `-webkit-`) to `#radar`, its labels and handles so dragging can't select
   the axis text.

3. **Extraction goal is now intelligent (coupled trade-offs).** The six axes are
   competing constraints, not independent dials. A symmetric coupling matrix
   (`COUPLE`, from `Interpretation-Heuristics §4`) reacts when you move an axis:
   e.g. **max Sweetness → Body eases down** (0.42→0.34) while Juiciness rises;
   **max Body → Clarity drops** (strong antagonists). Applied on drag and
   keyboard via `setAxis()`; presets still set absolute targets.

## Round 3 — connected to the Knowledge Repository + critical Brew bug fix

**The Brew button was dead in `brew-helper-site/index.html`.** Root cause: the old
mock `updateRecipes()` referenced `.recipe[data-recipe]` cards that don't exist in
that file, so `render()` threw a `TypeError` at load — which aborted the whole
init script *before* the slider, diagnosis, and **Brew** handlers were attached.
That's why the button did nothing and the coffee never changed from "Colombia
Risaralda Milan". The site is now on the same guarded engine as the Dashboard, so
it no longer throws.

**The dashboards are now generated from the repo (the "connected" piece).**

```
Knowledge Repository (RCP-*.md)  ─┐
                                  ├─►  build/sync-brew-data.py  ─►  window.BH_DATA
Intelligence/Extraction-Model.json ┘        (regex-parses recipes,          │
   (coupling + read rules, from                builds the coupling matrix)   │
    Interpretation-Heuristics)                                              ▼
                                        inline data block injected into
                                        index.html + Brew-Helper-Dashboard.html
                                        (also written to brew-data.js)
```

- **`Intelligence/Extraction-Model.json`** — machine-readable projection of
  `Interpretation-Heuristics.md §2 & §4` (presets, coupling pairs, coffee-read
  rules). Edit this to tune the intelligence.
- **`brew-helper-site/build/sync-brew-data.py`** — reads the 11 `RCP-*.md`
  recipes + the model, emits `window.BH_DATA` (recipes, presets, 6×6 coupling
  matrix, read rules) and injects it into both HTML files between
  `<!-- BH:DATA:START/END -->` markers. Idempotent; no runtime fetch (works on
  `file://`).
- Both dashboards now read `window.BH_DATA` with the old inline literals kept
  only as a fallback.

**To refresh the dashboard after ingesting/editing recipes or tuning the model:**

```bash
python3 brew-helper-site/build/sync-brew-data.py
```

## Round 4 — attribution, brew memory, a real flavour lexicon, and the AI-read fix

1. **(a) Recipe attribution from the source files.** `sync-brew-data.py` now reads
   each recipe's `source_ref`, looks up the `SRC-*` source, and labels the recipe
   with the author + venue (e.g. *Nas Jaafar · WBrC*, *Lume*, *Joseph*). Shown in
   the "closest recipes" list and the plan.

2. **(b) Brew memory (M4) — durable, browser-local.** Saved brews and reflections
   now persist in `localStorage` (`bh_brews_v1`, shared by both dashboards).
   "Save recipe" / "Log this brew" writes a record (coffee, goal, chosen recipe);
   "Apply to next brew" attaches the reflection. "Your previous brews" renders the
   real history and a **Learned** note computed from observed-vs-goal deltas
   (e.g. *"sweetness lands below target — try grinding finer"*). Honestly labelled
   "saved to this browser" — no cloud/account yet.

3. **AI read now actually changes.** Root cause: it only rebuilt when the roast/
   process/age **dropdowns** were set. Pasting a description left it stale. Fixed:
   roast/process/age are now **inferred from the pasted text** (`BH_DATA.keywords`),
   and the read is rebuilt every time — driven by facts *and* flavour families.

4. **Flavour notes are validated against a real lexicon.** New
   `Intelligence/Flavour-Lexicon.json` — a coffee-flavour encyclopedia adapted from
   the **SCA Coffee Taster's Flavor Wheel** + **WCR Sensory Lexicon** (13 families,
   ~170 descriptors + aliases). `parseFlavours()` accepts a token as a note **only**
   if it matches the lexicon, so **regions/mills (Risaralda, Milan) and non-notes
   ("pillow") are rejected**; "bright citrus" normalises to *Citrus*. Each family
   also steers the AI read (e.g. Floral → "protect the aromatics"). Add descriptors
   to the JSON and re-run the sync to extend coverage.

### Files
- `Intelligence/Flavour-Lexicon.json` — the flavour encyclopedia (validation + read hints).
- `Intelligence/Extraction-Model.json` — now also holds `keywords` (roast/process text inference).
- Both propagate into the dashboards via `sync-brew-data.py` → `window.BH_DATA`.

### Still NOT automatic (the honest boundary)
The repo→dashboard sync is still **build-time** (re-run the script after editing
recipes/model/lexicon). Brew memory is now real but **local to one browser** — it
is not yet an account-backed or cross-device store, and the learned note is a
simple observed-vs-goal heuristic, not a trained model.

## Round 5 — General Advice, Brew Plan redesign, live timer, deployment

- **"AI read" → "General Advice"**, attribution line removed. The headline and the
  Strengths/Challenges/Advice content were rewritten to be concrete and specific
  (grind direction, °C ranges, pour handling, timing) with the filler adjectives
  (e.g. "transparent") stripped. Source: `Extraction-Model.json` `read` + new
  `grind` block. *Note:* a recipe's own `claimed_outcome` (shown as "Aiming for")
  can still contain words like "transparent" — that's ingested evidence, not the
  advice engine; scrub it in the RCP file if unwanted.
- **Brew Plan** — parameters moved from a small tag to a prominent card row under
  the recipe name (Ratio · Dose · Water · Temp · Brewer · Grinder). Steps are now
  one line each: number · instruction · timing · **inline explanation** · Why
  (Why expands the deeper mechanism).
- **Brew timer is live** — "Start brew timer" opens a counter that runs off the
  plan's step times, highlights the active step, and shows "next … at m:ss".
  Start/Pause/Resume/Reset/Close.
- **Save recipe is live** — writes to brew memory and confirms with "Saved ✓".

### Deployment (2026-08-08: the scroll dashboard is the live one)
- **Scroll** `brew-helper-site/index.html` — pinned café scene + hero + chaptered
  dashboard. **Live at https://brew-helper.pages.dev** (Cloudflare Pages project
  `brew-helper`, direct-upload, no git remote).
- **Non-scroll** `Dashboard/Brew-Helper-Dashboard.html` — no hero, no canvas.
  **Not deployed.** Retained only as the design-system reference implementation:
  `Design System/Colors/Color-System.md` and `Design-Language.md` both name its
  `:root` as the token source of truth. Delete it only after repointing those.

> Previously the non-scroll file was staged as `index.html` at the Pages root,
> which is why the live site showed no hero and no scroll sequence. Do not
> reinstate that step.

**To re-deploy after an update** (both files stay data-synced via the build script):
```bash
cd "Coffee" && python3 brew-helper-site/build/sync-brew-data.py
cd brew-helper-site && npx wrangler pages deploy . --project-name=brew-helper --branch=main --commit-dirty=true
```
Going forward, an "update" means: edit `brew-helper-site/index.html` (or the
model/recipes + re-sync), then re-run the deploy above.
