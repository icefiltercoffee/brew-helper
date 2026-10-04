# Recipe Template — copy to `store/structured/recipes/RCP-####.md`

A recipe is **evidence**, not a deliverable. Normalize units (ratio `1:x`, °C, seconds).
Flag every unknown as `unspecified`. Scores per `Ingestion-Pipeline.md §2`.

```yaml
id: RCP-####
name: ""
source_ref: SRC-####
method_type: ""              # pour-over | immersion | hybrid | espresso
brewer: ""
filter: ""
dose_g:
water_g:
ratio: ""                    # "1:16.7"
grinder_ref: ""             # model + setting, or "medium-fine (unspecified grinder)"
water_temp_c:
water_profile: "unspecified" # GH/KH or product, if known
bloom: { water_g: , time_s: }
pour_structure:
  - { stage: 1, to_g: , note: "" }
  - { stage: 2, to_g: , note: "" }
agitation: ""                # swirl / stir / spin / none — be specific
drawdown_target_s:
total_time_s:
target_profile: { sweetness: , clarity: , body: , acidity: , floral: , juiciness: }  # 0–1, radar axes
designed_for: { roast_level: "", process: "", origin: "" }
claimed_outcome: ""
completeness_score:          # 0–5
reproducibility_score:       # 0–5
principles_extracted: []     # [PRN-####]
status: captured             # captured | screened | ingested | parked | rejected
ingested_by: Claude
ingested_date:
provenance: { raw_ref: "" }
```
