# Colours

**Source of truth:** `:root` in `/brew-helper-site/index.html`
**Principle:** warm neutrals carry everything · one accent = "interactive" · semantics muted & coffee-adjacent · colour = meaning, never decoration · grayscale-proof first.

## Tokens

```css
/* Neutrals — warm paper / morning sunlight */
--bg:            #F6F1E9;   /* page */
--bg-sunk:       #EFE7DA;   /* recessed zones */
--surface:       #FDFBF7;   /* cards */
--surface-2:     #F3ECE0;   /* insets, rails */
--border:        #E7DDCC;   /* hairline */
--border-strong: #D9CDB8;   /* control borders */

/* Ink — warm espresso greys */
--ink:    #2B2620;   /* primary text */
--ink-2:  #6A6055;   /* secondary */
--ink-3:  #9B8F80;   /* labels / microcopy */
--ink-inv:#FBF7F0;   /* text on dark */

/* Accent — roasted terracotta (the ONE interactive colour) */
--accent:        #B65E36;
--accent-strong: #9C4E2A;              /* hover / pressed */
--accent-soft:   #F0DED0;              /* fills / tints */
--accent-tint:   rgba(182,94,54,.10);  /* wash */

/* Sage — from the café plants (secondary / calm positive) */
--sage:      #6E7A5A;
--sage-soft: #E5E8DB;

/* Semantic — restrained, only ever with meaning */
--success:#5F7A52; --success-soft:#E4EBDD;   /* positive / applied */
--warning:#BE8A2E; --warning-soft:#F3E7C9;   /* caution (ochre) */
--info:   #4E6E7C; --info-soft:   #DCE6EA;   /* neutral info (slate) */
```

## Usage rules

- **Accent** is the only hue a user should read as touchable. Buttons (primary), active chips, radar data/handles, links, focus ring.
- **Semantics** appear only attached to meaning: `success` = applied/positive, `warning` = a challenge/caution, `info` = neutral explanation. Always low-saturation.
- **Text on colour:** ink on paper/surface passes AA. Use accent for text only at ≥600 weight or ≥18px; otherwise accent is for fills and strokes.
- **Grayscale test:** desaturate the screen — hierarchy must still hold. If it collapses, fix with weight/space, not colour.

## Focus ring

```css
--ring: 0 0 0 3px rgba(182,94,54,.28);
```
Applied on `:focus-visible` for every interactive element.
