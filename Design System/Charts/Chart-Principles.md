# Charts

**Principle:** editorial, not analytical. Charts support a decision — they don't display raw data. Read the trend by shape, not by reading axes.

## Rules

- **Minimal grid.** Hairline rings only (`--border`), no dense gridlines, no boxed frames.
- **Few labels.** Axis names only; values on demand (readout), not stamped on every point.
- **One accent.** The active reading is `--accent` / `--accent-tint`; everything structural stays neutral.
- **Thin strokes.** 1px structure, 2px data line — instrument-like, not chart-junk.
- **Trend over table.** If a number matters, show it as a bar's length or a shape's reach, not a cell.

## The Extraction Radar (primary chart)

- Hexagon, 6 sensory axes: Sweetness · Floral · Acidity · Juiciness · Body · Clarity.
- 4 concentric rings (25/50/75/100%), the outer ring slightly stronger.
- Accent-tinted data polygon with draggable handles (pointer + keyboard `role="slider"`).
- **Reactive downstream:** every change updates the live readout, the coach sentence, and re-ranks recipes via cosine similarity — cause and effect made visible.
- Preset changes **tween** (cubic ease, 440ms) so shapes animate rather than snap.

## Supporting meters

- Match bars, readout bars, sliders: a single filled track (`--accent` gradient) on a neutral rail. No ticks, no gridlines. Length is the message.

## Colour in charts

Structure neutral; data accent; semantic hues only if a value carries meaning (e.g. a warning threshold). Grayscale-proof — the shape must read with colour removed.
