"""
Brew Helper — free-text brew description parser.

Turns whatever a user pastes into "What are you brewing today?" (origin,
process, roast, tasting notes, all jumbled together in prose) into a clean,
structured record — without ever inventing data the lexicon can't back up.

GOLDEN RULE: The system trusts the human's intent, but verifies their
vocabulary against a curated reality. If it's not on the wheel, it's not a
tasting note — it's a story. Stories are logged, but never pollute the metrics.

────────────────────────────────────────────────────────────────────────────
PIPELINE (step-by-step)
────────────────────────────────────────────────────────────────────────────
 1. NORMALIZE      lowercase, strip punctuation noise, collapse whitespace,
                    keep the original text untouched for the audit trail.
 2. WINDOW SCAN    walk 3-, 2-, then 1-word phrases (longest match wins) so
                    multi-word entries ("stone fruit", "pulped natural",
                    "costa rica") are matched before their parts are.
 3. BUCKET MATCH   each phrase is tested, in order, against:
                        a. ORIGIN gazetteer      -> origin
                        b. PROCESS keyword list  -> process
                        c. ROAST keyword list    -> roast
                    First bucket to claim a phrase consumes its words; a
                    phrase can only ever land in one bucket per pass.
 4. DISAMBIGUATE   words that exist in *both* a structured bucket and the
                    tasting-note whitelist (e.g. "honey") are re-scored
                    against the proximity/modifier rules before being
                    assigned, instead of being matched greedily.
 5. NOTE MATCH     everything left over is tested against the tasting-note
                    whitelist using, in order: exact match -> plural/singular
                    normalization -> synonym table -> fuzzy match
                    (Levenshtein <= 2). First hit wins; ties go to the
                    smallest edit distance.
 6. REJECT         anything that still doesn't resolve is NOT written to
                    tasting_notes[]. It is preserved verbatim in
                    user_annotations_raw[] and logged as a flag with 2-3
                    suggested alternatives (closest lexicon entries).
 7. EMIT           assemble the JSON object: process, origin, roast,
                    tasting_notes[], user_annotations_raw[], flags[],
                    confidence.

────────────────────────────────────────────────────────────────────────────
"""

import json
import re
from dataclasses import dataclass, field
from difflib import get_close_matches

# ════════════════════════════════════════════════════════════════════════
# 1. LEXICON — the "curated reality". Extend these dicts/sets to grow the
#    system; nothing else in the pipeline needs to change.
# ════════════════════════════════════════════════════════════════════════

# SCA Flavor Wheel (+ common trade extensions). Keys are canonical forms;
# values are the parent category, used for "suggest a parent category"
# fallback and for co-occurrence-free suggestions.
TASTING_WHITELIST = {
    # Fruity
    "berry": "Fruity", "citrus": "Fruity", "stone fruit": "Fruity",
    "apple": "Fruity", "pear": "Fruity", "melon": "Fruity", "kiwi": "Fruity",
    "watermelon": "Fruity", "tropical": "Fruity", "grape": "Fruity",
    "raisin": "Fruity", "prune": "Fruity", "lemon": "Fruity", "orange": "Fruity",
    "grapefruit": "Fruity", "lime": "Fruity", "peach": "Fruity",
    "apricot": "Fruity", "cherry": "Fruity", "blueberry": "Fruity",
    "strawberry": "Fruity", "blackberry": "Fruity", "mango": "Fruity",
    "pineapple": "Fruity", "passionfruit": "Fruity",
    # Floral
    "jasmine": "Floral", "rose": "Floral", "lavender": "Floral",
    "chamomile": "Floral", "hibiscus": "Floral", "orange blossom": "Floral",
    # Sweet
    "caramel": "Sweet", "vanilla": "Sweet", "honey": "Sweet",
    "molasses": "Sweet", "brown sugar": "Sweet", "maple syrup": "Sweet",
    "toffee": "Sweet", "butterscotch": "Sweet",
    # Nutty / Chocolatey
    "almond": "Nutty", "hazelnut": "Nutty", "peanut": "Nutty",
    "walnut": "Nutty", "dark chocolate": "Chocolatey",
    "milk chocolate": "Chocolatey", "cocoa": "Chocolatey", "chocolatey": "Chocolatey",
    # Spicy
    "cinnamon": "Spicy", "clove": "Spicy", "pepper": "Spicy",
    "nutmeg": "Spicy", "anise": "Spicy",
    # Earthy / Roasted
    "tobacco": "Earthy", "leather": "Earthy", "forest": "Earthy",
    "earthy": "Earthy", "toast": "Roasted", "malt": "Roasted", "smoky": "Roasted",
    # Sour/Fermented
    "winey": "Sour/Fermented", "boozy": "Sour/Fermented", "tart": "Sour/Fermented",
    "ferment": "Sour/Fermented", "vinegar": "Sour/Fermented",
    # Clarity / texture descriptors kept as tasting notes, not process
    "clean": "Clarity", "juicy": "Body", "creamy": "Body", "velvety": "Body",
    "syrupy": "Body", "silky": "Body",
}

