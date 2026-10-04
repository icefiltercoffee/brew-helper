#!/usr/bin/env python3
"""
sync-brew-data.py — regenerate the Brew Helper dashboard data from the Knowledge Repository.

Reads:
  Intelligence/Knowledge-Repository/store/structured/recipes/RCP-*.md   (the real, ingested recipes)
  Intelligence/Extraction-Model.json                                     (coupling + read rules, from Interpretation-Heuristics)

Writes a single self-contained data block  window.BH_DATA = {...}  into:
  brew-helper-site/brew-data.js                       (canonical generated file)
  brew-helper-site/index.html                         (inline, between the BH:DATA markers)

index.html is the one and only dashboard surface. It reads window.BH_DATA at load,
so editing a recipe or the model and re-running this script updates the working
dashboard. No runtime fetch (works on file://).

Usage:  python3 brew-helper-site/build/sync-brew-data.py
"""
import json, re, sys, datetime, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # .../Coffee
RECIPES_DIR = ROOT / "Intelligence/Knowledge-Repository/store/structured/recipes"
SOURCES_DIR = ROOT / "Intelligence/Knowledge-Repository/store/structured/sources"
MODEL_PATH  = ROOT / "Intelligence/Extraction-Model.json"
LEXICON_PATH = ROOT / "Intelligence/Flavour-Lexicon.json"
TARGETS = [
    ROOT / "brew-helper-site/index.html",
]
OUT_JS = ROOT / "brew-helper-site/brew-data.js"
VISUALS_DIR = ROOT / "Visuals"
SITE_VISUALS_DIR = ROOT / "brew-helper-site/assets/recipe-visuals"

AXES = ["Sweetness", "Floral", "Acidity", "Juiciness", "Body", "Clarity"]
PROFILE_KEYS = {a.lower(): i for i, a in enumerate(AXES)}   # sweetness→0, floral→1, ...

MARK_START = "<!-- BH:DATA:START -->"
MARK_END   = "<!-- BH:DATA:END -->"


def yaml_block(text):
    m = re.search(r"```yaml(.*?)```", text, re.S)
    return m.group(1) if m else text


def field(block, key, quoted=None):
    """Grab a scalar field. quoted=True keeps quotes stripped; None auto-detects."""
    m = re.search(rf"^\s*{re.escape(key)}:\s*(.+?)\s*$", block, re.M)
    if not m:
        return None
    v = m.group(1).strip()
    if v.startswith('"') and v.endswith('"'):
        return v[1:-1]
    # strip trailing inline comment on unquoted scalars
    v = re.split(r"\s+#", v)[0].strip()
    return v


def parse_profile(block):
    m = re.search(r"target_profile:\s*\{([^}]*)\}", block)
    vals = [0.6] * 6
    if not m:
        return vals
    for k, v in re.findall(r"([a-z_]+)\s*:\s*(\.?\d*\.?\d+)", m.group(1)):
        if k in PROFILE_KEYS:
            vals[PROFILE_KEYS[k]] = float(v)
    return vals


def parse_designed(block):
    m = re.search(r"designed_for:\s*\{([^}]*)\}", block)
    if not m:
        return ""
    parts = []
    for k, v in re.findall(r'([a-z_]+)\s*:\s*"([^"]*)"', m.group(1)):
        if v and v.lower() != "unspecified":
            parts.append(v)
    return " · ".join(parts)


def parse_steps(block):
    """Turn pour_structure into presentable steps. Handles list-of-maps and inline-flow forms."""
    m = re.search(r"pour_structure:\s*(.*?)(?:\n[a-z_]+:|\Z)", block, re.S)
    if not m:
        return []
    seg = m.group(1)
    entries = re.findall(r"\{([^{}]*)\}", seg)
    steps = []
    for i, e in enumerate(entries):
        def g(k):
            mm = re.search(rf'{k}\s*:\s*"?([^,"}}]+)"?', e)
            return mm.group(1).strip() if mm else None
        to_g = g("to_g")
        note = g("note")
        at   = g("at")
        temp = g("temp_c")
        valve = g("valve")
        stage = g("stage")
        is_bloom = (note and "bloom" in note.lower()) or (stage and "bloom" in str(stage).lower()) or (i == 0 and to_g)
        if to_g and is_bloom:
            title = f"Bloom to {to_g}g"
        elif to_g:
            title = f"Pour to {to_g}g"
        elif valve:
            title = f"Valve {valve}"
        elif stage:
            title = f"{str(stage).capitalize()}"
        else:
            title = (note or "Pour").split(",")[0][:40]
        meta = " · ".join([x for x in [
            at, (f"{temp}°C" if temp and "°" not in temp else temp), (f"valve {valve}" if valve and not to_g else None)
        ] if x])
        why = note or ""
        steps.append({"t": title, "m": meta, "w": why})
    return steps


