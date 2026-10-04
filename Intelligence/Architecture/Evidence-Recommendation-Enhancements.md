# Brew Helper — Evidence-Backed Recommendation Enhancements

**Type:** Enhancement spec (strengthen, don't replace) for the existing M1–M5 engine + governance
**Stance:** the architecture is correct. This improves *how the systems communicate and how their outputs are presented* — no new pipelines, no duplicated responsibilities.
**Touches (extends, never forks):** Evidence Synthesiser (M3), Recommendation output (M1), Trust Matrix (governance), the live UI.

> Goal: make every recommendation read like an experienced World Brewers Cup mentor — the brewer understands *why it exists, what supports it, where it's uncertain, and what it trades*. Retire the confidence percentage; it told a brewer nothing.

---

## 1. Review of the current implementation (M1–M5)

What's strong and stays:
- **Strategy-first reasoning**, science gate (M2), scenario-relevant evidence weighting (M3), diagnosis + local learning (M4), governed research (M5). The Trust Matrix already weights by tier × relevance × freshness × consensus.

Where it's weak (the targets of this pass):
- **A single `confidence: 0.58` number** is the headline uncertainty signal. It's arbitrary to an expert and hides *why*.
- **Evidence is a flat list** of top claims. It doesn't show agreement vs disagreement, what's assumed, or what's unknown.
- **The synthesis output is informal** — the engine reads a `{items, note}` object, not a named contract. There's no single artifact that *is* "the evidence for this recommendation."
- **The recommendation is a judgement line + params.** It doesn't consistently walk the brewer through intuition → strategy → evidence → trade-offs → recipe → expectation → adjustment.

None of this requires new systems — only richer *contracts and presentation* over what M3/M5 already produce.

---

## 2. Suggested improvements (summary)

1. **Retire "confidence."** Delete the term and the percentage from every output and UI surface.
2. **Evidence Profile** — a multi-dimensional quality read that replaces the number (§3).
3. **Evidence Bundle** — formalise the synthesiser's output into one named object that is *the* interface into the engine (§4).
4. **Recommendation Narrative** — a fixed 7-part mentor structure (§5).
5. **Recommendation State** — a human label (Highly Supported → Experimental) derived from the profile (§6).
6. **Evidence Transparency** — expose Reviewed / Key Supporting / Agreements / Disagreements / Unknowns (evidence summary, *not* chain-of-thought).
7. **Weighting clarity** — document conflict priority order in the Trust Matrix (§7).
8. **Progressive UI** — clean by default, evidence on demand (§8).

---

## 3. Evidence Profile framework (replaces confidence)

Seven dimensions, each a qualitative level — **High · Moderate · Limited · None** — never a percentage. Each tells the brewer something actionable.

| Dimension | What it means | How it should shape trust |
|---|---|---|
| **Scientific Support** | Is the call grounded in first-principles / peer-reviewed science? | High → physically sound, safe to trust the *direction*. Limited → it works by practice, not proven mechanism. |
| **Expert Consensus** | Do multiple credible practitioners agree? | High → low risk, well-trodden. Limited → one voice; expect to verify. |
| **Coffee Similarity** | Is there *direct* data for this coffee, or is it extrapolated from similar ones? | High → tuned to this bean. Limited → borrowed from its type; more iteration likely. |
| **Evidence Freshness** | How current is the supporting evidence? | High → reflects current practice. Limited → may be dated. (Fundamentals are evergreen.) |
| **Research Coverage** | How much of the decision is actually backed vs inferred to fill gaps? | High → few blind spots. Limited → parts are reasoned, not evidenced. |
| **Source Diversity** | How many *independent* sources back it? | High → convergent, robust. Limited → single-origin, fragile. |
| **Recommendation Stability** | Would the advice change with a small input change? | High → settled. Limited → sensitive; treat as a starting point. |

**Why this beats a number:** a brewer reading *"Scientific Support: Limited · Expert Consensus: High · Coffee Similarity: Limited"* immediately knows: practitioners agree, but there's little hard science and no direct data for *this* coffee — so trust the technique, expect to iterate. `71%` conveys none of that.

Computation (from data already in the pipeline — no new sources):
- **Scientific Support** ← presence/weight of `kind:'science'` claims (Trust Matrix tier).
- **Expert Consensus** ← count of agreeing applied principles vs conflicts.
- **Coffee Similarity** ← Familiarity Router score + brew-history match for this coffee.
- **Evidence Freshness** ← registry `freshness` of contributing sources (fundamentals = evergreen).
- **Research Coverage** ← share of the decision's axes covered by applied principles.
- **Source Diversity** ← distinct `source.id` / `independentCount` behind the claims.
- **Recommendation Stability** ← diversity × coverage (thin evidence → unstable).

---

## 4. Evidence Bundle specification

Formalise the M3 synthesiser output into one internal object. **One recommendation ← one Evidence Bundle.** It becomes the primary interface from Evidence Synthesis into the Extraction Intelligence Engine (replacing the loose `{items, note}` hand-off — a rename/upgrade, not a new pipeline).

```ts
interface EvidenceBundle {
  coffee: CoffeeMeta;                    // origin/process/roast/… (the subject)
  scientificPrinciples: Claim[];         // kind:'science' — constraints
  expertOpinions: Claim[];               // practice claims (competition/roaster/education)
  consensus: string[];                   // areas of agreement
  conflicts: Conflict[];                 // areas of disagreement (+ how resolved)
  keySupporting: EvidenceItem[];         // the user-facing "what supports this"
  freshness: EvidenceLevel;
  assumptions: string[];                 // e.g. "extrapolated from similar high-altitude washed Caturra"
  limitations: string[];                 // unknowns / gaps (water profile, no brew history…)
  profile: EvidenceProfile;              // the seven dimensions (§3)
  state: RecommendationState;            // derived label (§6)
  narrative: string;                     // the mentor's evidence summary (prose, no %)
  reviewedCount: number;                 // how many pieces of evidence were weighed
}
```

The engine constructs the Recommendation *from* the Bundle; the UI reads the Bundle for the evidence panel. Nothing else changes shape.

---

## 5. Recommendation Narrative template

Every recommendation follows this fixed order — the mentor's thought process, not a parameter dump:

1. **Expert Judgement** — *"My read is…"* (the opinion, first).
2. **Extraction Strategy** — *"What we're optimising: …"*
3. **Evidence Summary** — *"This is primarily supported by …"* (from the Bundle; no reasoning trace).
4. **Trade-offs** — *"What we're intentionally giving up: …"*
5. **Recipe** — the implementation (params, each with its `because`).
6. **Expected Cup** — *"You should taste …"* (from `predictedCup`).
7. **Adjustment Advice** — *"If it comes out different: …"* (contingencies from the diagnosis map).

This maps onto existing outputs: (1) is today's judgement line; (2) the Strategy; (4) `strategy.tradeoffs`; (5) the Recipe; (6) `predictedCup`; (7) the Diagnosis defect map (M4). Only (3) is new prose, drawn from the Bundle. **No new generator** — it's a template over what exists.

---

## 6. Recommendation State model

A single human label replaces the percentage, derived deterministically from the Evidence Profile:

| State | When | Message to brewer |
|---|---|---|
| **Highly Supported** | Scientific Support ≥ Moderate **and** Expert Consensus High **and** Source Diversity ≥ Moderate | Strong evidence + broad agreement — brew with confidence. |
| **Well Supported** | Expert Consensus ≥ Moderate **and** Source Diversity ≥ Moderate (minor gaps) | Good evidence, small uncertainty — reliable starting point. |
| **Exploratory** | Coverage or Diversity Limited; leans on extraction *principles* over direct data | Limited published info — the call rests on theory; expect to iterate. |
| **Experimental** | Novel coffee/process; Familiarity very low; few/no applicable principles | Treat this brew as a learning opportunity — we're finding out together. |

Determination: score the profile (High=2, Moderate=1, Limited/None=0), then apply the ordered rules top-down; the first match wins. The state is honest by construction — a novel Nitro Washed with one source *cannot* read "Highly Supported."

---

## 7. Evidence weighting — conflict priority (Trust Matrix addendum)

When evidence conflicts, resolve in this order (extends the existing Trust Matrix §4; no new logic, just documented priority):

1. **Scientific plausibility first (gate).** Science validates *what's physically possible*; it can veto any practical claim that breaks the extraction curve.
2. **Competition routines guide implementation.** Within the science boundary, champion routines lead on *how* to execute.
3. **Roaster guides add coffee-specific context.** They localise to the bean/lot.
4. **User brewing history personalises.** For *this* user, their own successful brews override contested external claims.
5. **Unresolved genuine dispute →** keep the higher-trust side, mark it in the Bundle's `conflicts`, and lower the profile's Expert Consensus (not a hidden number).

Rule of thumb: **science bounds it, competition executes it, roasters localise it, your history personalises it.**

---

## 8. UI recommendations (progressive disclosure)

Default view stays clean and mentor-like — the narrative + the recipe. Evidence is *available*, not *imposed*.

- **Header:** the **Recommendation State** as a quiet chip (e.g. "Exploratory"), not a number. One glance = how much to trust it.
- **Evidence Profile:** a compact row of the seven dimensions as small labelled pills (High/Moderate/Limited), collapsed by default behind an "Evidence profile" affordance.
- **Evidence panel (expandable):** Reviewed count → Key Supporting → Areas of Agreement → Areas of Disagreement → Remaining Unknowns. Editorial, scannable — an *evidence summary*, never chain-of-thought.
- **Primary Assumption** surfaces inline under the state when Coffee Similarity is Limited ("extrapolated from similar … due to limited direct data") — the single most useful uncertainty cue.
- Follows the design system: one focal point (the recipe), depth on demand, calm by default.

---

## 9. Integration notes (no duplication)

| Enhancement | Extends (does not replace) |
|---|---|
| Evidence Profile | the retired `confidence` number — *one* signal swapped for a richer *one*, same input data |
| Evidence Bundle | the M3 synthesiser's existing `{items, note, conflicts}` output — formalised + named, same producer |
| Recommendation Narrative | today's judgement line + Strategy + Recipe + Diagnosis — a template over existing fields |
| Recommendation State | derived from the Profile — no new scoring pipeline |
| Weighting priority | documented ordering of the existing Trust Matrix rules |
| UI evidence panel | the existing evidence panel — progressive disclosure added |

**Nothing new is fetched, scored twice, or reasoned twice.** The Evidence Synthesiser still produces the evidence; it now emits a *Bundle*. The engine still produces the recommendation; it now dresses it in a *narrative* with a *profile* and *state*. The brewer stops seeing a black-box percentage and starts seeing a mentor's honest read.

*Strengthens the identity: an evidence-backed extraction-intelligence platform, not an AI recipe generator.*
