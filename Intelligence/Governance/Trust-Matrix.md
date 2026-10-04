# System 2 — Trust Matrix

**Purpose:** the permanent editorial policy for *how much any piece of evidence counts*. No source is assumed equal. This is the platform's quality-control constant.
**Implemented by:** the Ingestion Pipeline's scoring and the Evidence Synthesiser (M3) — they **obey** this policy; they don't redefine it.

> Principle: **science sets the boundaries; practice fills them; consensus and freshness adjust the volume.**

---

## 1. The weighting framework

Every claim gets a **trust score (0–1)**:

```
trust = base × relevance × freshness × consensus
```

| Factor | Range | From |
|---|---|---|
| **base** | tier + credibility → 0.55–0.95 | Source Registry (`tier`, `credibility`) |
| **relevance** | 0.4–1.0 | match of source `expertise` to the current question (a grinder claim from a water chemist scores low) |
| **freshness** | 0.7–1.0 | Registry `freshness` + recency; decays if unverified |
| **consensus** | 0.85–1.15 | agreement with other independent sources (convergence boosts; isolation slightly discounts) |

**Base by tier** (midpoints; `credibility` fine-tunes within band):
A ≈ 0.85 · B ≈ 0.68 · C ≈ 0.55. A Tier-C source **cannot exceed ~0.6** no matter the topic — it corroborates, never originates.

**Category rules (editor overrides):**
- **World Brewers Cup championship recipes → credibility 88, Tier A** (parity with Kasuya), for any competitor. A championship routine is treated as top-practice evidence regardless of who ran it.
- Editor-in-chief (Joseph) may override any individual source's tier/credibility; overrides are recorded in the registry entry's `philosophy`/notes (e.g. Hoffmann down-weighted to publication tier).

`avoid_when` is a **hard gate**: if the task matches a source's avoid condition, the claim is dropped (not scored).

---

## 2. Confidence levels (what the score means)

| Level | Trust band | Meaning / use |
|---|---|---|
| **High** | ≥ 0.80 | Lead the recommendation on it; state plainly. |
| **Medium** | 0.60–0.79 | Use, but hedge slightly / seek corroboration. |
| **Low** | 0.45–0.59 | Corroboration only; never the sole basis. |
| **Provisional** | < 0.45 | Not used in a recommendation; flag as "worth testing." |

These map 1:1 onto the engine's confidence output and the "definition of done" gate.

---

## 3. Science vs practical experience (the core rule)

They are **different kinds** of evidence and never averaged:

- **Science = constraints (a gate).** First-principles/peer-reviewed claims define what is *physically possible*. They can **veto** a practical claim that violates the extraction curve. (This is the Coffee-Science layer / M2 science gate.)
- **Practice = evidence (weighted).** Champion routines, roaster guides, practitioner technique fill in *what works within* those boundaries. They are scored by the framework above.

**Interaction:**
1. Practice that stays *within* science → weighted normally.
2. Practice that *contradicts* science → **science wins**, unless the practice has strong convergent evidence (≥3 independent A/B sources), in which case it is **not adopted but flagged for research** — a signal the science model may be incomplete.
3. Science is silent on many practical choices (pour geometry, agitation feel) → practice leads there, unconstrained.

> Rule of thumb: *science says what you can't do; practice says what's worth doing.*

---

## 4. Handling conflicting opinions

Never average conflicting practical claims into mush. In order:

1. **Context-collapse check** — most conflicts are different coffees/methods. Split into **conditional** guidance (`applies_when`), not a compromise. (e.g. "hotter for dense light roasts" vs "cooler for fragile naturals".)
2. **Weigh** by trust score: higher tier → mechanism-given → reproducible → convergent wins.
3. **Explain-why beats assert:** a source that gives a mechanism outranks one that only states a number, at equal tier.
4. **Unresolved genuine dispute** → keep the higher-trust side at **reduced confidence** with a `debate` note; surface both in the evidence panel.
5. **Outcomes are the tie-breaker:** the user's own successful brews (brew-log evidence) override contested external claims *for that user*.

---

## 5. Freshness & decay

- Registry `freshness`: `evergreen` (science/standards — no decay), `active` (recent, full weight), `dated` (discounted).
- A source not re-verified in the quarterly audit loses ~0.05 trust per lapsed quarter until re-checked.
- Fast-moving areas (equipment, processing trends) decay faster than fundamentals (extraction physics).

---

## 6. Why this lifts quality

Consistent, explicit scoring makes every recommendation **reproducible** (same evidence → same weight), **transparent** (the evidence panel reflects real trust, not guesswork), and **safe** (science can always veto). It is the difference between "the AI read something online" and "the AI weighed the field like an editor."

*The Trust Matrix is the constant. Sources change, playbooks evolve — the scale stays the same.*