# Synonym table -> canonical lexicon key. Applied before fuzzy matching.
SYNONYMS = {
    "lemon/orange": "citrus", "orange peel": "citrus", "cacao": "cocoa",
    "cane sugar": "brown sugar", "toasty": "toast", "malty": "malt",
    "choc": "chocolatey", "chocolaty": "chocolatey",
}

# Process vocabulary. "honey" is intentionally ALSO in TASTING_WHITELIST —
# that overlap is exactly what the disambiguator below exists to resolve.
PROCESS_KEYWORDS = {
    "honey", "washed", "natural", "anaerobic", "pulped natural",
    "semi-washed", "semi washed", "wet-hulled", "wet hulled",
    "carbonic maceration", "nitro washed", "double fermented",
}

# Roast vocabulary.
ROAST_KEYWORDS = {
    "light", "medium", "medium-light", "medium light", "medium-dark",
    "medium dark", "dark", "cinnamon", "full city", "city", "city+",
    "french", "vienna", "italian",
}

# Known countries + well-known regions/mills/washing-stations. In production
# this gazetteer would be sourced from a maintained coffee-origin database;
# this is a representative starter set.
ORIGIN_GAZETTEER = {
    "ethiopia", "yirgacheffe", "guji", "sidama", "colombia", "risaralda",
    "huila", "narino", "kenya", "nyeri", "brazil", "cerrado", "guatemala",
    "antigua", "huehuetenango", "costa rica", "tarrazu", "panama", "boquete",
    "rwanda", "indonesia", "sumatra", "sulawesi", "honduras", "el salvador",
    "yemen", "peru", "bolivia", "burundi", "uganda", "tanzania",
}

# Words that never carry meaning on their own — skipped before whitelist /
# fuzzy matching so they don't get flagged as rejected garbage.
STOPWORDS = {
    "a", "an", "the", "of", "in", "on", "at", "with", "and", "or", "but",
    "from", "lot", "mill", "washing", "station", "coffee", "cup", "notes",
    "note", "taste", "tastes", "like", "process", "processed", "roast",
    "roasted", "is", "was", "it", "this", "very", "quite", "some", "sweetness",
    "little", "finish", "on", "a", "bit", "little bit",
}

# Modifier words that, when adjacent to an ambiguous term, signal "this is a
# tasting description, not the processing method".
INTENSITY_MODIFIERS = {
    "subtle", "bright", "hint", "hints", "faint", "delicate", "strong",
    "heavy", "sweetness", "like", "-like", "note", "notes",
}

# Words that, near an ambiguous term, signal "this is the processing method".
PROCESS_CONTEXT_WORDS = {"process", "processed", "method", "dried", "fermented", "processing"}

