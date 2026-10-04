# Brew Helper — Component Inventory

**Type:** The reusable parts list — the "LEGO box"
**Reads with:** `Visual-Principles.md`, `UI_Personality.md`, `../Dashboard/Product-Contracts.md`, and the wireframes in `/Dashboard`
**Rule:** every component has **one responsibility**, renders from **its own data**, and works in **grayscale** first.

> This is the contract, not the styling. Each entry defines responsibility, anatomy, states, and where it lives. Visual specs are built later in `/Cards`, `/Charts`, `/Typography`, `/Colors`, `/Layout`.

---

## Two Tiers

- **Domain cards** — coffee-specific, content-bearing. The recognisable surfaces of the product.
- **Primitives & structural** — the reusable building blocks everything is assembled from.

Anchors (per Visual Principles): **Bean Card**, **Extraction Radar**, **Recipe Card** carry the most weight. All others support.

---

## A · Domain Cards

### 0. Brew Intake  · entry
- **Responsibility:** Capture the coffee the barista is about to brew — the structured entry point (Section 01, "What are you brewing today?").
- **Anatomy:** large description text field · reminder line (tasting notes are the user's own) · attribute field grid — Country of origin, Roast level, Grinder, Grind size, Roast age, Altitude, Process, Roaster · **Brew** action.
- **States:** empty · in-progress · submitted (Brew → builds & reveals the Bean Card).
- **Used in:** New Brew section; "log a brew" from history/Library.
- **Composed of:** `Field/Select` primitive ×8 + `Button`. **Folder:** `/Cards` (form pattern) · fields in `/Cards` primitives.

### 1. Bean Card  ★ anchor
- **Responsibility:** Display and orient the user to a coffee — assembled from the Brew Intake.
- **Anatomy:** image/thumbnail · name (origin · region · lot) · process · flavour tags · key stats (roast age, process, roast level, altitude).
- **States:** default · selected · compact (list/search result) · assembling (just built from intake).
- **Used in:** Coffee section, Library, Community "similar coffees", search results.
- **Folder:** `/Cards`

### 2. AI Analysis Card
- **Responsibility:** Interpret the bean — strengths, challenges, extraction advice. *Analysis, not recipes.*
- **Anatomy:** section title · three grouped blocks (Strengths / Challenges / Advice) · expandable reasoning.
- **States:** collapsed (disclosure inside Bean Card) · expanded · loading.
- **Used in:** Coffee section (as "AI read" disclosure), any bean detail view.
- **Folder:** `/Cards`

### 3. Extraction Radar  ★ anchor · signature
- **Responsibility:** Translate intent into extraction priorities — the pivot interaction.
- **Anatomy:** goal preset chips · interactive radar (6 axes: Sweetness, Floral, Acidity, Juiciness, Body, Clarity) · live readout · generate action.
- **States:** default (from preset) · dragging/active · recalculating · locked (pre-coffee).
- **Used in:** Radar section. The one component with the most affordance on the page.
- **Folder:** `/Charts` (interactive), pattern shell in `/Cards`

### 4. Recipe Card  ★ anchor
- **Responsibility:** Present the one committed, equipment-compatible brewing plan as an actionable unit.
- **Anatomy:** judgement · strategy line · assumed gear · key params (ratio, grind, temp) · expected cup · expandable steps (each supports a WHY) · trade-off / adjustment · save or start-brew action.
- **States:** loading · recommended · expanded (steps visible) · safety-noted · saved (history).
- **Used in:** Recipe section, Community "successful recipes", Learning/history.
- **Folder:** `/Cards`

### 5. Strategy Context
- **Responsibility:** Give the plan its coaching context without competing with it.
- **Anatomy:** primary objective · secondary objective · intentional trade-off · expected cup · evidence-state / assumption when relevant.
- **States:** concise (default) · expanded (“Why this plan?”) · exploratory (explicit uncertainty).
- **Used in:** Recipe section, above the Recipe Card. A future comparison pattern is permitted only when the engine creates genuinely distinct valid strategies.
- **Folder:** `/Cards` (composite) · layout rules in `/Layout`

### 6. Equipment Card
- **Responsibility:** Represent the gear a recipe assumes/uses (grinder, brewer, filter, kettle, scale).
- **Anatomy:** equipment name/type · key setting relevant to the recipe (e.g. grind size) · swap/select affordance.
- **States:** default · selected · unset (prompt to add) · mismatch (recipe expects different gear).
- **Used in:** Recipe Details, Settings (user's kit), Feedback (what was used).
- **Folder:** `/Cards`

### 7. Feedback Card *(Brew Debrief)*
- **Responsibility:** Capture structured sensory observations — **no stars, no scores.**
- **Anatomy:** prompt ("How did it taste?") · sensory sliders (Sweetness, Body, Acidity, …) · free notes/observations.
- **States:** empty · in-progress · submitted (locks, hands off to Diagnosis).
- **Used in:** Reflection section, re-tasting a past brew.
- **Folder:** `/Cards`

### 8. Diagnosis Card
- **Responsibility:** Interpret feedback → concrete next-brew adjustments, linked to extraction theory.
- **Anatomy:** summary read · adjustment checklist (e.g. grind finer, lower agitation) · "loops to radar" affordance.
- **States:** hidden (pre-submit) · revealed (on feedback submit) · applied (adjustments seed next radar).
- **Used in:** Reflection section (output panel), history entries.
- **Folder:** `/Cards`

### 9. Community Card
- **Responsibility:** Surface an external/reference item — a similar coffee, a successful community recipe, or a previous brew.
- **Anatomy:** compact list item · label group header (Similar coffees / Most successful / Your previous brews) · view/borrow action.
- **States:** default · borrowable (seeds a new brew) · empty.
- **Used in:** Community section, Library.
- **Folder:** `/Cards`

---

## B · Primitives & Structural

### 10. Section Header
- **Responsibility:** Label and frame each section — the "where am I / why" line.
- **Anatomy:** index/tag · section name · optional weight/state indicator · optional supporting line.
- **States:** default · active · completed (collapsed summary) · locked.
- **Used in:** every section, everywhere.
- **Folder:** `/Layout` (or `/Typography` for the text scale)

### 11. Search Bar
- **Responsibility:** Find an existing coffee, recipe, or origin. *(The workflow entry is now the Brew Intake — this is for search across saved data, not for starting a brew.)*
- **Anatomy:** field · search glyph · placeholder.
- **States:** empty · focused · typing/results · filled.
- **Used in:** Global nav (compact), Library, Community browse.
- **Folder:** `/Cards` (input primitives) · pattern in `/Layout`

### 11b. Field / Select  · primitive
- **Responsibility:** A single labelled input — text field or dropdown select.
- **Anatomy:** label above · control (text field or select with chevron) · placeholder / value.
- **Variants:** text field · select (dropdown) · (future: number, toggle).
- **States:** empty (placeholder) · focused (accent ring) · filled · disabled.
- **Used in:** Brew Intake attribute grid; any future form.
- **Folder:** `/Cards` (controls)

### 12. Navigation
- **Responsibility:** Move between the five destinations — nothing more.
- **Anatomy:** logo · primary destinations (Dashboard · Brew · Library · Community · Settings) · profile/avatar.
- **States:** default · active destination · mobile (collapsed hamburger).
- **Used in:** App shell, persistent.
- **Folder:** `/Layout`

### 13. Button
- **Responsibility:** Trigger an action.
- **Anatomy:** label · optional leading/trailing marker.
- **Variants:** primary · ghost/secondary · block (full-width) · icon-only (later).
- **States:** default · hover · active · disabled · loading.
- **Used in:** everywhere.
- **Folder:** `/Cards` (controls) — a true primitive

### 14. Chip
- **Responsibility:** A selectable option (a choice the user makes).
- **Anatomy:** selectable marker (radio/checkbox) · label.
- **Variants:** single-select · multi-select · preset (goal chips).
- **States:** unselected · selected · disabled.
- **Used in:** Extraction Goal presets (on the Radar), filters.
- **Folder:** `/Cards`

### 15. Tag
- **Responsibility:** A non-interactive descriptor / label (read-only metadata).
- **Anatomy:** short label, optional dot/marker.
- **Variants:** flavour tag · status tag · category tag.
- **States:** default only (display element — distinct from Chip, which is selectable).
- **Used in:** Bean Card flavour notes, statuses, match labels.
- **Folder:** `/Typography` / `/Cards`

---

## Chip vs Tag — the distinction

- **Chip = a decision.** Interactive, has selected state, changes app state (e.g. goal presets).
- **Tag = a fact.** Read-only, describes something (e.g. "Melon", "Kiwi", "best match").

Keeping them separate prevents the classic drift where every label becomes vaguely clickable.

---

## Composition Map

```
Navigation ─ Search Bar ─ Section Header ─ Button ─ Chip ─ Tag ─ Field/Select   ← primitives, used everywhere
        │
        ├─ Brew Intake ── Field/Select ×8 ── Button  (New Brew section) ──▶ builds ──▶
        ├─ Bean Card ──── AI Analysis Card        (Coffee section)
        ├─ Extraction Radar ── Chip (presets)     (Radar section)
        ├─ Strategy Context ── Recipe Card ── Equipment Card   (Recipe section)
        ├─ Feedback Card ──── Diagnosis Card       (Reflection section)
        └─ Community Card ×3                        (Community section)
```

Cards compose from primitives; sections compose from cards. Nothing reaches across a boundary — the precondition for a real component library.

---

*17 components (incl. Brew Intake + Field/Select). Anchors carry weight; primitives carry consistency. Build specs per folder next.*
