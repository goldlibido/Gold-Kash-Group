# Champagne Showers — The Descent · Cinematic Edition

A film-grammar scroll-driven site for the Champagne Showers concept (Gold Kash Group · Bader Field, AC).

## What's in the build

20 scenes across three acts, with full cinematic treatment:

- **Cold open** — Gold Kash studio card fades in/out before the experience starts (like a film's production company card).
- **Letterbox bars** — black bars bloom in once the experience begins. Instant cinema framing.
- **Film grain** — animated SVG noise overlay sits on top of everything. The single most "filmic" effect at zero cost.
- **Anamorphic lens flares** — wide horizontal gold streaks on key warm scenes (seal, chandelier, bar, walkway, DJ, bathtub) with a "strong" variant on the floor reveal and spray climax.
- **Match cut** — scene 3 (chandelier on black) → scene 4 (chandelier inside the cellar tunnel). The chandelier holds visually steady while the tunnel walls bloom in around it. This is the Kubrick / Lawrence-of-Arabia transition.
- **Act title cards** — between Acts I→II and II→III, a full-screen card flashes ("Act II · The Approach") with serif chapter type, ~1.8s hold.
- **Per-scene Ken Burns motion** — slow, dolly, and aggressive push-in variants assigned by mood.
- **Floating chapter labels** (I through XX) update on scroll, with a soft crossfade between values.
- **Progress rail** on the right edge, gold gradient fill, glowing.
- **Audio hook** — one commented block in `script.js`. Drop an MP3 at `audio/score.mp3` and uncomment.

## Structure

```
champagne-showers/
├── index.html
├── style.css
├── script.js
├── README.md
└── images/
    ├── 00-seal.png ... 19-spray.png  (20 scenes worth)
```

## Deploy

### Netlify (recommended, matches goldkashgroup.com)

1. Push folder to a new GitHub repo.
2. Netlify: **Add new site → Import from Git → pick repo**.
3. Build command: empty. Publish dir: `/`.
4. Connect a domain (subdomain of goldkashgroup.com or a fresh champagneshowers.com).

### Drag-and-drop (instant preview, no Git)

Unzip the folder. Drag onto **app.netlify.com/drop**. Live URL in seconds.

## Editing the script (copy, scenes)

Each `<section class="scene">` block in `index.html` has:
- `data-scene` (index)
- `data-act` (1, 2, or 3 — triggers act cards on transition)
- `data-chapter` (Roman numeral shown in floating label)
- `data-title` (chapter name)
- `data-flare` (optional: `"warm"` or `"strong"` — enables the anamorphic flare layer)

To re-order, move the `<section>` blocks. To swap copy, edit in place. To swap an image, drop a new file in `images/` and update the `src`.

## Audio (for v2)

The site is designed to support a score. Suggested:
- Ambient track, low BPM, sub-heavy, ~3–4 minutes looping
- Examples to reference: Trent Reznor's *Social Network* opening, the lobby track from *John Wick 2*, anything by Ben Salisbury & Geoff Barrow
- Volume: 0.3–0.4 in the JS hook so it doesn't clip

Drop the file at `audio/score.mp3`, then uncomment the audio block at the bottom of `script.js`.

## Performance notes

- Total payload: ~30MB unoptimized. For production, run images through **squoosh.app** to cut ~60% with no visible quality loss. Convert to WebP for another ~20% with a JPEG fallback.
- First 4 scenes are preloaded before the veil lifts so the opening has no jank.
- Grain layer is opacity 0.07 (0.05 on mobile) — tunable in `style.css` if too noisy.

## Reduced motion

Users with `prefers-reduced-motion: reduce` get the entire experience without Ken Burns, grain animation, or scroll smoothing. Accessibility-respectful by default.

## Browser support

Modern Chrome, Safari, Firefox, Edge. iOS Safari 15+. Tested patterns:
- CSS scroll-snap (universal)
- IntersectionObserver (universal)
- Inline SVG noise (universal)
- `dvh` viewport units (Safari 15.4+, falls back to vh)

---

*Gold Kash Group · 2026*