# Curated semantic hints for common off-lexicon descriptors that keep
# recurring in free text but have no small edit-distance to a real entry
# (so fuzzy matching alone would never catch them). This is exactly the
# "> 5 times across users -> flag for whitelist enrichment" list described
# in the brief — promote an entry here into TASTING_WHITELIST once it earns
# its place, instead of leaving it a permanent hint.
SEMANTIC_HINTS = {
    "pillow": ["creamy", "soft", "velvety"],
    "pillowy": ["creamy", "soft", "velvety"],
    "fluffy": ["creamy", "velvety"],
    "harsh": ["astringent", "sharp"],
    "flat": ["dull", "mild"],
    "thin": ["watery", "light"],
}

# Terms whose bucket assignment is genuinely ambiguous and must go through
# the disambiguator instead of a straight lookup. Extend this set for any
# future word that lives in two lexicons at once (e.g. a future "grape"
# process style vs. the "grape" tasting note).
AMBIGUOUS_TERMS = {"honey"}


# ════════════════════════════════════════════════════════════════════════
# 2. STRING UTILITIES — fuzzy matching, plural normalization, stemming.
# ════════════════════════════════════════════════════════════════════════

def levenshtein(a: str, b: str) -> int:
    """Classic edit distance. Swap this out for rapidfuzz.distance.Levenshtein
    if the dependency is available — same contract, much faster on longer
    corpora."""
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1):
            cur[j] = min(
                prev[j] + 1,        # deletion
                cur[j - 1] + 1,     # insertion
                prev[j - 1] + (ca != cb),  # substitution
            )
        prev = cur
    return prev[-1]


def singularize(word: str) -> str:
    """Cheap plural -> singular normalization. Deliberately conservative:
    it must never fold two *different* lexicon entries together."""
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"          # berries -> berry
    if word.endswith("ches") or word.endswith("shes"):
        return word[:-2]                 # peaches -> peach
    if word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        return word[:-1]                 # nuts -> nut
    return word


def best_fuzzy_match(term: str, vocabulary, max_distance: int = 2):
    """Returns (match, distance) for the closest vocabulary entry within
    max_distance, or (None, None) if nothing qualifies."""
    best, best_d = None, max_distance + 1
    for candidate in vocabulary:
        d = levenshtein(term, candidate)
        if d < best_d:
            best, best_d = candidate, d
    if best is not None and best_d <= max_distance:
        return best, best_d
    return None, None


# ════════════════════════════════════════════════════════════════════════
# 3. TOKENIZATION
# ════════════════════════════════════════════════════════════════════════

@dataclass
class Token:
    text: str            # lowercased word, punctuation stripped
    start: int           # word index in the token stream
    raw: str              # original surface form, for annotations


def tokenize(text: str):
    """Splits on whitespace, strips punctuation, keeps original casing for
    the audit trail alongside the normalized form used for matching."""
    words = re.findall(r"[A-Za-z][A-Za-z'\-]*", text)
    return [Token(text=w.lower(), start=i, raw=w) for i, w in enumerate(words)]


def ngrams(tokens, n):
    """All contiguous n-word phrases, as (phrase, start_index, end_index)."""
    out = []
    for i in range(len(tokens) - n + 1):
        phrase = " ".join(t.text for t in tokens[i:i + n])
        out.append((phrase, i, i + n))
    return out


# ════════════════════════════════════════════════════════════════════════
# 4. DISAMBIGUATION
# ════════════════════════════════════════════════════════════════════════

def disambiguate(term: str, tokens, index: int):
    """Decides whether an AMBIGUOUS_TERMS word at `index` is a process
    mention or a tasting note, per the brief's rules:

      1. Proximity rule  — a process-context word within 3 tokens -> process.
      2. Modifier rule   — an intensity modifier within 3 tokens, and no
                            process-context word closer -> tasting note.
      3. Default         — process wins (processing methods are asserted
                            facts about the lot; tasting notes are opinions
                            about the cup, so the more certain bucket wins
                            ties).

    Returns "process" or "note", plus the reason for the audit trail.
    """
    window_lo, window_hi = max(0, index - 3), min(len(tokens), index + 4)
    window = [tokens[i].text for i in range(window_lo, window_hi) if i != index]

    has_process_ctx = any(w in PROCESS_CONTEXT_WORDS for w in window)
    has_modifier = any(w in INTENSITY_MODIFIERS for w in window)

    if has_process_ctx:
        return "process", f"'{term}' within 3 words of a process-context word"
    if has_modifier:
        return "note", f"'{term}' modified by an intensity/tasting cue"
    return "process", f"'{term}' defaulted to process (no explicit tasting modifier found)"


