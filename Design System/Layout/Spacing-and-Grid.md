# Spacing & Grid

**Principle:** one 4px rhythm everywhere · spacing is the calm · spacious, never wasteful.

## Scale (4px base)

```css
--s1:4;  --s2:8;  --s3:12; --s4:16; --s5:24;
--s6:32; --s7:48; --s8:64; --s9:96;   /* px */
```

## Application

| Context | Value |
|---|---|
| Between sections | `--s9` (96) |
| Card padding (desktop) | `--s6` (32) · anchors `--s7` (48) |
| Card padding (mobile) | `--s5` (24) |
| Grid gutter | 24–32 |
| Stack inside card | 16 (items) · 24 (groups) |
| Control padding | 9–11 × 16–20 |

## Grid

- **Container** max 1160px, 28px side padding (18 on mobile).
- **Desktop (>900):** multi-column — radar 1.08fr / 0.92fr; recipes 3-up; bean 220px + fluid.
- **Tablet (≤900):** radar stacks; recipes 2-up; AI blocks + reflection stack.
- **Mobile (≤640):** single column; recipes → horizontal snap rail; nav search → hamburger.

Hierarchy is preserved at every size — the three anchors (Coffee, Radar, Recipe) always lead; layout reflows, it doesn't flatten.

## Radius & elevation (shared with cards)

```css
--r-sm:10; --r-md:16; --r-lg:22; --r-xl:28; --r-pill:999;
--sh-sm:0 1px 2px rgba(43,38,32,.05);
--sh-md:0 6px 24px -10px rgba(43,38,32,.14);
--sh-lg:0 26px 60px -28px rgba(43,38,32,.26);
```
