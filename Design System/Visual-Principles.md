# Brew Helper — Visual Principles

**Type:** Creative brief · the reference every design decision answers to
**Reads with:** `UI_Personality.md` (References), `Component-Inventory.md` (Design System)
**Stage:** Visual design begins here — structure is already fixed by the wireframes.

> This document sets *direction and rules*, not final tokens. Colours, type scale, and spacing values are defined later in `/Colors`, `/Typography`, `/Layout` — and must obey the principles below.

---

## 1. The One-Line Brief

**A calm, premium brewing companion that feels like a World Brewers Cup coach — quietly confident, editorial, tactile. Never dashboard-y, never noisy.**

If a screen feels like analytics software, it has failed. If it feels like a well-made specialty coffee guide someone hands you, it has succeeded.

---

## 2. Visual Hierarchy (the spine of every layout)

Three elements carry the product. Everything else supports them.

| Rank | Element | Why it leads | Visual treatment |
|---|---|---|---|
| **1** | **Coffee Overview** | The subject. Every session is *about this bean* — it grounds the user before anything else. | Strong entry weight, generous space, imagery-ready. The first thing the eye lands on. |
| **2** | **Extraction Radar** | The pivot. Where intent becomes strategy; the signature interaction. | The heaviest interactive moment. Center-stage, most detail, most affordance. |
| **3** | **Ideal Recipe (Recommendation)** | The payoff. The reason the user came — a plan they can act on. | Prominent, confident, clearly the "answer." One recommendation leads. |

**Supporting cast** (AI Analysis, Recipe comparison detail, Equipment, Feedback, Diagnosis, Community, all primitives): present, legible, never competing. They orbit the three anchors.

**Rule:** on any screen, one of the three anchors owns the primary focal point. Support elements must be visibly lighter — less weight, less contrast, less space. If everything is emphasised, nothing is.

---

## 3. Design Principles

**1 · Calm over dense.** Whitespace is a feature, not wasted space. The premium feeling comes from restraint. When in doubt, remove.

**2 · One focal point per view.** The eye should always know where to look. Guide it with weight and space, not arrows or colour-shouting.

**3 · Progressive disclosure.** Show what's relevant now; tuck the rest behind expansion. A calm surface with depth on demand beats a full surface.

**4 · Editorial, not enterprise.** Think specialty-coffee magazine or a premium product page — considered typography, real hierarchy, breathing room — not a KPI console.

**5 · Tactile and physical.** Coffee is sensory. Surfaces, materials, and imagery should feel touchable. The radar and sliders should feel like instruments, not form fields.

**6 · Confident, not chatty.** The UI states things plainly. A coach doesn't hedge. Fewer words, more certainty.

**7 · Consistency is calm.** One spacing scale, one type scale, one card language everywhere. Repetition creates the sense of a considered system.

**8 · Grayscale-first proof.** Every layout must work in grayscale before colour is added. Colour enhances hierarchy; it never creates it.


Feeling: Premium, calm, crafted, intelligent
Avoid: Enterprise software, Bootstrap aesthetics, Dense analytics, Bright gradients, Heavy glassmorphism, Visual noise

---

## 4. Aesthetic Direction (mood, not final spec)

**Overall:** warm-neutral, premium, quiet. Closer to a boutique roaster's brand than a SaaS dashboard.

- **Colour mood:** predominantly neutral (paper, warm off-white, soft charcoal) with a single restrained accent used sparingly for the active/interactive state — likely drawn from coffee itself (a warm brown/amber family) rather than generic tech-blue. Colour is an accent, not a coat of paint. *(Exact palette → `/Colors`.)*
- **Typography mood:** editorial pairing — a characterful display/serif for anchors and coffee names (personality, warmth) against a clean, highly legible sans for data, labels, and controls. Strong size contrast between headline and body. Excellent readability. *(Scale → `/Typography`.)* 
- **Shape & surface:** soft, generous radii; low, diffuse elevation; hairline separators over heavy borders. Nothing sharp or clinical.
- **Imagery:** real, tactile coffee photography (beans, bags, brews) treated consistently. Placeholders in wireframes; never stock-clip energy.
- **Data viz (radar, sliders, meters):** instrument-like and elegant, not chart-junk. Thin strokes, clear labels, one accent for the active reading.
- **Motion:** subtle and physical — ease, settle, reveal. Supports disclosure; never decorative. (Defined later; out of wireframe scope.)
- Layout: Large whitespace, Comfortable spacing, Clear hierarchy, Card-based, One focal point per section
- Cards: Soft radius, Thin to no borders, Minimal shadows, Large padding
- Interactions: Smooth, purposeful, never distracting.

---

## 5. What This Product Is NOT

To keep the brief sharp, explicit anti-patterns:

- ❌ Not a metrics dashboard — no KPI tiles, gauges-for-gauges'-sake, or data walls.
- ❌ Not neon/gamified — no badges-everywhere, progress confetti, or loud gradients.
- ❌ Not maximal — no competing focal points, no "everything above the fold."
- ❌ Not generic-tech — no default blue, no stock SaaS card grid, no clip-art icons.
- ❌ Not chatty — no long helper paragraphs where a confident line will do.

---

## 6. How to Use This Brief

Before shipping any visual, check it against these:

1. Does one of the three anchors clearly own the view? (Hierarchy)
2. Would it still read in grayscale? (Structure before colour)
3. Is there enough space to feel calm and premium? (Restraint)
4. Does it sound like a confident coach, not software? (Voice — see `UI_Personality.md`)
5. Is anything on screen that could be disclosed on demand instead? (Progressive disclosure)

If all five pass, it's on-brief.

---

*Direction is set here. `/Colors`, `/Typography`, `/Layout`, `/Cards`, `/Charts` implement it.*