# Filler words that read as fluff on the barista-facing dashboard. The raw
# claimed_outcome in the Knowledge Repository stays verbatim; only the DISPLAY
# copy shown in the Recipe outcome/strategy is scrubbed here.
FILLER_SUBS = [
    (r"\btransparent\b", "crisp"),
    (r"\bwell-defined\b", "clear"),
    (r"\bexceptionally\b", ""),
    (r"\bbeautifully\b", ""),
    (r"\btruly\b", ""),
]


def scrub_filler(text):
    if not text:
        return text
    for pat, repl in FILLER_SUBS:
        text = re.sub(pat, repl, text, flags=re.I)
    # tidy up any doubled spaces / stray spacing left by removals
    return re.sub(r"\s{2,}", " ", text).strip()


def load_sources():
    """Map SRC-#### → a short attribution label, e.g. 'Nas Jaafar · WBrC' (feature a),
       and SRC-#### → credibility_tier (A/B/C, for confidence scoring)."""
    labels, tiers = {}, {}
    if not SOURCES_DIR.exists():
        return labels, tiers
    for p in SOURCES_DIR.glob("SRC-*.md"):
        b = yaml_block(p.read_text(encoding="utf-8"))
        sid = field(b, "id") or p.stem
        author = field(b, "author") or ""
        # keep the primary name only: drop "(compiler)", lists after ; , or —
        author = re.split(r"[;(,—]|\brecipes by\b", author)[0].strip()[:24]
        stype = (field(b, "type") or "").lower()
        venue = ""
        if "wbrc" in stype or "world brewers" in (field(b, "title") or "").lower():
            venue = "WBrC"
        elif "wbc" in stype:
            venue = "WBC"
        labels[sid] = " · ".join([x for x in [author, venue] if x]) or author
        tier = field(b, "credibility_tier") or ""
        tiers[sid] = tier[:1].upper() if tier else ""
    return labels, tiers


# Trust Matrix (Intelligence/Governance/Trust-Matrix.md §1, §2) — same bands the
# reasoning engine uses. base by tier is the tier midpoint; data quality (how
# complete/reproducible the write-up is) scales it within a ±40% band rather
# than fabricating a separate relevance/freshness/consensus computation the
# dashboard has no live data for.
TIER_BASE = {"A": 0.85, "B": 0.68, "C": 0.55}


def compute_confidence(block, tier):
    comp = field(block, "completeness_score")
    repro = field(block, "reproducibility_score")
    try:
        comp = float(comp)
        repro = float(repro)
        dq = (comp + repro) / 10.0   # each scored 0–5
    except (TypeError, ValueError):
        dq = 0.6
    base = TIER_BASE.get(tier, 0.55)
    score = round(base * (0.6 + 0.4 * dq), 2)
    if score >= 0.80:
        level = "High"
    elif score >= 0.60:
        level = "Medium"
    elif score >= 0.45:
        level = "Low"
    else:
        level = "Provisional"
    return {"score": score, "level": level}


