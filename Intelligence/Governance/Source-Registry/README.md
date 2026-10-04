# System 1 — Source Registry

**Purpose:** the curated catalogue of every source Brew Helper is *allowed* to use, with the metadata that lets the Trust Matrix score it. Not a URL list — an editorial record.
**Source of truth:** `sources.yaml`. The runtime allowlist (`Platform/config/source-registry.json`) is **generated** from it.

## Format

**YAML** — structured, low-noise diffs, and machine-generatable into the runtime JSON. One file (`sources.yaml`) until it gets large; then split by category into `sources/*.yaml`.

## Schema (per source)

```yaml
- id: SRC-REG-###          # stable registry id (≠ ingested SRC-#### instances)
  name: ""                 # source / author / outlet
  category: ""             # Researcher | WBrC Champion | Professional Brewer | Roaster |
                           # Scientific Journal | Equipment Manufacturer | Educational YouTube |
                           # Coffee Publication | Academic Paper | Education Platform
  expertise: []            # domains: [extraction, water, grind, roast, process, variety, equipment, sensory, general]
  tier: A|B|C              # Trust Matrix base tier (A can originate; C corroborates only)
  credibility: 0-100       # base score within tier (fine-grained)
  best_for: []             # where this source shines
  prioritise_when: ""      # situations to reach for it first
  avoid_when: ""           # situations where it should NOT drive a call
  philosophy: ""           # brewing worldview / bias to be aware of
  freshness: evergreen|active|dated   # decay signal for the Matrix
  urls: []                 # canonical domains/handles (feed the allowlist)
  registry_ref_note: ""    # optional
```

## Rules

- **Closed by default:** no registry entry → adapters may not fetch it.
- `tier` + `credibility` are the Trust Matrix inputs; `avoid_when` is enforced (a source is skipped when the current task matches its avoid condition).
- Ingested `SRC-####` instances carry `registry_ref: SRC-REG-###` and inherit its tier.
- Retire, don't delete: move declined sources to a `deprecated:` list with a reason.

## Generation (runtime allowlist)

`sources.yaml` → build step → `Platform/config/source-registry.json` (domains + tiers only). Never hand-edit the JSON.
