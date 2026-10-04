# Brew Helper — Ingestion Pipeline

**Type:** The process that turns a source into principles — with a filter that keeps junk out
**Reads with:** `Knowledge-Repository-Schema.md` (the store) · `../Interpretation-Heuristics.md` (destination)
**Runs with:** Claude, using the commands in §6.

> Nothing enters the principle library without passing every gate. A recipe can be **rejected** (never stored), **parked** (stored as weak evidence), or **distilled** (mined for principles). The gate decides which.

---

## 1. The six gates

```
 G0 CAPTURE ─▶ G1 SCREEN ─▶ G2 NORMALIZE ─▶ G3 EXTRACT ─▶ G4 DISTILL ─▶ G5 REVIEW
  verbatim      filter       to schema        find the       merge into     Joseph
  + provenance  (rubric)     (Recipe/Source)  principle      library        promotes
                    │
                    └─ reject / park here
```

### G0 · Capture
Bring the source in verbatim. Paste text, or give Claude a URL to fetch. Store the untouched text in `store/raw/YYYY-MM-DD-slug.md` with provenance (url, author, access date). **Raw is immutable** — the audit trail. No interpretation yet.

### G1 · Screen *(the filter — see §2)*
Score the source against the rubric. Outcome is one of:
- **Reject** — fails credibility *and* plausibility, or is unusable. Log the reason, stop.
- **Park** — usable only as corroboration (Tier C, or incomplete). Store as a Recipe with low scores; it may *support* a principle later but can never *originate* one.
- **Proceed** — good enough to distil from.

### G2 · Normalize
Map the raw onto the **Source** and **Recipe** schemas (`Knowledge-Repository-Schema.md` §4). Convert units (ratios → `1:x`, temps → °C, times → s), standardize brewer/grinder names, and **flag every unknown explicitly** (`water_profile: unspecified`) rather than guessing. A normalized Recipe is machine-comparable to every other.

### G3 · Extract *(recipe → candidate principle)*
For each recipe, ask the only question that matters: **"why does this work?"** Convert the *numbers* into a *mechanism*, grounded in the extraction curve (`Interpretation-Heuristics.md` §0). 

> A 45s bloom with a swirl → *principle*: "swirl-not-stir evens the bed without driving fines." The 45s is evidence; the mechanism is the asset.

Never store the recipe's parameters *as* the principle. If you can't articulate a mechanism, there's no principle — just data. Output `candidate` principles.

### G4 · Distill *(merge into the library)*
Reconcile candidates against `principles/active/` and `principles/candidates/`:
- **Match found** → merge: add this recipe/source to `evidence[]`, bump `independent_count`, recompute `confidence`. Convergence is how the library gets strong.
- **New mechanism** → create a `candidate` principle.
- **Conflict** → do not average. Apply §4 conflict rules — usually both become **conditional** principles (`applies_when`).
- **Dedupe** — near-identical statements collapse into one with combined evidence.

### G5 · Review *(human gate)*
Joseph reviews the `candidates/` queue and either **promotes** (→ `active/`, link into the heuristics tables), **holds** (needs more evidence), or **rejects**. Only Joseph mints an `active` principle. Promotion updates `Interpretation-Heuristics.md` as a normal sync.

---

## 2. The filtering rubric (G1)

### Credibility tiers
| Tier | Sources | Role |
|---|---|---|
| **A** | WBrC finalists'/champions' routines · peer-reviewed extraction research · recognised authorities *with stated methodology* (e.g. Hoffmann, Barista Hustle, SCA, Rao, Perger) | can **originate** principles |
| **B** | Established roasters' published recipes · reputable pro interviews · well-documented regional-competition routines | can **originate** with a second source; strong corroboration |
| **C** | General blogs, forum posts, social clips, content-farm recipes | **corroborate only** — never the sole basis for an active principle |
| **Reject** | Unsourced, physically implausible, SEO spam, missing key params with no inferability, contradicts the extraction curve with no evidence | discarded (reason logged) |

### Five screening checks (score 0–5 where noted)
1. **Credibility** — what tier? (gate, not a score)
2. **Completeness** — are enough parameters present to understand the method? (`completeness_score` 0–5)
3. **Reproducibility** — grinder/brewer/measurable specifics, or vague? (`reproducibility_score` 0–5)
4. **Relevance** — does it touch our space (filter/immersion, the six radar axes, specialty coffee)? Espresso-only, machine-specific, or off-domain → park or reject.
5. **Plausibility** — does it agree with extraction physics, or claim something the curve says is impossible? Implausible + unsourced → reject.

**Pass to G3 (distil) only if:** Tier A/B **and** completeness ≥ 3 **and** plausible. Tier C or completeness < 3 → **park** (corroboration only).

---

## 3. Confidence model

A principle's `confidence` (0–1) is computed, not felt:

```
confidence ≈ base(tier of best evidence)
             + convergence(independent_count)
             + reproducibility(avg of supporting recipes)
             − conflict_penalty
```

