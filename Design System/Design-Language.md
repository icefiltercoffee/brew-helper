# Brew Helper — Design Language

**Type:** The complete visual language · master reference
**Reference implementation:** `/brew-helper-site/index.html` — the single dashboard surface (every token below lives in its `:root`; the live style-guide appendix renders at `#system`)
**Governed by:** `Visual-Principles.md` · `../References/UI_Personality.md`
**Token detail:** `/Colors`, `/Typography`, `/Layout`, `/Cards`, `/Charts`

> The dashboard is the reference implementation. This document is the written spec behind it. If the two ever disagree, the dashboard wins — then update this doc.

---

## 1. The Feeling (north star)

A warm café with morning sunlight. A premium Japanese coffee bar. An Apple Pro app. A conversation with a World Brewers Cup champion.

**Not** Excel, Power BI, Bloomberg, hospital software, or generic SaaS. Closer to Apple · Linear · Arc · Leica than Tableau.

Every decision serves five feelings: **precision, craftsmanship, intelligence, calmness, confidence.**

---

## 2. Colour Palette

Warm neutrals carry the interface. **One** accent means "interactive." Semantics are muted and coffee-adjacent — colour is reserved for meaning, never decoration.

| Role | Token | Hex | Use |
|---|---|---|---|
| Paper (bg) | `--bg` | `#F6F1E9` | Page — warm morning light |
| Sunk bg | `--bg-sunk` | `#EFE7DA` | Recessed zones, appendix |
| Surface | `--surface` | `#FDFBF7` | Cards |
| Inset | `--surface-2` | `#F3ECE0` | Inner blocks, rails |
| Border | `--border` | `#E7DDCC` | Hairline separators |
| Border strong | `--border-strong` | `#D9CDB8` | Control borders, emphasis |
| Ink | `--ink` | `#2B2620` | Primary text (warm espresso) |
| Ink-2 | `--ink-2` | `#6A6055` | Secondary text |
| Ink-3 | `--ink-3` | `#9B8F80` | Labels, microcopy |
| **Accent** | `--accent` | `#B65E36` | Interactive — roasted terracotta |
| Accent strong | `--accent-strong` | `#9C4E2A` | Hover / pressed |
| Accent soft | `--accent-soft` | `#F0DED0` | Tints, fills |
| Sage | `--sage` | `#6E7A5A` | Secondary / calm positive (café plants) |
| Success | `--success` | `#5F7A52` | Positive / applied |
| Warning | `--warning` | `#BE8A2E` | Caution — ochre |
| Info | `--info` | `#4E6E7C` | Neutral information — muted slate |

**Rules.** Accent is the only colour a user should read as "I can touch this." Semantic colours appear only with meaning (a challenge, a success, a caution) and always at low saturation. Grayscale-proof first: every layout must hold up with colour removed — colour *enhances* hierarchy, never *creates* it.

Full detail → `/Colors/Color-System.md`.

---

## 3. Typography Scale

Editorial pairing: **Fraunces** (serif) for warmth and hierarchy; **Inter** (sans) for everything functional. Hierarchy is carried by type, not colour.

| Token | Font / weight | Size / line | Use |
|---|---|---|---|
| Display | Fraunces 500 | 36–52 / 1.04 | Hero moments, big numbers-as-words |
| H1 | Fraunces 500 | 28–34 / 1.12 | Section anchor titles, coffee names |
| H2 | Fraunces 500 | 24 / 1.2 | Card / sub-section titles |
| H3 | Inter 600 | 18 / 1.35 | In-card headings |
| Body | Inter 400 | 16 / 1.6 | Reading text |
| Support | Inter 400 | 15 / 1.55 | Secondary copy (`--ink-2`) |
| Label | Inter 600 | 11.5 / caps, .11em | Eyebrows, field labels (`--ink-3`) |
| Micro | Inter 400 | 12.5 | Captions, attributions |

Numbers use `tabular-nums`. Letter-spacing tightens on large serif (`-.02em`), opens on labels (`.11em`). Readability over density — always.

Full detail → `/Typography/Type-Scale.md`.

---

## 4. Spacing System

