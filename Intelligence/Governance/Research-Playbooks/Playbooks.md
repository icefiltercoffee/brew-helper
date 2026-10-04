# System 3 — Research Playbooks

**Purpose:** standardise Live Research so it's never ad hoc. Each playbook is a reusable investigation workflow that turns a question into **structured knowledge** for the engine — never a copied article or recipe.
**Runs on:** the Live Research Manager, using only Source-Registry-approved sources, scored by the Trust Matrix.

---

## Shared template (every playbook follows this)

```
Objective          — the one thing this investigation must deliver
Questions          — the specific questions to answer (bounded)
Search strategy    — how to query (terms, angles)
Preferred source order — which registry categories to consult, in order
Evidence extraction — pull the MECHANISM/fact, not prose
Evidence validation — Trust-Matrix scored; science-gated; conflicts → conditional
Synthesis          — merge into one structured view
Output             — a typed object for the engine (see below)
```

**Output contract (all playbooks):** structured knowledge, not text. Emits either
- `interpretation` fields (density, solubility, difficulty, risks…) for Stage 2, and/or
- **candidate `Claim`s** (statement · source · tier · domain) that flow into the Evidence Synthesiser and, if durable, the ingestion pipeline → principles.
Never: a pasted recipe or article. Always: *what it means for extraction.*

---

## Playbooks

### PB-01 · New bean
- **Objective:** understand this specific coffee well enough to seed a strategy.
- **Questions:** origin/region, process, variety, altitude, roast level/age, stated notes, known extraction quirks.
- **Search:** "[origin] [process] [variety] brewing", roaster lot page, similar-lot guides.
- **Source order:** Roaster (the lot) → Champions/Educators (technique for the type) → Researchers (if chemistry matters) → Publications (context).
- **Extract:** density/solubility signals, target flavours, risk (astringency, under-extraction).
- **Output:** `interpretation` seed + 0–2 candidate claims. → feeds Stage 2 Interpret.

### PB-02 · Producer
- **Objective:** context on the farm/mill that predicts cup character.
- **Questions:** processing signature, typical varieties, altitude band, quality reputation, house ferment style.
- **Source order:** Roaster/importer → Publications (Standart/PDG) → Champions (if they've featured it).
- **Extract:** consistent processing/ferment traits → extraction implications.
- **Output:** context notes + claims on process tendencies.

### PB-03 · Processing method
- **Objective:** how this process shapes solubility, body, clarity, risk.
- **Questions:** what the process does chemically; typical body/acidity/clarity; common defects.
- **Source order:** Researchers → Education Platform (Barista Hustle) → Champions/Roasters → Publications.
- **Extract:** process → extraction mechanism (e.g. natural → more solubles/ferment → muddiness risk).
- **Output:** claims tagged `domain: process` → likely durable → ingestion.

### PB-04 · Coffee variety
- **Objective:** varietal tendencies (density, aromatics, fragility).
- **Questions:** bean density, aromatic profile, extraction sensitivity, examples.
- **Source order:** Researchers/SCA → Roasters (who grow/sell it) → Publications.
- **Extract:** variety → density/aromatic handling (e.g. Geisha → protect volatile florals).
- **Output:** `interpretation` modifiers + claims.

### PB-05 · Grinder
- **Objective:** how this grinder's particle distribution affects extraction.
- **Questions:** burr type, distribution (fines), recommended range for filter, known quirks/calibration.
- **Source order:** Manufacturer (specs) → Educational YouTube (Hedrick) / Champions → independent tests.
- **Extract:** distribution → evenness/astringency risk; setting → grind-scale mapping.
- **Output:** equipment claims + calibration hints → user/equipment model (M4).

### PB-06 · Brewer
- **Objective:** how this brewer's geometry/flow shapes the cup.
- **Questions:** flow rate, bed geometry, clarity vs body bias, valve/immersion behaviour.
- **Source order:** Manufacturer (design intent) → Champions/Educators (real use) → community tests.
- **Extract:** device → clarity/body tendency, pour sensitivity.
- **Output:** method/equipment claims (e.g. Switch → staged percolation↔immersion → PRN-0001 family).

### PB-07 · Water chemistry
- **Objective:** how water composition changes extraction & taste.
- **Questions:** GH/KH targets, mineral effects, buffer vs acidity, recipe for the goal.
- **Source order:** Researchers (Hendon / 'Water for Coffee') → Education Platform → Manufacturers (of water products, Tier C).
- **Extract:** mineral → extraction ceiling & acidity effect.
- **Output:** claims `domain: water` (science-heavy → high tier) → constraints + evidence.

### PB-08 · Extraction theory
- **Objective:** ground a specific mechanism in first principles.
- **Questions:** the mechanism in question (agitation, temp, EY, channeling…), quantitative if possible.
- **Source order:** Researchers (Gagné/Hendon) → SCA → Education Platform → Champions.
- **Extract:** the principle + its boundary conditions.
- **Output:** `domain`-tagged claims; science claims become **constraints** (Trust Matrix §3), not just evidence.

---

## How a playbook is chosen

The Familiarity Router (M5) inspects the coffee/question and selects the playbook(s) whose objective matches the gap in Memory — e.g. an unknown *process* triggers PB-03; an unfamiliar *grinder* triggers PB-05. Multiple may run; outputs merge in the Evidence Synthesiser.

*Playbooks make research repeatable and its output engine-shaped. The interview is standardised so the evidence is always well-formed.*