- **Base:** A ≈ .6, B ≈ .45, C-only ≈ .25 (C-only can't reach `active`).
- **Convergence:** each *independent* source reaching the same mechanism adds ~.08 (diminishing). Three independent Tier-B sources beat one Tier-A assertion.
- **Reproducibility:** well-specified evidence raises it; vague evidence caps it.
- **Conflict penalty:** unresolved contradiction lowers it and forces `applies_when` conditions.

Confidence surfaces to the AI as *how hard it leans* on a principle (ties to Stage 4 judgement calibration).

---

## 4. Conflict resolution

When credible sources disagree (classic: light-roast temperature, or bloom ratio):

1. **Never blind-average.** "94°C" and "off-boil" don't become 97°C.
2. **Condition it.** Most conflicts are context collapse — the sources meant different coffees/methods. Split into conditional principles: *"for dense light roasts, hotter"* vs *"for fragile naturals, cooler."* Encode in `applies_when`.
3. **Weigh** by tier → mechanism-given → reproducibility → convergence. A source that *explains why* beats one that just asserts.
4. **If genuinely unresolved,** keep one principle at **lower confidence** with a `debate` note. Honesty over false precision.
5. **Outcomes break ties.** Joseph's brew-logs (Stage 6) are the referee — a principle contradicted by real results gets deprecated.

---

## 5. Anti-patterns (what breaks the repository)

- ❌ **Storing recipes to serve back.** That's a recipe generator — the product's stated non-goal. Everything distils to principles.
- ❌ **Minting principles from a single Tier-C source.** Corroboration only.
- ❌ **Averaging conflicts** into a mushy middle. Condition instead.
- ❌ **Silent guessing** of missing params. Flag unknowns.
- ❌ **Editing raw captures.** They're the audit trail.
- ❌ **Principle with no mechanism.** If you can't say *why*, it's data, not a principle.

---

## 6. Running it with Claude — the commands

The repository is operated conversationally. Standard verbs (put these in the Coffee `CLAUDE.md` so any session obeys them):

| Command | What Claude does |
|---|---|
| **`Ingest: <url or pasted recipe>`** | G0–G4: capture to `raw/`, screen against the rubric (report tier + scores + reject/park/proceed), normalize to a `Recipe` (+ `Source`), extract candidate principles with mechanisms, distil against the library, and report: *new candidates, merges (evidence++), conflicts.* Nothing is promoted. |
| **`Ingest batch: <list of urls>`** | Runs the above per item; returns a consolidated report + dedupe across the batch. |
| **`Review queue`** | Lists `principles/candidates/` with evidence, confidence, and conflicts — Joseph's promotion worklist. |
| **`Promote PRN-####`** | Moves to `active/`, links into `Interpretation-Heuristics.md`, bumps version. |
| **`Deprecate PRN-#### (reason)`** | Moves to `deprecated/` with reason + `supersedes`. |
| **`Distil`** | Periodic consolidation: re-merge candidates, recompute confidence, surface stale conflicts. |
| **`Trace PRN-####`** | Walks the principle back through its recipes to raw sources (provenance audit). |

**Claude's standing instructions during ingest:** screen before distilling · never originate a principle from Tier C alone · extract mechanisms not numbers · flag unknowns · propose confidence, never self-promote · report conflicts loudly · stay in the mentor voice.

---

## 7. Worked example — ingesting a live web recipe

**Input:** `Ingest: https://example.com/blog/best-ethiopia-v60` (a roaster's blog recipe).

1. **G0 Capture** → `raw/2026-07-22-example-ethiopia-v60.md` (verbatim + url + date).
2. **G1 Screen** → roaster blog = **Tier B**; completeness 4 (dose, water, temp, pours given; grinder model missing → note); reproducibility 3; relevant (V60, washed Ethiopia); plausible. **Proceed.**
3. **G2 Normalize** → `RCP-0021` (1:16.6, 94°C, 3 pours, bloom 2×dose 40s) + `SRC-0014`. `grinder: unspecified`, `water_profile: unspecified` flagged.
4. **G3 Extract** → candidates: (a) *"2× bloom ratio degasses fresh light roasts for even extraction"* → maps to existing **PRN-0009** (bloom); (b) *"three even pulse pours on a delicate washed coffee protect against astringency"* → matches **PRN-0012** (agitation).
5. **G4 Distil** → PRN-0009 evidence += RCP-0021 (independent_count 2→3, confidence .72→.79); PRN-0012 += RCP-0021. No new principle, no conflict.
6. **Report to Joseph:** *"Tier B, ingested as RCP-0021. No new principles — strengthened PRN-0009 and PRN-0012 (both now 3+ independent sources). Nothing to review."*

**If instead** the blog claimed *"boiling water is best for light roasts"* while Tier-A research says 92–96°C → **conflict**: don't average; record as conditional (*"very dense/underdeveloped light roasts tolerate higher temp"*) at reduced confidence, flag for Joseph, and let brew-logs decide.

---

*The filter keeps the library clean; distillation keeps it a principle engine. Recipes are how the library learns — not what it stores.*
