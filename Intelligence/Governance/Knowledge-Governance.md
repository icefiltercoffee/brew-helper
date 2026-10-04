# Brew Helper — Knowledge Governance Layer

**Type:** Editorial / technical design — the quality-control layer between Live Research and the Engine
**Role model:** editor-in-chief of the intelligence platform, not UI or prompt design
**Reads with:** `Source-Registry/`, `Trust-Matrix.md`, `Research-Playbooks/Playbooks.md`
**Governs:** where knowledge comes from · how trustworthy it is · how research is run · how evidence enters the engine

> **Mandate:** every recommendation must be built from **trusted, high-quality, transparent** evidence. Governance decides *what is allowed in and how much it counts* — it does not reason, and it does not touch the UI.

---

## 1. The three systems

| System | Question it answers | Artifact |
|---|---|---|
| **1 · Source Registry** | *Where may knowledge come from?* | `Source-Registry/sources.yaml` (curated catalogue + metadata) |
| **2 · Trust Matrix** | *How much does a piece of evidence count?* | `Trust-Matrix.md` (editorial weighting policy) |
| **3 · Research Playbooks** | *How is research actually performed?* | `Research-Playbooks/Playbooks.md` (reusable investigation workflows) |

They are **independent** (each maintainable alone) but **connected**: a Playbook draws from the Registry, and the Trust Matrix scores what comes back.

---

## 2. Where it sits (integration)

Governance is a band **between Live Research (Layer 2) and the Evidence Synthesiser** in the existing Extraction Intelligence Engine. Nothing downstream changes.

```
User inputs coffee
      │
      ▼
[Playbook selected]  ── System 3 picks the right investigation workflow
      │
      ▼
Live Research executed  (Layer 2 · adapters fetch only Registry-approved sources)
      │
      ▼
Evidence collected  (raw claims, each tagged with its source)
      │
      ├── System 1 · Source Registry  → attaches source metadata + base credibility
      ▼
[Trust Matrix]  ── System 2 scores each claim: credibility × relevance × freshness × consensus
      │           (science = constraint; practice = weighted evidence; conflicts → conditional)
      ▼
Evidence synthesised  (Evidence Synthesiser, already built at M3 — now fed governed weights)
      │
      ▼
Extraction Intelligence Engine → Strategy → Recipe → Explanation (+ Evidence panel)
```

**Why here:** research produces *noise*; the engine needs *signal*. Governance is the filter and the scale that turns one into the other, before any reasoning happens.

---

## 3. Why each system exists (and how it lifts quality)

- **Source Registry** — stops the platform from treating a random blog like a peer-reviewed paper. By pre-approving sources with metadata, every fetch is *auditable* ("this came from a Tier-A champion routine") and *bounded* (adapters may only touch listed domains). Quality is decided **once, deliberately**, not per-request.
- **Trust Matrix** — makes authority *explicit and consistent*. The same evidence is scored the same way every time, so recommendations are reproducible and conflicts are resolved by policy, not vibes. It is the platform's permanent QC.
- **Research Playbooks** — make research *repeatable*. Ad-hoc searching gives inconsistent depth; a playbook guarantees the same questions get answered, in the same source order, producing **structured knowledge** the engine can consume — never a copied article.

Together they guarantee the product promise: **evidence-backed, transparent, maintainable.**

---

## 4. ⚠️ Overlaps with the existing architecture (flagged, with reconciliation)

Governance formalises things the platform did *ad hoc*. Three real overlaps — each resolved by making governance the **single source of truth** and the existing piece its **implementation**:

| Existing piece | Overlaps with | Reconciliation (do this) |
|---|---|---|
| `Platform/config/source-registry.json` (runtime allowlist) | **System 1 Source Registry** | The editorial `sources.yaml` becomes the **source of truth**; the runtime JSON is **generated from it** (domains + tiers only). Never hand-edit the JSON again. |
| Ingestion-Pipeline credibility **tiers A/B/C** + confidence model + conflict rules | **System 2 Trust Matrix** | The Trust Matrix is now the **canonical policy**; the ingestion pipeline & Evidence Synthesiser **implement** its tiers/weights/conflict rules. One definition of "tier," here. |
| Knowledge-Repository `SRC-####` entries | **System 1 Source Registry** | Distinct on purpose: Registry = *approved sources we may use*; `SRC-####` = *instances actually ingested*. An `SRC` inherits its tier from its Registry entry (`registry_ref`). |
| Live Research Manager + adapters | **System 3 Playbooks** | Complementary, not duplicate: Playbooks are the **procedures** the Research Manager executes. Add a `playbook` field to a research request. |
| Evidence Synthesiser (M3) | **System 2 Trust Matrix** | Already weights by tier×confidence×convergence — that logic **is** the Trust Matrix in code. Point it at the Matrix as its spec; don't fork the weights. |

**Net:** no new reasoning, no duplicated scales. Governance is the *policy*; the M1–M3 code is the *engine that obeys it*. This is the intended relationship, and it removes the ad-hoc tiering that was scattered across the pipeline.

---

## 5. Folder structure

```
Intelligence/Governance/
├── Knowledge-Governance.md          ← this master TDD
├── Trust-Matrix.md                  ← System 2 (editorial policy)
├── Source-Registry/
│   ├── README.md                    ← System 1 schema + format + generation
│   └── sources.yaml                 ← the curated registry (source of truth)
└── Research-Playbooks/
    └── Playbooks.md                 ← System 3 (template + 8 playbooks)
```

Format choice: **YAML for the registry** (structured, queryable, machine-generatable into the runtime JSON, low-noise diffs); **Markdown for the policy and playbooks** (they are editorial documents humans reason about). One file per system keeps token cost and maintenance low; split only if a file becomes unwieldy.

---

## 6. Maintenance strategy (the editor's job)

- **Adding a source:** append one entry to `sources.yaml` with all required fields (README schema). No entry, no fetch — the allowlist is closed by default.
- **Trust review cadence:** quarterly audit — re-check credibility, apply **freshness decay** (a source not re-verified in N months drops confidence), retire dead/declined sources to a `deprecated:` block (never delete — provenance).
- **Regenerate the runtime allowlist** from `sources.yaml` after any change (a one-line build step). The JSON is derived, never authoritative.
- **Playbooks** are versioned; refine them as research reveals better question sets or source orders.
- **Ownership:** Joseph is editor-in-chief — only he promotes a source to Tier A or changes the Trust Matrix. (Mirrors the principle-promotion human gate.)
- **Change log:** record registry/matrix changes with date + reason so any recommendation is traceable to the policy version that produced it.

---

## 7. Scalability

- **Adding sources is O(1):** append to `sources.yaml`; the Trust Matrix (policy) and playbooks are **source-count-independent**, so 15 sources or 500 use the identical machinery.
- **Categories extend freely:** a new category (e.g. "Sensory Science") is a new `category` value + a Trust Matrix row — no code change.
- **The engine never changes:** governance emits the same weighted-evidence shape the Evidence Synthesiser already consumes. Growth happens in data (registry) and policy (matrix), not in the reasoning core — the same invariant as the rest of the platform.

*Governance is the editorial spine: it decides what earns a voice, how loud that voice is, and how the interview is conducted — so the engine only ever hears trustworthy, well-formed evidence.*
