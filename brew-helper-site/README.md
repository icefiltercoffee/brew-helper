# Brew Helper — website

Authoritative source of truth for the Brew Helper site. Static, self-contained,
built to deploy to Cloudflare Pages.

## What's here

```
brew-helper-site/              ← repository root  AND  Pages build output directory
├── index.html                 ← the whole site: pinned café scene + dashboard chapters + flavour wheel
├── assets/
│   ├── frames/                ← 91 desktop frames  (frame-001.jpg … frame-091.jpg, 1366×768)
│   └── frames-mobile/         ← 55 mobile frames   (frame-001.jpg … frame-055.jpg, 600×750, portrait)
├── .gitignore
└── README.md
```

`index.html` is fully self-contained: all CSS and JS are inline; fonts (Google
Fonts) and GSAP + ScrollTrigger load from public CDNs. The only local assets are
the frame images, referenced with **relative paths** so they work from any
Cloudflare Pages domain.

## The scroll-linked café scene (Apple AirPods technique)

The scene is one continuous filter-coffee journey shot in a Japanese café window:
hot water pours from the matte-black gooseneck kettle into the Origami dripper,
the bed blooms, and coffee threads past the polished metal sphere down into the
glass carafe. The camera, window, river, sakura, and lighting stay locked across
every frame.

How it works:

- **A fixed, full-viewport `<canvas>` is the scene.** Being `position:fixed` is
  the pin — it stays put in the viewport while the dashboard chapters scroll over
  it. No GSAP pinning gymnastics.
- **All frames preload behind a loading state.** The first (resting) frame shows
  the moment it decodes; a progress bar covers the viewport until the whole set
  is ready.
- **Scroll maps to the frame index, scrubbed smoothly** (`scrub: 0.35` — small,
  so the visual never lags behind the cursor). Scrolling down moves the brew
  forward; scrolling up reverses it exactly. It **never autoplays** and **never
  mutates any dashboard state** — it is a visual layer only.
- **Desktop keeps the subject right-of-centre**, leaving the left as negative
  space where the dashboard chapters float as frosted cards. **Mobile** loads a
  smaller, portrait-cropped set centred on the brewer, full-bleed behind
  full-width cards.
- **`prefers-reduced-motion`:** no scrubbing. A stable key visual is held and
  every dashboard control stays fully usable.

## Scroll chapters

The four functional dashboard steps play as immersive chapters over the scene;
the fifth hands the scene off to the interactive flavour wheel.

| # | Chapter          | Scene state shown         | Dashboard content (unchanged)                             |
|---|------------------|---------------------------|-----------------------------------------------------------|
| 1 | New Brew         | dry coffee bed            | coffee input + validation, gear/roast selects             |
| 2 | Coffee           | the bloom                 | bean card, flavour tags, AI read                          |
| 3 | Extraction Goal  | kettle pour · carafe drip | interactive Extraction Radar, presets, Coach              |
| 4 | Brew Plan        | completed carafe          | committed recipe, step "why", Save / Start timer          |
| 5 | After the Brew   | → scene fades out         | **flavour wheel** + sliders, tasting notes, Diagnose, Apply |

Below the story, Community and the design-system appendix render normally on the
warm-paper background (no scene).

The animation is a scene layer only. It never submits a form, generates a recipe,
starts a timer, changes radar values, saves a recipe, diagnoses a cup, or defines
brew-session progress. The dashboard workflow stays stateful; scroll only drives
the cinematic frame sequence.

## Frame assets — folders & naming convention

Two sets, both zero-padded to three digits and 1-indexed, contiguous with no gaps.
If you re-export the sequence, keep these exact names and counts (or update the
`CFG` block near the bottom of `index.html`):

| Set     | Folder                  | Pattern         | Count | Dimensions | ~Size  |
|---------|-------------------------|-----------------|-------|------------|--------|
| Desktop | `assets/frames/`        | `frame-NNN.jpg` | 91    | 1366×768   | 6.7 MB |
| Mobile  | `assets/frames-mobile/` | `frame-NNN.jpg` | 55    | 600×750    | 2.2 MB |

- `NNN` runs `001 … <count>`; frame `001` is the resting dry-bed state, the last
  frame is the fullest carafe.
- Source was 300 JPG frames (`ezgif-frame-001 … 300`, 1920×1080). The forward
  brew (frames 1–271, where the carafe visibly fills) was resampled — every 3rd
  frame for desktop, every 5th for mobile — to cut file size while keeping the
  scrub smooth. The looping tail (272–300) was dropped so the carafe never
  appears to empty at the end.
- Mobile frames are a 4:5 portrait crop centred on the brewer, so the dripper,
  sphere, and carafe stay sharp and centred on phones.

To change the frame set, regenerate the JPGs into those folders with the same
naming, then set `CFG.count` for desktop/mobile in the scene-controller `<script>`.

## Cloudflare Pages configuration

| Setting                  | Value                                      |
|--------------------------|--------------------------------------------|
| Production branch        | `main`                                     |
| Framework preset         | None                                       |
| Build command            | `exit 0`                                   |
| Build output directory   | `/` (this folder — it contains index.html) |
| Root directory           | repository root                            |

If this folder is committed as a subfolder of a larger repo, set the Pages
**Root directory** to that subfolder.

## Local preview

```bash
npx serve .
# or
python3 -m http.server 8000
```

## CoffeeDB knowledge snapshot

The dashboard includes a generated, attributed snapshot from the public
CoffeeDB coffee index. It is used as engine context when a logged coffee
matches indexed lots; it is not a user-facing lookup or a recipe library.

Refresh the snapshot and regenerate the dashboard data with:

```bash
python3 build/import-coffeedb.py
python3 build/sync-brew-data.py
```

The importer reads the public page only, records its retrieval timestamp, and
does not require a credential. CoffeeDB remains the source; the checked-in
snapshot is the runtime copy used by the static dashboard.