# ════════════════════════════════════════════════════════════════════════
# 5. RESULT CONTAINER
# ════════════════════════════════════════════════════════════════════════

@dataclass
class ParseResult:
    process: str = None
    origin: str = None
    roast: str = None
    tasting_notes: list = field(default_factory=list)
    user_annotations_raw: list = field(default_factory=list)
    flags: list = field(default_factory=list)
    confidence: float = 1.0

    def to_json(self):
        return json.dumps({
            "process": self.process,
            "origin": self.origin,
            "roast": self.roast,
            "tasting_notes": self.tasting_notes,
            "user_annotations_raw": self.user_annotations_raw,
            "flags": self.flags,
            "confidence": round(self.confidence, 2),
        }, indent=2)


# ════════════════════════════════════════════════════════════════════════
# 6. THE PARSER
# ════════════════════════════════════════════════════════════════════════

def parse_brew_text(text: str) -> ParseResult:
    tokens = tokenize(text)
    consumed = set()          # token indices already claimed by a bucket
    result = ParseResult()
    confidences = []

    # --- pass 1: multi-word phrases first (3-gram, then 2-gram) so
    # "stone fruit" / "costa rica" / "pulped natural" aren't shredded into
    # their component words before they get a chance to match whole. ------
    for n in (3, 2):
        for phrase, i, j in ngrams(tokens, n):
            span = set(range(i, j))
            if span & consumed:
                continue
            if phrase in ORIGIN_GAZETTEER and not result.origin:
                result.origin = phrase.title()
                consumed |= span
            elif phrase in PROCESS_KEYWORDS and not result.process:
                result.process = phrase.title()
                consumed |= span
            elif phrase in ROAST_KEYWORDS and not result.roast:
                result.roast = phrase.title()
                consumed |= span
            elif phrase in TASTING_WHITELIST:
                result.tasting_notes.append(phrase)
                confidences.append(1.0)
                consumed |= span

    # --- pass 2: single words, with the ambiguity + fuzzy-matching stack ---
    for tok in tokens:
        if tok.start in consumed:
            continue

        # Try the word exactly as written first, and only fall back to the
        # singularized form if the exact form matches nothing — this stops
        # words that are already singular but happen to end in "s"
        # ("citrus", "hummus") from being mangled before lookup.
        raw_word = tok.text
        sing_word = singularize(tok.text)
        candidates = [raw_word] if raw_word == sing_word else [raw_word, sing_word]

        if raw_word in STOPWORDS:
            consumed.add(tok.start)
            continue

        word = next((c for c in candidates if c in TASTING_WHITELIST
                     or c in ORIGIN_GAZETTEER or c in PROCESS_KEYWORDS
                     or c in ROAST_KEYWORDS or c in SYNONYMS
                     or c in AMBIGUOUS_TERMS), sing_word)

        if word in AMBIGUOUS_TERMS:
            bucket, reason = disambiguate(word, tokens, tok.start)
            if bucket == "process" and not result.process:
                result.process = word.title()
                result.flags.append({
                    "term": tok.raw, "action": "disambiguated",
                    "suggestions": [], "reason": reason,
                })
            elif bucket == "note":
                result.tasting_notes.append(word)
                confidences.append(1.0)
                result.flags.append({
                    "term": tok.raw, "action": "disambiguated",
                    "suggestions": [], "reason": reason,
                })
            consumed.add(tok.start)
            continue

        if word in ORIGIN_GAZETTEER and not result.origin:
            result.origin = word.title()
            consumed.add(tok.start)
            continue
        if word in PROCESS_KEYWORDS and not result.process:
            result.process = word.title()
            consumed.add(tok.start)
            continue
        if word in ROAST_KEYWORDS and not result.roast:
            result.roast = word.title()
            consumed.add(tok.start)
            continue
        # a second origin/process/roast mention (schema only keeps one) is
        # still structured vocabulary, not an unrecognized tasting note —
        # drop it silently rather than rejecting it as gibberish.
        if word in ORIGIN_GAZETTEER or word in PROCESS_KEYWORDS or word in ROAST_KEYWORDS:
            consumed.add(tok.start)
            continue

        # tasting note: exact -> synonym -> fuzzy
        if word in TASTING_WHITELIST:
            result.tasting_notes.append(word)
            confidences.append(1.0)
            consumed.add(tok.start)
            continue
        if word in SYNONYMS:
            canonical = SYNONYMS[word]
            result.tasting_notes.append(canonical)
            confidences.append(0.95)
            result.flags.append({
                "term": tok.raw, "action": "auto-corrected",
                "suggestions": [canonical], "reason": "synonym mapping",
            })
            consumed.add(tok.start)
            continue

        match, dist = best_fuzzy_match(word, TASTING_WHITELIST.keys(), max_distance=2)
        if match:
            result.tasting_notes.append(match)
            conf = 1.0 - (dist / max(len(word), 1)) * 0.5
            confidences.append(max(0.5, conf))
            result.flags.append({
                "term": tok.raw, "action": "auto-corrected",
                "suggestions": [match], "reason": f"fuzzy match (edit distance {dist})",
            })
            consumed.add(tok.start)
            continue

        # --- REJECTION PROTOCOL ---
        # Not on the wheel. Preserve verbatim, never pollute tasting_notes[].
        # Suggestion order: curated semantic hint -> fuzzy near-misses ->
        # generic parent-category prompt (last resort, always available).
        if word in SEMANTIC_HINTS:
            suggestions = SEMANTIC_HINTS[word]
        else:
            suggestions = get_close_matches(word, TASTING_WHITELIST.keys(), n=3, cutoff=0.5)
        if not suggestions:
            suggestions = sorted(set(TASTING_WHITELIST.values()))[:3]
        result.user_annotations_raw.append(tok.raw)
        result.flags.append({
            "term": tok.raw, "action": "rejected",
            "suggestions": suggestions, "reason": "not in lexicon",
        })
        consumed.add(tok.start)

    result.tasting_notes = list(dict.fromkeys(result.tasting_notes))  # de-dupe, keep order
    result.confidence = sum(confidences) / len(confidences) if confidences else 1.0
    return result


