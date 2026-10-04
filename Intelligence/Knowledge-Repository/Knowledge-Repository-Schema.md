# Brew Helper — Knowledge Repository Schema

**Type:** How brewing knowledge is stored, structured, and distilled into principles
**Reads with:** `Ingestion-Pipeline.md` (the process) · `../Interpretation-Heuristics.md` (where principles land) · `../Extraction-Intelligence-Layer.md` (§5 knowledge→principles)
**Purpose:** turn recipes, WBrC routines, interviews, research and live web sources into a **principle library** — never a recipe list.

> **The one rule that governs everything here:**
> **We do not store recipes to serve them back. We mine recipes for the *principle* underneath, and store that.**
> A recipe is *evidence*. A principle is the *asset*. (Core philosophy, `Extraction-Intelligence-Layer.md`.)

---

## 1. Three-layer store

Knowledge flows one direction — raw fidelity in, distilled principle out — so nothing is ever silently invented and every principle traces to its evidence.

```
   ┌─────────────┐      ┌──────────────────┐      ┌────────────────────┐
   │  RAW         │ ───▶ │  STRUCTURED       │ ───▶ │  PRINCIPLES         │
   │ verbatim     │      │ normalized to     │      │ distilled mechanisms│
   │ capture      │      │ Source + Recipe   │      │ (the actual asset)  │
   │ (immutable)  │      │ schema            │      │ candidate→active     │
   └─────────────┘      └──────────────────┘      └────────────────────┘
     provenance kept       machine-comparable        feeds the AI's reasoning
```

- **Raw** — exactly what came in (paste, fetched page text, transcript). Immutable, timestamped, never edited. The audit trail.
- **Structured** — the raw mapped onto the **Source** and **Recipe** schemas (§4). Units converted, names standardized, unknowns flagged. Comparable across entries.
- **Principles** — the transferable mechanisms extracted from structured entries (§4, Principle schema). This layer is what the intelligence layer actually reasons over; it links directly into `Interpretation-Heuristics.md`.

---

## 2. Folder layout

```
Coffee/Intelligence/Knowledge-Repository/
├── Knowledge-Repository-Schema.md      ← this file
├── Ingestion-Pipeline.md               ← the process + filtering rubric
├── templates/
│   ├── source-entry.md                 ← copy to create a Source
│   ├── recipe-entry.md                 ← copy to create a Recipe
│   └── principle-entry.md              ← copy to create a Principle
└── store/
    ├── raw/                            ← verbatim captures (immutable)
    ├── structured/
    │   ├── sources/                    ← SRC-#### entries
    │   └── recipes/                    ← RCP-#### entries
    └── principles/
        ├── candidates/                 ← PRN-#### awaiting review
        ├── active/                     ← promoted, in-use principles
        └── deprecated/                 ← superseded / disproven
```

One file per entity, named by ID (`RCP-0007.md`). Small, diffable, greppable — a plain-text database that syncs over iCloud and versions cleanly.

---

## 3. Identity & relationships

| Entity | ID prefix | Links to |
|---|---|---|
| **Source** | `SRC-####` | the recipes/principles it produced |
| **Recipe** | `RCP-####` | its `source_ref`; the `principles_extracted[]` it fed |
| **Principle** | `PRN-####` | its `evidence[]` (source + recipe refs); `heuristics_link`; `conflicts_with[]` / `supersedes[]` |

```
SRC-0003 ──contains──▶ RCP-0007 ──evidence-for──▶ PRN-0012 ──lands-in──▶ Interpretation-Heuristics §Agitation
                       RCP-0008 ──evidence-for──▶ PRN-0012   (convergence ↑ confidence)
```

A principle with **many independent recipes** behind it is stronger than one seen once. Provenance is never lost: from any principle you can walk back to every recipe and source that supports it.

---

## 4. Schemas

Full copy-paste templates live in `templates/`. Field intent below.

### Source — `SRC-####`
```yaml
id: SRC-0003
title: "James Hoffmann — Ultimate V60 Technique"
author: "James Hoffmann"
type: interview        # wbrc-routine | interview | research | web-recipe | book | repository | brew-log
url: "https://…"
published: 2020-01
accessed: 2026-07-22
credibility_tier: A    # A | B | C  (see Ingestion-Pipeline §rubric)
authority_notes: "Recognised authority; method explained with reasoning"
license_attribution: "cite author + link"
related_recipes: [RCP-0007]
related_principles: [PRN-0012, PRN-0018]
```