One 4px-based scale, used everywhere. Spacing is a defining characteristic — the calm comes from rhythm.

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96` → tokens `--s1 … --s9`.

- **Sections** breathe at `--s9` (96).
- **Card padding** `--s6` (32) desktop, `--s5` (24) mobile.
- **Grid gutter** 24–32.
- **Within a card**, stack at 16; group at 24.

Spacious without waste: whitespace is proportioned, not sprinkled.

Full detail → `/Layout/Spacing-and-Grid.md`.

---

## 5. Card System

Every major section is a premium reusable card with a shared language.

- **Radius** `--r-lg` (22px); inner elements `--r-md` (16).
- **Padding** 32 (large variant 48 for anchors).
- **Border** 1px `--border` hairline — borders over heavy lines.
- **Elevation** three soft, diffuse steps: `--sh-sm` resting, `--sh-md` hover/focal, `--sh-lg` overlays.
- **Interaction** `.hover` cards lift `translateY(-2px)` + `--sh-md` on hover.
- **Variants** `.focal` (pre-elevated), `.inset` (recessed, no shadow), `.card-pad-lg`.

Card types: Bean, AI Analysis, Extraction Radar, Recipe, Equipment, Feedback, Diagnosis, Community — all inherit the same shell.

Full detail → `/Cards/Card-System.md`.

---

## 6. The Extraction Radar (centerpiece)

Communicates **intent**, not measurements. A hexagon of six sensory axes — Sweetness, Floral, Acidity, Juiciness, Body, Clarity.

- **Elegant & minimal** — hairline rings, thin spokes, a single accent-tinted data polygon.
- **Tactile** — draggable handles (pointer + keyboard); the shape reshapes live.
- **Cause & effect** — every drag updates the live readout, the coach's sentence, and re-ranks the recipes downstream (cosine-similarity match). Adjusting the cup profile is *immediately visible* everywhere it matters.
- **Presets** tween smoothly (cubic ease, 440ms) so a chip choice *animates* into a shape rather than snapping.

Chart principle: editorial, not analytical — no gridline clutter, minimal labels, trend read by shape.

Full detail → `/Charts/Chart-Principles.md`.

---

## 7. Motion Principles

Motion reinforces understanding; it is never decorative. Every animation communicates cause and effect.

- **Easing** `--ease` `cubic-bezier(.32,.72,0,1)` — a physical settle.
- **Durations** fast 130ms (hover/press), base 240ms (reveal), slow 440ms (radar tween, accordion).
- **Card expansion** grows from its origin; **radar** reshapes continuously; **recipe updates** slide their match bars; **section transitions** are smooth-scroll; **hover** lifts; **loading** breathes.
- **Reduced motion** respected — all transitions collapse to ~0 under `prefers-reduced-motion`.

---

## 8. Interaction & Micro-interactions

Polished states for every touchpoint:

- **Hover** — lift + shadow (cards), tint (chips), background (nav).
- **Focus** — visible `--ring` (3px accent glow) on every interactive element; keyboard-complete.
- **Selection** — chips fill accent; the committed recipe plan carries the focal elevation; its safety or assumption note appears only when meaningful.
- **Dragging** — handles/knobs enlarge and switch to `grabbing`.
- **Saving** — button press-scale → toast confirmation.
- **Loading** — a reasoning orb + "Reading your notes…", not a generic spinner.
- **Completion** — toast + smooth scroll back to the looped step.

Targets are ≥ ~40px; the interface feels alive without feeling busy.

---

## 9. Empty & Loading States

- **Empty** is intentional: "No brews logged yet — your first debrief lands here," with a clear next action. Never a blank void.
- **Loading** communicates *reasoning*: the AI "reads your notes" with a warm orb and skeleton shimmer, signalling thought rather than wait.

---

## 10. AI Communication

AI content is conversational and coaching, per `UI_Personality.md`. Every recommendation carries three things:

1. **Why** it exists ("your radar leans into clarity…"),
2. the **trade-off** it introduces ("…a lighter mouthfeel"),
3. the **outcome** it targets ("…a clean, articulate cup").

Sensory language, second person, no hedging, never blame. "That's under-extraction" — not "you under-extracted."

---

## 11. Responsiveness

Hierarchy is preserved across breakpoints — never a naive vertical stack.

- **Desktop** (>900) — radar and readout side-by-side; recipes 3-up; bean 2-col.
- **Tablet** (≤900) — radar stacks over readout; recipes 2-up; AI blocks stack; bean tightens.
- **Mobile** (≤640) — single column; nav search → hamburger; recipes become a horizontal snap rail; cards shrink padding and radius. The three anchors still lead.

---

## 12. Accessibility

- Readable contrast (ink on paper clears AA; accent-on-white for text only at weight).
- Full keyboard path: chips, radar handles, sliders, recipe cards, accordions — all focusable and operable (arrow keys adjust radar/sliders).
- Visible, consistent focus ring everywhere.
- Semantic headings (h1→h3), ARIA on radar (`role="slider"`), sliders, and toggles.
- Large targets, generous spacing.

Premium and usable are not a trade — restraint serves both.

---

## 13. Rationale — the decisions that matter

- **Terracotta, not blue.** The single accent comes from coffee itself, so "interactive" feels native to the product, not borrowed from generic tech.
- **Serif for hierarchy.** Fraunces gives warmth and rank that a sans can't, letting us carry hierarchy with type instead of colour or weight-spam.
- **Whitespace as identity.** The 96px section rhythm is the calm — it's what stops the page reading as a dashboard.
- **Radar as verb.** Making it draggable and downstream-reactive turns a chart into the product's core interaction — intent you can *feel*, with visible consequences.
- **Merges via state, not deletion.** AI read is a disclosure; diagnosis reveals on submit; recipe detail expands on select. Fewer sections, nothing lost.
- **Grayscale-first.** The whole system was proofed in grayscale (see the wireframes) before a drop of colour — so colour is doing meaning-work, not rescue-work.

---

*This is the language. The dashboard speaks it fluently; every new screen must too.*
