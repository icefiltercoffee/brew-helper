# Typography

**Pairing:** Fraunces (serif) for warmth + hierarchy · Inter (sans) for everything functional.
**Principle:** type carries hierarchy — not colour. Readability over density.

```
Fonts:
  Display / headings → 'Fraunces', Georgia, serif   (opsz 9–144, wght 400–600)
  UI / body / data   → 'Inter', system-ui, sans-serif (wght 400–700)
```

## Scale

| Token | Font · weight | Size | Line | Tracking | Use |
|---|---|---|---|---|---|
| `.display` | Fraunces 500 | clamp 36–52 | 1.04 | -.02em | Hero / word-numbers |
| `h1 / .h1` | Fraunces 500 | clamp 28–34 | 1.12 | -.02em | Section titles, coffee names |
| `h2 / .h2` | Fraunces 500 | 24 | 1.20 | -.01em | Card titles |
| `h3 / .h3` | Inter 600 | 18 | 1.35 | -.01em | In-card headings |
| `.body` | Inter 400 | 16 | 1.60 | -.005em | Reading text |
| `.support` | Inter 400 | 15 | 1.55 | — | Secondary (`--ink-2`) |
| `.label` | Inter 600 | 11.5 | caps | .11em | Eyebrows / field labels (`--ink-3`) |
| `.micro` | Inter 400 | 12.5 | 1.4 | — | Captions, attributions |

## Rules

- Numbers: `font-variant-numeric: tabular-nums` (`.tnum`) — ratios, temps, percentages align.
- Serif tightens at large sizes; sans labels open up (`.11em`, uppercase).
- Max ~2 type styles per card. Let size + family do the ranking; avoid bold-spam.
- Body copy target 60–75 chars per line.
