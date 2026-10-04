# Brew Helper — Master Experience Architecture

**Status:** Canonical plan. Consolidates the former Master Design Plan and Filter Brew Flavour Experience plan.

**Current instruction:** Build the architecture and design handoff only. Do not generate assets, redesign the interface, or remove/alter any functional dashboard behaviour.

## 1. The product

Brew Helper is a functional barista dashboard experienced as an immersive filter-coffee journey.

It opens at a beautiful Japanese café window overlooking a flowing river and sakura trees. A Glitch-inspired filter station is the visual focus: Origami dripper, visible coffee bed, stand, metal ice ball, and carafe below. The experience advances with the brewer's real workflow, ending in a flavour-wheel-led reflection.

The visual layer serves the brew session. It must not conceal, replace, or simulate the dashboard's real inputs, recommendations, timer, reflection, or diagnosis.

### Product promise

**Tell Brew Helper what is on the bar, choose what you want from the cup, receive one usable plan, brew it, describe it, and learn what to change next.**

## 2. Document architecture

| File | Authority | Role |
|---|---|---|
| `Product-Contracts.md` | Functional truth | Defines valid state, equipment constraints, one-plan recommendation, and learning boundaries. It is not replaced by this document. |
| `Brew-Helper-Master-Design-Plan.md` | Experience architecture | This document. It governs the immersive dashboard, scene sequencing, functional preservation, asset contracts, and future design handoff. |
| `Filter-Brew-Flavour-Experience-Build-Plan.md` | Superseded | Retained only as a pointer to this canonical plan, to prevent two directions drifting apart. |
| `/brew-helper-site/index.html` | Current implementation — the single dashboard surface | Functional baseline to preserve. No implementation changes are authorised by this plan alone. |

## 3. Non-negotiable functional guardrails

- The brew lifecycle remains **draft → coffee understood → strategy set → plan generated → brewed → reflected → saved**. Scroll position is never session state.
- Recommendations remain one confident, equipment-compatible, science-gated plan. Do not replace the plan with decorative simulations or generic recipe browsing.
- The brewer's choices and reflection remain the source of truth. Visuals can explain an expected expression, but cannot claim certainty about the cup.
- Recipe Desk is a static, practical companion view. It shows the same committed recipe and session state; it is not a second recommendation system.
- Unknown equipment or inputs remain visibly unknown or assumed.
- No history, community data, saving, timer, or diagnosis is presented as real unless it is already wired and verified.
- The immersive scene layer is progressive enhancement. Every task remains usable without animation, with reduced motion, and on touch devices.

## 4. Existing functional baseline — preserve all of it

The implementation currently provides the following. Every item stays in the product; later visual design decides placement and presentation, not whether it exists.

| Workflow area | Existing function that must remain |
|---|---|
| Global shell | Navigation and access to the dashboard's sections. |
| New Brew | Coffee description; reminder; origin, roast, grinder, grind size, roast age, altitude, process, and roaster inputs; Brew action; saved-recipe quick start when present. |
| Coffee | Coffee name/subtitle; flavour notes; process, age, altitude, roast-level facts; brewing-direction/reasoning disclosure. |
| Extraction Goal | Goal presets; fully interactive six-axis radar; keyboard/pointer adjustment; live priorities; Coach; Generate your plan. |
| Brew Plan / Recipe | One committed plan; strategy and setup context; parameters; step-by-step instructions; per-step Why; full Why this recipe disclosure; Save recipe; Start brew timer. |
| After the Brew | Sweetness, body, acidity, and clarity reflection controls; tasting notes; Diagnose this brew; diagnosis and Apply to next brew. |
| Community | Similar coffees, successful recipe references, and past-cup/personal-history area, each correctly labelled when seeded or unavailable. |

The current dashboard's data, actions, keyboard controls, disclosures, and navigation are the functional regression checklist for any later build.

## 5. Experience topology

The immersive dashboard is one application with two coordinated presentation modes.

```text
Brew session state and existing decision engine
                 │
     ┌───────────┴───────────┐
     │                       │
Immersive Brew           Recipe Desk
scene layer              static companion
     │                       │
background / motion      committed plan, timer,
does not own state        steps, rationale, setup
     │                       │
     └───────────┬───────────┘
                 │
      shared inputs, plan, reflection,
      diagnosis, and accessibility state
```