# ════════════════════════════════════════════════════════════════════════
# 7. TEST HARNESS
# ════════════════════════════════════════════════════════════════════════

TEST_INPUTS = [
    # 1. Straightforward case — origin, process, roast, clean tasting notes.
    "Colombia Risaralda, washed, light roast. Berry, citrus, stone fruit.",

    # 2. The edge case named in the brief: "honey" as both process and note.
    "Ethiopia Yirgacheffe honey process with honey sweetness and jasmine.",

    # 3. Typos + plurals, to exercise fuzzy matching and singularization.
    "Kenya, natural, medium roast. Berries, chocolaty, hazelnutt, vanila.",

    # 4. The rejection edge case named in the brief: an invalid descriptor.
    "Panama Boquete, washed. Tastes like a soft pillow, with subtle honey.",

    # 5. Dense real-world paste: multi-word origin/process phrases mixed in.
    "Costa Rica Tarrazu, pulped natural, medium-dark. Dark chocolate, "
    "brown sugar, clove, a little muddy on the finish.",
]


def run_tests():
    for i, text in enumerate(TEST_INPUTS, 1):
        print(f"\n{'=' * 78}\nTEST {i}: {text}\n{'-' * 78}")
        result = parse_brew_text(text)
        print(result.to_json())


if __name__ == "__main__":
    run_tests()
