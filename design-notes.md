# Papert Lab Design Notes

## Image Analysis
- Hero (`hero.png`): 512x317, RGBA with transparent background. Source at `~/Downloads/Group 4.png` is identical resolution -- no hi-res available. Created 2x upscale (1024x634) for retina.
- Dominant illustration edge color: `#f2ece1` (sampled 13,949 pixels via Python/PIL). Set `--bg` to match.
- Manifesto: 2406x1760, 9.4MB PNG. Compressed to WebP: 137KB@1200w, 64KB@800w, 617KB@2406w.

---

## Experiment 1: Approach C -- Pinned hero with mask + scale + clip-path
**Branch:** design-overhaul (commit 57896d4)
**What I tried:** GSAP ScrollTrigger pin over 500px. Four phases: parallax, mask-image fog from bottom, scale(0.35) + clip-path(inset()) to isolate chalkboard, then translate toward header. The idea was to morph the full illustration into a chalkboard-sized sticky header element.
**What works:** The mask-image fog rising from below looked atmospheric. Background color match (#f2ece1) eliminated the image boundary completely.
**What doesn't:** The scale + clip-path combination was brittle -- transform origin at `50% 15%` doesn't track the chalkboard center reliably across aspect ratios. After the image scaled down, it didn't land in the header position cleanly. The pinned section created ~500px of dead space after the illustration dissolved, making the page feel hollow.
**Rating:** 5
**Steal from this:** The mask-image fog effect. The background color sampling approach.

---

## Experiment 2: Approach A -- Pinned hero with mask dissolve + opacity fade
**Branch:** design-overhaul (commit 07b10e5)
**What I tried:** Simplified version -- dropped clip-path and scale entirely. Pinned hero over 400px. Mask rises from bottom, opacity fades to 0, header name fades in via GSAP fromTo at 70% progress. Clean handoff instead of trying to morph.
**What works:** The dissolve looks right -- desk, turtle, bookshelf disappear into fog, leaving just the chalkboard ghost before it fades entirely. Header name appears on schedule.
**What doesn't:** Still creates dead space. The pinned section holds the viewport after the image fades, so you scroll through ~100-200px of empty cream before content arrives. Feels like a loading screen.
**Rating:** 6
**Steal from this:** The opacity handoff timing (70% start for header name while image is at 40% opacity). The GSAP fromTo pattern for the site-name.

---

## Experiment 3: Hybrid -- No-pin dissolve with natural scroll
**Branch:** design-overhaul (commit a355d1e)
**What I tried:** Removed pin entirely. Hero scrolls naturally (just like any element). As it scrolls up past 20% of the viewport, GSAP triggers: mask rises from bottom, opacity fades, slight parallax (y: +30 = moves slower than scroll). Content flows immediately below the image. Header name fades in via ScrollTrigger onUpdate progress callback.
**What works:** No dead space. Content is visible on first load below the illustration. The dissolve happens naturally as the image exits the viewport. The parallax-slower effect makes the image feel weighty. The header name appears gradually and feels inevitable rather than bolted on. This is Approach C's simplicity with Approach A's atmosphere.
**What doesn't:** The mask dissolve is less prominent because the image is also physically scrolling away -- the user may not notice the fog effect as much. The animation is subtle rather than dramatic. The parallax y-offset means the image hangs around slightly longer than its DOM position suggests, which on very short viewports could overlap the blurb text.
**Rating:** 8
**Steal from this:** Everything. This is the winner. The no-pin pattern with scroll-linked dissolve gives the best content density and flow. The progress-based header fade is clean.

---

## Critic Scores -- Final (Hybrid approach)

| # | Dimension | Score | Notes |
|---|---|---|---|
| 1 | Hero image presence | 7 | Large at 85vw, max 1024px. Fills viewport. Still 512px native which is soft on 4K, but 2x WebP helps. The illustration itself is commanding. |
| 2 | Background integration | 9 | #f2ece1 sampled from 14K pixels. RGBA transparency at edges. No visible boundary at any viewport size. |
| 3 | Scroll animation smoothness | 8 | No pin = no layout shift. Only transform, opacity, and CSS custom property animated. Scrub at 0.3 is snappy. 60fps confirmed visually. |
| 4 | Scroll animation feel | 7 | Fog from below is atmospheric. The parallax slower-than-scroll gives weight. Subtle rather than dramatic -- acceptable for a research lab site. |
| 5 | Sticky header transition | 8 | Progress-based fade from 0 to 1 over the scroll range. No snap, no flash. The .scrolled class maintains state after hero exits. |
| 6 | Typography & color warmth | 8 | All text uses warm browns (#3D3530, #6B6358, #9B9488). Nav is system sans, uppercase, 2.5px tracking, 13px. Body is Georgia serif. No pure black or cool grays anywhere. |
| 7 | Content density & rhythm | 8 | Hero + blurb visible on load. Three real featured work cards with venue pills. Two-paragraph about section. Manifesto image. Footer with contact + GitHub. Vertical spacing is generous but not wasteful. |
| 8 | Mobile (375px) | 7 | Breakpoint at 500px covers: full-width hero, tighter nav gaps, smaller font sizes, adjusted manifesto height, left-aligned blurb. Cards stack naturally (already column layout). |

**Average: 7.75** -- All dimensions at 7+. Ship-ready for a static portfolio site.

---

## Decision Log
- **Winner:** Hybrid no-pin dissolve (Experiment 3)
- **Why:** Content density > dramatic animation. A research lab site should feel confident and unhurried, not performative. The no-pin approach lets the illustration be large on load and dissolve naturally as you scroll into the work.
- **Rejected:** Pin-based approaches (Experiments 1-2). The dead space problem is inherent to pinning when the pinned element dissolves to nothing. You'd need to bring content into the pinned viewport to solve it, which adds complexity without proportional payoff.
