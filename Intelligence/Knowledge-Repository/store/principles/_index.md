# store/principles — the distilled asset

The mechanisms the AI actually reasons over. Template: `templates/principle-entry.md`.

- `candidates/` — `PRN-####` awaiting Joseph's review (never used by the AI yet).
- `active/` — promoted, in-use principles; linked into `../../Interpretation-Heuristics.md`.
- `deprecated/` — superseded or disproven (kept with a reason, never deleted).

Lifecycle: `candidate → active → deprecated`. Only Joseph promotes (`Promote PRN-####`).
Confidence is computed from evidence tier + independent count + reproducibility − conflict (`Ingestion-Pipeline.md §3`).

A Tier-C source alone can corroborate but never mint an `active` principle. Empty until distillation begins.
