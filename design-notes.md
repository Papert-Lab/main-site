# Papert Lab Design Notes

## Image Analysis
- Hero (`hero.png`): 512x317, RGBA with transparent background. Source at `~/Downloads/Group 4.png` is identical resolution — no hi-res available. Created 2x upscale (1024x634) for retina.
- Dominant illustration edge color: `#f2ece1` (sampled 13,949 pixels). Set `--bg` to match.
- Manifesto: 2406x1760, 9.4MB PNG. Compressed to WebP: 137KB@1200w, 64KB@800w, 617KB@2406w.

---

## Experiment 1: Approach C — Simple Confident Sticky
**Branch:** design-overhaul
**What I tried:** Apple-like restraint. Hero section pinned via ScrollTrigger over 500px of scroll. Three phases: (1) slight parallax upward, (2) CSS mask-image gradient rises from bottom hiding desk/bookshelf, (3) scale down + clip-path to isolate chalkboard, translate toward header. Site-name fades in at 85% progress. No desaturation, no fancy dissolve — just clean geometry.
**What works:** The mask rising from bottom feels natural, like fog. The transition from full illustration to header is continuous, not stepped. Background color match (#f2ece1) eliminates the image boundary — illustration bleeds into page.
**What doesn't:** With only 512px source width, the hero looks slightly soft at large viewport sizes even with 2x upscale. The clip-path + scale combination needs careful tuning to land the chalkboard exactly in the header position. Transform origin at `50% 15%` approximates chalkboard center but is fragile across aspect ratios.
**Rating:** 7
**Steal from this:** The mask-image fog effect is the keeper. The pinning mechanics work well. The 0.5s scrub smoothing makes it feel physical.

---

## Critic Scores — Pass 1

| Dimension | Score | Notes |
|---|---|---|
| 1. Hero image presence | 6 | Soft at 512px native. 85vw helps but retina screens expose the low res. No fix without a better source. |
| 2. Background integration | 9 | #f2ece1 sampled from 14K pixels. Transparent PNG edges dissolve perfectly into page. |
| 3. Scroll animation smoothness | 7 | GSAP scrub at 0.5 keeps it fluid. Only transforms + mask (composite properties). |
| 4. Scroll animation feel | 7 | Fog-from-below feels atmospheric. The scale-down is geometric but not mechanical. |
| 5. Sticky header transition | 6 | The chalkboard-to-header morph is conceptually right but needs pixel-perfect endpoint tuning. |
| 6. Typography & color warmth | 8 | All browns/warm grays. No pure black. Nav uppercase with 2.5px tracking. Serif body. |
| 7. Content density & rhythm | 7 | Three real content sections, proper card design, manifesto image. Not yet a portfolio piece — needs real copy. |
| 8. Mobile (375px) | 7 | Responsive breakpoint at 500px. Cards stack. Hero goes full-width. Nav compresses. |

**Average: 7.1** — Meets threshold. Next: test Approaches A and B, then refine the winner.
