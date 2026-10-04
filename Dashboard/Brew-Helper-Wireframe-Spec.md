# Brew Helper — Structural Wireframe & Information Architecture

**Type:** Pre-UI UX specification (structure only)
**Model:** 6 sections — an intake step, then 5 consolidated stages
**Scope:** hierarchy, flow, IA. No colour, type, icon, motion, or branding.
**Product truth:** `Product-Contracts.md` — section states and outputs must honour these contracts.

> Structure only. Every section becomes a reusable card in the visual phase.

---

## 0. Premise

Brew Helper is a **coaching conversation**, not analytics — a World Brewers Cup coach walking the user through a session, one question at a time. Three rules:

1. **One question per section.**
2. **Progressive disclosure** — nothing downstream appears until the decision that gives it meaning is made.
3. **Always oriented** — the user can always answer *where am I / what next / why*.

The product is one vertical workflow, descended once per brew.

---

## 1. Consolidation history (10 → 5 → 6)

The original 10 sections were interrogated and merged to 5 (see §2). A later product decision **added an explicit intake step** — *New Brew* — in front of Coffee Overview, so the barista enters the coffee themselves rather than searching a catalogue. Net model: **6 sections.**

| Original | Verdict | Now lives as |
|---|---|---|
| — | **added** | **New Brew** — structured intake (typed description + attributes) |
| Hero | merge | Folded into **New Brew** (the entry question) |
| Coffee Overview | **keep** | **Coffee** — completed card, built from intake |
| AI Bean Analysis | merge | "AI read" disclosure inside **Coffee** |
| Extraction Goal | merge | Preset chips on **Radar** |
| Extraction Radar | **keep** | **Radar** (pivot) |
| Recipe Recommendations | **keep** | **Recipe** (one committed plan) |
| Recipe Details | merge | Expanded state of the committed **Recipe** |
| Brew Debrief | **keep** | **Reflection** (input) |
| AI Diagnosis | merge | Response panel of **Reflection** |
| Community (+ Learning) | **keep** | **Community** |

**Result: New Brew → Coffee → Radar → Recipe → Reflection → Community.**

The Hero's "What are we brewing today?" is now the intake's headline. Because the barista supplies the coffee, entry is a **structured form**, not a search.

---

## 2. Page Hierarchy

Five destinations; only **Brew** is a workflow.

```
Brew Helper
├── Dashboard   (flat)  — landing / entry into a brew
├── Brew        (WORKFLOW) — the spine
│   ├── 01 New Brew      (intake: describe + attributes → Brew)
│   ├── 02 Coffee        (completed card + AI read)
│   ├── 03 Radar         ★ pivot (goal presets → priorities)
│   ├── 04 Recipe        (one plan → step details)
│   ├── 05 Reflection    (debrief → diagnosis)
│   └── 06 Community      (similar · successful · your history)
├── Library     (flat)  — saved coffees + brew history
├── Community   (flat)  — full browse
└── Settings    (flat)
```

Community appears twice by design: a contextual section (06) inside Brew, and a standalone destination for open browsing.

---

## 3. Navigation

```
PRIMARY (persistent):  Dashboard · Brew · Library · Community · Settings
SECONDARY (in Brew only, progress not nav):  New Brew → Coffee → Radar → Recipe → Reflect → Community
```

Global nav = which area. Progress rail = where in this brew (tracks scroll, jump-back to done steps, gates locked ones). No orphan pages — every screen is a section of one of the five destinations.

---

## 4. Information Architecture

Three weight tiers so only one thing is ever primary. Intake is functional and lightweight; the three anchors (Coffee, Radar, Recipe) still lead.

| Tier | Sections | Behaviour |
|---|---|---|
| **Primary** | current section — most often **Radar**, **Recipe** | full weight, interactive |
| **Secondary** | Coffee, Reflection | present, subordinate |
| **Functional / light** | New Brew (intake), Community | do their job, then recede |

**Data flow — the Radar is the hinge:**

```
New Brew (typed description + attributes)
      │ Brew → builds
      ▼
Coffee (completed card + AI read)
      │ informs
      ▼
Radar (goal presets + priorities)   ◀── everything above is INPUT to it
      │ drives                          everything below is OUTPUT from it
      ▼
Recipe (one plan → details)
      │ brew, then
      ▼
Reflection (observations → diagnosis) ──┐ adjustments loop back to Radar
      │ store outcome                    │
      ▼                                  ▲
Community (similar · successful · your history)
```

---

## 5. Vertical Flow (the Brew spine)

```
┌───────────────────────────────────────────┐
│ 01 NEW BREW         describe + attributes → Brew │ intake
├───────────────────────────────────────────┤
│ 02 COFFEE           completed card + AI read │ meet + understand
├───────────────────────────────────────────┤
│ 03 EXTRACTION RADAR ★  presets → priorities │ strategy (pivot)
├───────────────────────────────────────────┤
│ 04 RECIPE           one plan → step details  │ plan
├──────── user leaves to brew (break) ────────┤
│ 05 BREW REFLECTION  debrief → AI diagnosis  │ observe + interpret
├───────────────────────────────────────────┤
│ 06 COMMUNITY        similar · best · history │ compare + loop back
└───────────────────────────────────────────┘
```

