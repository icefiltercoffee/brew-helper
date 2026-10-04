# Principle Template — copy to `store/principles/candidates/PRN-####.md`

The **asset**. A principle is a *mechanism*, not a number. If you can't state the *why*, it's data, not a principle.
Confidence is computed (`Ingestion-Pipeline.md §3`), not guessed. Only Joseph promotes to `active`.

```yaml
id: PRN-####
statement: ""              # one sentence: the transferable mechanism
domain: ""                # grind | temp | time | agitation | ratio | water | pour | bloom | process | roast | equipment
mechanism: ""             # WHY it works, grounded in the extraction curve
applies_when: []          # conditions/context — makes it conditional, not absolute
levers: []                # [grind, temp, agitation, ...]
strategy_implication: ""  # how the Decide stage should use it
confidence:               # 0–1 (computed)
evidence:
  sources: []             # [SRC-####]
  recipes: []             # [RCP-####]
  independent_count: 0     # distinct origins — the real confidence driver
conflicts_with: []        # [PRN-####]
supersedes: []            # [PRN-####]
heuristics_link: ""       # Interpretation-Heuristics.md#section
status: candidate         # candidate | active | deprecated
version: 1
last_reviewed:
review_owner: Joseph
```
