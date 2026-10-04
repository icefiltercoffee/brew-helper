# Cards

**Principle:** every major section is a premium reusable card with one shared shell. Consistency over novelty.

## Base shell

```css
.card{
  background:var(--surface);
  border:1px solid var(--border);      /* hairline, not heavy */
  border-radius:var(--r-lg);           /* 22px */
  padding:var(--s6);                    /* 32 */
  box-shadow:var(--sh-sm);
  transition:box-shadow .24s var(--ease), transform .24s var(--ease);
}
```

## Variants

| Class | Effect | Use |
|---|---|---|
| `.hover` | lift `-2px` + `--sh-md` on hover | any tappable card |
| `.focal` | pre-elevated (`--sh-md`) | the section anchor |
| `.inset` | `--surface-2`, no shadow | inner recessed blocks |
| `.card-pad-lg` | padding 48 | radar, hero anchors |

Inner elements use `--r-md` (16); pills/chips `--r-pill`.

## Card inventory (all inherit the shell)

Bean · AI Analysis · Extraction Radar · Recipe · Recipe Comparison (composite) · Equipment · Feedback · Diagnosis · Community. See `../Component-Inventory.md` for each card's anatomy, states, and data.

## Interaction contract

- Resting `--sh-sm` → hover `--sh-md` + `translateY(-2px)`.
- The committed recipe plan: `border-color:var(--accent)` + elevation; safety and assumption notes are quiet, contextual additions rather than badges.
- Focusable cards get `role="button"`, `tabindex="0"`, Enter/Space handlers, and the shared focus ring.
- Never more than one focal card per viewport (Visual Principles rule).
