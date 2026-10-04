# Brew Helper — Layout Rationale

**Companion to:** `Brew-Helper-Wireframe-v2.html` · reference build `/brew-helper-site/index.html` (the single dashboard surface)
**Model:** 6 sections. Grayscale, box-only, pre-visual-design.
**Product truth:** `Product-Contracts.md` — layout never implies a capability the engine does not provide.

> Test: *if it works in grayscale, it works after styling.* Optimise cognitive flow, not decoration.

---

## 1. Did each section earn its place? (10 → 5 → 6)

Every original section was interrogated — *own scroll block, or a state/panel of a neighbour?* — and merged to five. A product decision then **added a dedicated intake step** so baristas log the coffee themselves.

| Section | Verdict | Rationale |
|---|---|---|
| **New Brew** | **added** | Baristas supply the coffee — a structured intake, not a search. Absorbs the old Hero. |
| Coffee Overview | **keep** | Completed card built from intake |
| AI Bean Analysis | **merge** | "AI read" disclosure inside Coffee |
| Extraction Goal | **merge** | Preset chips on the Radar |
| Extraction Radar | **keep** | The pivot |
| Recipe Recommendations | **keep** | The committed plan |
| Recipe Details | **merge** | Progressive detail of that plan |
| Brew Debrief | **keep** | The observation input |
| AI Diagnosis | **merge** | Output panel of Reflection |
| Community (+ Learning) | **keep** | Light reference; absorbs history |

**Result: New Brew · Coffee · Radar · Recipe · Reflection · Community.** Merges stay state-based (empty→filled, input→output, disclosure); the only *addition* is the intake, which is functional weight, not an anchor.

---

## 2. Grid & Spacing

- **Desktop** — 12-col, max 1160px, gutters 24px.
- **Tablet** — 8-col, 768px, gutters 20px. Intake attributes 4-up → 2-up. 3-up blocks → 2-up. Radar stacks.
- **Mobile** — 4-col, fluid to 390px, gutters 16px. Single column; intake attributes 1-up; one recipe plan fills the width; search → hamburger.
- **Vertical rhythm** — ~96px between sections. 8px spacing scale everywhere.
- **Alignment** — one left edge; section index chips stack into an implicit progress spine.

---

## 3. Relative Weight

| Weight | Sections | Treatment |
|---|---|---|
| **★ Primary** | **Radar** | Largest, 2px border, presets + radar + readout |
| **Anchor** | **Coffee**, **Recipe** | Coffee = completed card; Recipe = one committed plan with progressive detail |
| **Support** | **Reflection** | Standard card, two panels |
| **Functional / light** | **New Brew**, **Community** | Intake = calm form that recedes after Brew; Community = compact 3-up lists |

Intake opens the flow but doesn't compete: it's a single focused input plus attributes, then it hands off. The three anchors (Coffee, Radar, Recipe) still own the eye.

---

## 4. Section Layout Notes

- **New Brew** — one large description field on top (the headline question made literal), a reminder line that tasting notes are the user's own, then an 8-field attribute grid (origin, roast level, grinder, grind size, roast age, altitude, process, roaster), and a single **Brew** action. Form stays calm: labelled fields, generous spacing, one primary button.
- **Coffee** — completed Bean Card (media-left / facts-right) built from intake, with a collapsed "AI read." Facts before interpretation.
- **Radar** — preset chip row, then radar beside a live readout. Cause and effect side-by-side. Max weight, the page's pivot.
- **Recipe** — judgement + strategy + assumed gear → one committed plan → expandable steps, WHY on demand. A quiet safety/assumption note appears only when relevant.
- **Reflection** — sliders + notes (no stars) → divider → diagnosis panel with a next-brew checklist and a "loops to radar" tag.
- **Community** — three compact lists (similar / successful / your previous brews). Lowest weight.

---

## 5. Component Boundaries (future cards)

| Component | Section | Reuse |
|---|---|---|
| `BrewIntake` (field grid + `Button`) | New Brew | New brew, "log a brew" from history |
| `CoffeeCard` (+ `AiReadPanel`) | Coffee | Library, search results, community |
| `RadarCard` (+ `GoalPresets`) | Radar | Signature interactive component |
| `RecipeCard` / `RecipeStepsPanel` | Recipe | Recommendations, community, history |
| `ReflectionCard` (`DebriefPanel` + `DiagnosisPanel`) | Reflection | Re-tasting a past brew |
| `CommunityColumn` / `HistoryList` | Community | List primitive across reference surfaces |

Each renders in isolation from its own data — ready for the design-system "LEGO box."

---

## 6. Self-Critique (what to watch)

- **Intake length.** Eight attributes could feel like a form wall — the anti-pattern the product avoids. Mitigations: attributes are optional (Brew works with just the description), the grid is calm and 4-wide, and the field labels do the teaching. If it still reads heavy, collapse advanced attributes (altitude, roaster) behind a "more details" disclosure.
- **Two openings risk.** New Brew (intake) and Coffee (result) sit back-to-back and both concern the bean. Kept distinct because one is *input* and one is *understanding* — but they must feel like cause→effect (press Brew, the card assembles), not two coffee sections. The reveal/scroll transition carries that.
- **Length overall.** Six sections plus progressive disclosure means the *effective* page during planning is New Brew → Coffee → Radar → Recipe; Reflection and Community stay locked until relevant.
- **Radar readout redundancy.** Keep the live readout only if it adds specifics the shape can't convey.
- **Community weight.** Confirm it reads as reference, not instruction — the AI stays the authority.

Net: sound and grayscale-legible at six sections. The intake is the only new weight; keep it calm and it earns its place as the true entry point.

---

*Layout is intentional before styling. Visual design proceeds from here.*