### Immersive Brew

The primary dashboard. Each workflow section appears in its own full-viewport chapter, with the filter station continuing as the visual anchor. The scene changes only when the relevant session state has been reached.

### Recipe Desk

The practical, static side page. It is always accessible through a clear **View recipe** action and retains the active session. It contains the committed plan, equipment assumptions, parameters, timer, steps, and explanatory disclosures in a stable, low-distraction layout.

- On desktop, it is a dedicated right-side route/view, not an overlay on the active scene.
- On mobile, it is a dedicated full-screen route.
- Returning to Immersive Brew restores the same active session and workflow location.

## 6. Scene sequence — driven by the brewing journey

These are architecture-level scene contracts. They specify *when* the environment changes and what it must communicate; they do not specify final art, images, animation curves, or layouts.

### Prologue — café window and Glitch-inspired filter station

**Session condition:** no active brew yet.

**Functional content:** entry into the dashboard; no brew information is hidden behind the scene.

**Scene contract:** Japanese café window, flowing river, sakura trees, and one filter station in focus: Origami filter with coffee grounds, stand, metal ice ball, and carafe below.

**Entry interaction:** when the user chooses to begin, a small number of coffee beans appear briefly. They fall, convert into **coarse filter grounds**, and settle as a level bed inside the Origami filter. This completes before New Brew becomes active.

**Boundary:** this is a short, intentional opening transition—not a substitute for form submission and not an autoplay loop.

### Step 1 — What are you brewing today?

**Session condition:** draft.

**Functional content preserved:** all New Brew inputs, saved-recipe quick start, Brew action, validation, and any existing session-draft behaviour.

**Scene contract:** the settled, dry bed of coarse coffee grounds is the consistent visual background/anchor.

**Meaning:** the brewer has ingredients and possibility, but has not yet introduced water or chosen a direction.

### Step 2 — Coffee card

**Session condition:** coffee understood.

**Functional content preserved:** coffee facts, flavour-note chips, roast/process/age/altitude information, and coaching/reasoning disclosure.

**Scene contract:** hot water begins dripping into the Origami filter and the bed blooms.

**Meaning:** coffee information becomes an informed starting point for the brew. The bloom communicates awakening and potential; it does not predict a finished flavour.

### Step 3 — Extraction Goal

**Session condition:** strategy set.

**Functional content preserved:** goal presets, fully editable radar, live priorities, Coach, and Generate your plan.

**Scene contract:** a brewing kettle continuously pours into the Origami filter while coffee drips into the carafe below.

**Meaning:** the brewer's extraction intent is active. Changes in the radar may influence restrained scene accents, but the radar remains the only control that sets intent.

**Boundary:** the pour is an ambient, state-aware loop with a still/reduced-motion equivalent. It must not distract from manipulating the radar or imply that a user has started the real timer.

### Step 4 — Brew Plan / Recipe

**Session condition:** plan generated.

**Functional content preserved:** committed recipe, strategy, parameters, setup assumptions, steps, Why disclosures, Save recipe, and Start brew timer.

**Scene contract:** a finished carafe of filter coffee is present and visually settled.

**Meaning:** the plan is ready to follow. The scene becomes calmer so practical recipe reading and timing take priority.

**Recipe Desk handoff:** View recipe opens the static companion route with exactly this plan and no loss of timer/session state.

### Step 5 — After the Brew and beyond

**Session condition:** brewed → reflected → saved, as applicable.

**Functional content preserved:** sensory controls, notes, diagnosis, apply-to-next-brew, personal history, and community/reference surfaces.

**Scene contract:** the flavour wheel becomes the primary visual system. It may animate in response to reflection and diagnosis, beginning broad and allowing the barista to name more specific sensations over time.

**Meaning:** the visualisation moves from how the brew was made to what the cup actually gave the brewer.

**Boundary:** the reflection remains authoritative. The wheel must distinguish any pre-brew expected expression from the brewer's observed cup and must never overwrite the barista's notes.

## 7. Flavour-wheel architecture

The wheel is a sensory vocabulary interface, not a scoring chart or a recipe generator.

### Two layers