### Recipe — `RCP-####`  *(evidence, not gospel)*
```yaml
id: RCP-0007
name: "Hoffmann 1-cup V60"
source_ref: SRC-0003
method_type: pour-over        # pour-over | immersion | hybrid | espresso
brewer: "Hario V60 02"
filter: "V60 tabbed paper"
dose_g: 15
water_g: 250
ratio: "1:16.7"
grinder_ref: "medium-fine (unspecified grinder)"   # normalize + flag unknowns
water_temp_c: 95
water_profile: "unspecified"        # flag as unknown
bloom: { water_g: 45, time_s: 45 }
pour_structure:
  - { stage: 1, to_g: 60,  note: "bloom + swirl" }
  - { stage: 2, to_g: 150, note: "steady central pour" }
  - { stage: 3, to_g: 250, note: "finish by 1:15" }
agitation: "swirl after bloom + final swirl"
drawdown_target_s: null
total_time_s: 210
target_profile: { sweetness: .7, clarity: .7, body: .4, acidity: .6, floral: .5, juiciness: .6 }  # radar axes
designed_for: { roast_level: "light-medium", process: "any", origin: "any" }
claimed_outcome: "sweet, clean, repeatable"
completeness_score: 4     # 0–5 (Ingestion-Pipeline §scoring)
reproducibility_score: 3  # 0–5
principles_extracted: [PRN-0012, PRN-0018]
status: ingested          # captured | screened | ingested | rejected
ingested_by: Claude
ingested_date: 2026-07-22
provenance: { raw_ref: "raw/2026-07-22-hoffmann-v60.md" }
```

### Principle — `PRN-####`  *(the asset)*
```yaml
id: PRN-0012
statement: "A swirl (not a stir) after the bloom evens the bed without driving fines."
domain: agitation          # grind | temp | time | agitation | ratio | water | pour | bloom | process | roast | equipment
mechanism: "Gentle swirling settles the slurry evenly, raising extraction uniformity while avoiding the fines migration that stirring causes → less astringency."
applies_when: ["pour-over", "delicate/washed coffees especially"]
levers: [agitation, evenness]
strategy_implication: "Use to raise extraction & clarity together when a coffee is agitation-sensitive."
confidence: 0.8            # 0–1, rises with convergent evidence & tier
evidence:
  sources: [SRC-0003, SRC-0009]
  recipes: [RCP-0007, RCP-0011, RCP-0015]
  independent_count: 3     # distinct origins → the real confidence driver
conflicts_with: []
supersedes: []
heuristics_link: "Interpretation-Heuristics.md#1-the-levers  (agitation row)"
status: active            # candidate | active | deprecated
version: 2
last_reviewed: 2026-07-22
review_owner: Joseph
```

---

## 5. Principle lifecycle

```
candidate ──review──▶ active ──superseded/disproven──▶ deprecated
    │                    │
    └── merged into an existing principle (evidence++, confidence++, count++)
```

- **candidate** — freshly distilled, awaiting Joseph's review. Never used by the AI yet.
- **active** — promoted; part of the reasoning library; linked into `Interpretation-Heuristics.md`.
- **deprecated** — replaced by a better-evidenced principle or contradicted by outcomes. Kept (not deleted) with a `supersedes`/reason, so history is legible.

**Confidence** is not a vibe: it rises with (a) **independent evidence count**, (b) **source credibility tier**, and (c) **convergence** (many sources reaching the same mechanism). One Tier-C blog alone can never mint an active principle; it can only corroborate.

---

## 6. How this connects to the rest of the system

- **`Interpretation-Heuristics.md` is the published face of the principle library.** Active principles are the rows in its lever/observation/diagnosis tables. When a principle is promoted or deprecated, the corresponding heuristics row updates — and that change is a normal IA-style sync (see the standing rule).
- **The intelligence loop reads principles, not recipes.** Stage 2 (Interpret) and Stage 3 (Decide) draw on `active` principles; the AI never retrieves `RCP-####` to replay it. Recipes exist only as evidence and as sanity checks.
- **User brew history is a source type** (`type: brew-log`). Joseph's own successful brews are Tier-A-for-his-setup evidence and feed the same pipeline — closing Stage 6 (Learn) into the same library.

---

## 7. Guardrails

- **No principle without evidence.** Every `PRN` lists its supporting sources/recipes, or it stays a candidate.
- **No recipe treated as truth.** Recipes are inputs to distillation, never outputs to users.
- **Provenance is permanent.** Raw captures are immutable; you can always trace a principle to its origin.
- **Conditional, not absolute.** Principles carry `applies_when`; contradictory sources become *conditional* principles, not an averaged mush (see `Ingestion-Pipeline.md`).
- **Deprecate, don't delete.** Superseded knowledge is archived with a reason.

---

*Recipes go in. Principles come out. The library gets smarter every time.*