def parse_recipe(path, sources, tiers):
    block = yaml_block(path.read_text(encoding="utf-8"))
    rid = field(block, "id") or path.stem
    name = field(block, "name") or rid
    # keep the display name short — drop a long trailing "— …" clause if present
    short_name = re.split(r"\s+[—-]\s+", name)[0][:46]
    src_ref = field(block, "source_ref") or ""
    short = sources.get(src_ref, "") or (parse_designed(block).split(" · ")[0] if parse_designed(block) else "")
    return {
        "id": rid,
        "name": short_name,
        "full": name,
        "short": short,
        "brewer": field(block, "brewer") or "",
        "grinder": field(block, "grinder_ref") or "",
        "temp": (field(block, "water_temp_c") or "").replace('"', "") + ("°C" if re.fullmatch(r"\d+", str(field(block, "water_temp_c") or "")) else ""),
        "dose": field(block, "dose_g") or "",
        "water": field(block, "water_g") or "",
        "ratio": field(block, "ratio") or "",
        "p": parse_profile(block),
        "designed": parse_designed(block) or "any coffee",
        "strategy": scrub_filler(field(block, "claimed_outcome") or ""),
        "outcome": scrub_filler(field(block, "claimed_outcome") or ""),
        "steps": parse_steps(block),
        "status": field(block, "status") or "ingested",
        "confidence": compute_confidence(block, tiers.get(src_ref, "")),
    }


# Recipe visuals follow Intelligence/Recipe-Visual-Policy.md. Exact saved recipe
# art wins; then Lume, coffee/origin/farm, and finally cafe matches. This keeps
# the public site independent of the workspace while preserving a stable match.
VISUAL_STOP_WORDS = {"recipe", "routine", "world", "brewers", "cup", "coffee", "hario", "switch", "pour", "drip", "hot", "iced", "the", "and", "any", "unspecified", "light", "medium", "natural", "washed"}


def visual_tokens(value):
    tokens = re.findall(r"[a-z0-9]+", value.lower())
    aliases = {"woelfl": "wolfl"}
    return {aliases.get(x, x) for x in tokens if len(x) > 1 and x not in VISUAL_STOP_WORDS}


def select_visual(recipe):
    if not VISUALS_DIR.exists():
        return None
    name_tokens = visual_tokens(recipe["name"])
    context = " ".join([recipe["name"], recipe.get("full", ""), recipe.get("designed", "")])
    context_tokens = visual_tokens(context)
    recipe_files = [p for p in (VISUALS_DIR / "Recipes").glob("*") if p.is_file()]
    scored = [(len(name_tokens & visual_tokens(p.stem)), p) for p in recipe_files]
    scored = [x for x in scored if x[0] >= 2]
    if scored:
        return sorted(scored, key=lambda x: (-x[0], x[1].name.lower()))[0][1]
    all_visuals = [p for p in VISUALS_DIR.rglob("*") if p.is_file() and not p.name.startswith(".")]
    if "lume" in context_tokens:
        lume = [p for p in all_visuals if "lume" in p.stem.lower()]
        if lume:
            return sorted(lume, key=lambda p: p.name.lower())[sum(map(ord, recipe["id"])) % len(lume)]
    for origin in ("ethiopia", "kenya", "colombia", "panama", "ecuador", "costa", "nicaragua", "thailand"):
        if origin in context_tokens:
            origin_matches = [p for p in all_visuals if origin in p.stem.lower()]
            if origin_matches:
                return sorted(origin_matches, key=lambda p: p.name.lower())[0]
    if "glitch" in context_tokens:
        glitch = [p for p in all_visuals if "glitch" in p.stem.lower()]
        if glitch:
            return sorted(glitch, key=lambda p: p.name.lower())[0]
    scored = [(len(context_tokens & visual_tokens(p.stem)), p) for p in all_visuals]
    scored = [x for x in scored if x[0] >= 1]
    if scored:
        return sorted(scored, key=lambda x: (-x[0], x[1].name.lower()))[0][1]
    return None


def attach_recipe_visual(recipe):
    source = select_visual(recipe)
    if not source:
        recipe["image"] = ""
        return
    # The dashboard has a single surface (brew-helper-site/index.html), which is
    # also the Pages build output root, so one copy beside it serves both local
    # previews and the deployed site.
    SITE_VISUALS_DIR.mkdir(parents=True, exist_ok=True)
    safe = re.sub(r"[^a-z0-9]+", "-", source.stem.lower()).strip("-")
    filename = f"{recipe['id'].lower()}-{safe}{source.suffix.lower()}"
    shutil.copy2(source, SITE_VISUALS_DIR / filename)
    recipe["image"] = f"assets/recipe-visuals/{filename}"