| Layer | Source | Purpose | Required language |
|---|---|---|---|
| Expected expression | Coffee facts, stated equipment, chosen Extraction Goal, committed plan | Gives the brewer something to notice during tasting | “This plan is designed to explore…” |
| Observed cup | Reflection controls and barista notes/selections | Records what the barista actually experienced | “What the cup gave you” |

The original hierarchy remains available: broad family at the centre, category in the middle, precise descriptor at the rim. All selection paths must work by tap and keyboard as well as hover.

## 8. System boundaries

### State and scene ownership

- The existing app/session engine owns intake, intent, plan generation, brewing status, reflection, diagnosis, and persistence.
- The scene engine receives a read-only representation of the current session state and produces an appropriate background/transition.
- The scene engine does not submit forms, change radar values, start a timer, save a recipe, or diagnose a cup.
- A scene never advances merely because the user scrolled; it advances because the workflow state allows the corresponding section to appear.

### Asset ownership

Joseph supplies or approves all static images, renders, and image-sequence frames. Until then, the system uses named placeholders only. No image generation, invented URLs, or copied third-party imagery are authorised.

| Placeholder | Future asset purpose |
|---|---|
| `{{IMG_JAPANESE_CAFE_WINDOW_HERO}}` | Café window, river, sakura, and opening filter station |
| `{{SEQ_BEANS_TO_ORIGAMI_BED}}` | Beans → coarse grounds → level Origami filter bed |
| `{{IMG_ORIGAMI_BLOOM_STATE}}` | Coffee card bloom state / reduced-motion equivalent |
| `{{SEQ_EXTRACTION_POUR_STATE}}` | Extraction Goal kettle-pour and carafe-drip state |
| `{{IMG_FINISHED_FILTER_CARAFE}}` | Brew Plan settled-carafe state / Recipe Desk context |
| `{{SEQ_FLAVOUR_WHEEL_REFLECTION}}` | Post-brew flavour-wheel reveal and reflection state |

### Accessibility and performance

- Every scene has a static key-frame equivalent and respects `prefers-reduced-motion`.
- Functional content, forms, and focus order remain standard document/UI elements above the visual scene implementation.
- The timer remains legible and usable independent of scene rendering.
- Animation loading never blocks Brew, Generate your plan, View recipe, Start brew timer, Diagnose, or Apply to next brew.
- Touch users receive tap-friendly controls; no essential information is hover-only.

## 9. Future implementation sequence — architecture first

1. **Functional map:** map every existing control, action, state transition, and route to the preserved-flow checklist above.
2. **Scene state adapter:** define a small, read-only contract from brew session state to scene state: `opening`, `draft-bed`, `coffee-bloom`, `goal-pour`, `plan-carafe`, `reflection-wheel`.
3. **Recipe Desk route:** establish the static companion route/view and shared session continuity before any animation work.
4. **Scene shells:** add empty, named scene containers and placeholder states only. Do not alter dashboard functionality.
5. **Asset handoff:** Joseph provides approved static assets and sequences matching the asset contract.
6. **Progressive enhancement:** connect one scene at a time, retaining static fallbacks and running the regression checklist after every scene.
7. **Wheel integration:** attach the flavour vocabulary layer only after reflection inputs and notes are confirmed to retain their current behaviour.

## 10. Acceptance checklist for later design/build work

- A brewer can complete the entire current workflow with animation disabled.
- Every existing input, radar interaction, recipe action, reflection action, diagnosis action, and community/reference surface remains reachable and functional.
- Scene progression follows brew-session state, not visual scrolling.
- The Beans → Grounds → Origami-bed transition appears only at intentional entry and does not delay or replace New Brew.
- The Coffee, Extraction Goal, Recipe, and After Brew scenes match the exact stage mapping above.
- Recipe Desk always reflects the one active committed plan and retains timer/session state.
- The flavour wheel preserves the difference between expected expression and observed cup.
- No unapproved images, animation frames, third-party visual copies, or fabricated user history ship in the experience.

## 11. Explicitly deferred until Joseph directs otherwise

- Final visual design, scene composition, copywriting, typography, colours, audio, animation curves, and frame counts.
- Any changes to existing dashboard code, data model, recommendation engine, timer implementation, persistence, or community functionality.
- Creation or selection of image assets and motion frames.