01–04 = pre-brew (enter, understand, strategise, plan). A real-world break follows. 05–06 = post-brew (reflect + improve). The loop closes when Reflection's adjustments re-seed the Radar.

---

## 6. User Journey

```
Dashboard ─▶ New Brew (log coffee) ─▶ [ Coffee → Radar → Recipe ] ─▶ brew off-app ─▶ [ Reflection → Community ] ─▶ save
                                              ▲                                                    │
                                              └────── "brew it better next time" (re-seed radar) ──┘
```

Coaching arc: log the coffee (New Brew) → meet & understand it (Coffee) → strategy (Radar) → the plan (Recipe) → honest reflection + coaching (Reflection) → belonging & next seed (Community).

---

## 7. Section Spec

Each: **Purpose · Interaction · Input · Output · ← prev · → next.**

### 01 · New Brew — *"What are you brewing today?"*
- **Purpose:** Capture the coffee the barista is about to brew — the structured entry point.
- **Interaction:** Type a free description; set eight attributes — Country of origin, Roast level, Grinder, Grind size, Roast age, Altitude, Process, Roaster; a reminder notes that tasting notes are the user's own to add; press **Brew**.
- **Input:** typed description + attribute selections. **Output:** a structured coffee record.
- **← Prev:** origin. **→ Next:** **Brew** builds and reveals the Coffee card (02).
- *Absorbs the former Hero as its headline. Entry is a form, not a search, because the barista supplies the coffee.*

### 02 · Coffee
- **Purpose:** Present the completed coffee, built from intake, and let the user understand it.
- **Interaction:** Review the Bean Card (attributes rendered as facts + flavour tags); expand "AI read" (strengths / challenges / advice).
- **Input:** the New Brew record. **Output:** an understood bean.
- **← Prev:** assembled by **Brew**. **→ Next:** understanding informs the Radar's goal.
- *Merges Overview (facts) + Analysis (disclosure).*

### 03 · Extraction Radar ★ *pivot*
- **Purpose:** Turn intent into extraction priorities — the control surface.
- **Interaction:** Pick a goal preset (Sweetness / Clarity / Body / Balanced / Floral), then fine-tune the interactive radar; live readout updates. *(Radar visual designed later.)*
- **Input:** goal preset + adjustments. **Output:** a prioritised strategy.
- **← Prev:** seeded by Coffee's understanding. **→ Next:** drives every recipe. The exact midpoint — inputs above, outputs below.
- *Merges Goal (presets) + Radar.*

### 04 · Recipe
- **Purpose:** Present one equipment-compatible, science-gated plan that makes the chosen strategy actionable.
- **Interaction:** Read the judgement and strategy; review the assumed gear, parameters, and expandable steps — each with an on-demand WHY. Save or start the brew.
- **Input:** coffee + setup + radar strategy. **Output:** an executed brew plan.
- **← Prev:** derived from the Radar. **→ Next:** bridges the real-world brew.
- *The plan leads; the detail is progressively disclosed. “Explore approaches” is deferred until the engine can produce genuinely distinct valid strategies.*

### 05 · Brew Reflection
- **Purpose:** Capture what was tasted, then interpret it.
- **Interaction:** Log structured observations (sliders + notes, **no stars**) → on submit, AI diagnosis + next-brew adjustments appear below.
- **Input:** the tasted cup. **Output:** theory-linked adjustments.
- **← Prev:** reflects on the brewed Recipe. **→ Next:** adjustments loop to the Radar; outcome carries to Community/history.
- *Merges Debrief (input) + Diagnosis (output) — same control+readout pattern as the Radar.*

### 06 · Community
- **Purpose:** Surface reference points — similar coffees, successful community recipes, and **your previous brews** (personal history). Complements, never replaces, the AI.
- **Interaction:** Browse; optionally borrow a recipe into a new brew.
- **Input:** current coffee + stored history. **Output:** a seed for the next brew.
- **← Prev:** contextualised by the just-completed brew. **→ Next:** loops to the top.
- *Absorbs the former standalone Learning section as "your previous brews."*

---

## 8. Why the Order Holds

- **New Brew first** — the barista supplies the coffee, so intake precedes everything; nothing downstream exists until "Brew" is pressed.
- **Coffee second** — the completed card is the payoff of intake; facts before interpretation (AI read is a disclosure, so it never front-loads).
- **Radar central** — the hinge. Coffee informs it; Recipe/Reflection/Community express its consequences. Goal folded in as presets so the user tunes rather than starts blank.
- **Recipe after Radar** — the strategy lands as one committed, equipment-compatible plan. Detail is a *state*, not a separate block.
- **Reflection after the brew** — observation before interpretation; diagnosis is the output panel of the same section, so cause and effect sit together.
- **Community last** — widest, least prescriptive, lightest weight; closes the loop by seeding the next brew.

Through-line: **log → understand → strategy → plan → reflect → improve.** Each step is a prerequisite for the next — which is why the flow is linear and no two steps share primary weight.

---

*End of spec. Visual design begins here — not before.*