def build_lexicon(lex):
    """Flatten the flavour encyclopedia into a scan list + per-family read hints.
       terms: [{t: matchable-lowercase, c: canonical Title Case, f: family}] longest-first."""
    terms, fam_read = [], {}
    for family, fam in lex.get("families", {}).items():
        fam_read[family] = fam.get("read", {"s": [], "c": [], "a": []})
        for canonical, aliases in fam.get("notes", {}).items():
            display = canonical.title()
            for form in [canonical] + list(aliases):
                terms.append({"t": form.lower(), "c": display, "f": family})
    # longest phrases first so "passion fruit" wins before "fruit", "black tea" before "tea"
    terms.sort(key=lambda x: -len(x["t"]))
    return {"terms": terms, "familyRead": fam_read}


def build_couple_matrix(model):
    idx = {a: i for i, a in enumerate(AXES)}
    n = len(AXES)
    M = [[0.0] * n for _ in range(n)]
    for pair in model["coupling"]["pairs"]:
        a, b, v = idx[pair["a"]], idx[pair["b"]], pair["v"]
        M[a][b] = v
        M[b][a] = v
    return M


def main():
    if not RECIPES_DIR.exists():
        sys.exit(f"Recipes dir not found: {RECIPES_DIR}")
    model = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
    lexicon = json.loads(LEXICON_PATH.read_text(encoding="utf-8")) if LEXICON_PATH.exists() else {"families": {}}

    sources, tiers = load_sources()
    all_recipes = [parse_recipe(p, sources, tiers) for p in sorted(RECIPES_DIR.glob("RCP-*.md"))]
    for recipe in all_recipes:
        attach_recipe_visual(recipe)
    # only fully-ingested (proceed-gate) recipes enter the live recommendation
    # library — parked/rejected recipes are corroboration-only evidence
    # (Ingestion-Pipeline.md §1) and must not surface as if fully vetted.
    skipped = [r["id"] for r in all_recipes if r["status"] != "ingested"]
    recipes = [r for r in all_recipes if r["status"] == "ingested"]
    data = {
        "axes": AXES,
        "presets": model["presets"],
        "gain": model["coupling"]["gain"],
        "couple": build_couple_matrix(model),
        "coach": model.get("coach", {}),
        "pouring": model.get("pouring", {}),
        "read": model["read"],
        "grind": model.get("grind", {}),
        "keywords": model.get("keywords", {}),
        "lexicon": build_lexicon(lexicon),
        "recipes": recipes,
        "generatedAt": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "recipeCount": len(recipes),
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    block = (
        f"{MARK_START}\n"
        f"<script>/* GENERATED by build/sync-brew-data.py — do not edit by hand. "
        f"Re-run the script to refresh from the Knowledge Repository. */\n"
        f"window.BH_DATA={payload};</script>\n"
        f"{MARK_END}"
    )

    OUT_JS.write_text(f"/* GENERATED by build/sync-brew-data.py */\nwindow.BH_DATA={payload};\n", encoding="utf-8")

    for target in TARGETS:
        if not target.exists():
            print(f"  skip (missing): {target.name}")
            continue
        html = target.read_text(encoding="utf-8")
        if MARK_START in html and MARK_END in html:
            html = re.sub(re.escape(MARK_START) + r".*?" + re.escape(MARK_END), lambda m: block, html, flags=re.S)
        else:
            # inject just before the first </head> (data must load before the engine script)
            html = html.replace("</head>", block + "\n</head>", 1)
        target.write_text(html, encoding="utf-8")
        print(f"  wrote data block → {target.relative_to(ROOT)}")

    print(f"Synced {len(recipes)} recipes @ {data['generatedAt']}  ({', '.join(r['id'] for r in recipes)})")
    if skipped:
        print(f"  skipped (not status:ingested — parked/rejected evidence, corroboration-only): {', '.join(skipped)}")


if __name__ == "__main__":
    main()
