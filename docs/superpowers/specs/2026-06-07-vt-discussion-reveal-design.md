# VT Discussion — Gold-Framed Turtle Reveal

**Date:** 2026-06-07
**Status:** approved, pending spec review
**Page:** `projects/vt-discussion/index.html` (Papert Lab site; page-scoped CSS/JS, no shared-stylesheet changes)
**Supersedes:** the chalkboard reveal and the photographic-turtle reveal explored earlier in the same branch.

## Goal (the success criterion the ad-hoc iterations lacked)

As the reader scrolls the essay, a LOGO-style turtle robot drives across a gold-framed
picture **mounted on a fixed wall**, drawing the first-discussion photo into existence —
the page's "idea of a discussion group → realized gathering" made literal. The turtle must
read as a *real little machine* (wheels turn, it faces where it drives, it has weight), not
a flat icon, not a ¾ photograph.

Done = on a normal desktop load, the empty framed canvas sits centered on the wall; the
turtle spins once then draws the photo in as you scroll at a controlled pace; by the time
the essay ends the full photo is shown; a tiny caption sits below the frame.

## Locked requirements

- **Layout.** Two columns. Left = the essay, scrolls normally. Right = a **fixed
  full-height "wall"** with its own quiet, non-page background (warm plaster tone, distinct
  from page cream so it reads as a *surface*, not whitespace), spanning `100vh − header`.
  The gold-framed picture is **mounted** on the wall, **vertically centered in the space
  below the header**. The wall does not scroll; only the essay does. (Implementation: sticky
  right panel sized `100vh − header`, flex-centered — functionally fixed during scroll.)
- **Frame.** Reuse the Gemini-generated gilded frame as a CSS `border-image`
  (`img/gold-frame.webp`).
- **Load state.** Empty frame on the wall. **No photo, no ghost/preview, no hint text.**
  (The "scroll — the turtle is drawing" line is removed.)
- **Reveal.** The photo appears *only* where the turtle has driven (a thick serpentine
  pen-trail used as a luminance mask). Nothing of the picture is visible before the turtle
  reaches it.
- **Turtle.** Custom **hand-authored SVG** dome-bot. Near-overhead with a slight **~18°
  tilt** (explicitly *not* ¾) so both wheels read. Styled to look rendered: translucent
  dome (radial gradient + rim highlight), faint PCB hint, soft contact shadow. **Rigged**:
  separate wheel groups (tread/spokes advance with drive speed); a body group that **rotates
  to face heading**; a pen nub at the front.
- **Intro.** On first load the turtle does **one 360° spin in place** (wheels
  counter-spinning) before it begins drawing.
- **Motion model — damped drive.** Target progress is derived from essay scroll position
  (absolute document coordinates; completes exactly when the prose runs out). The turtle's
  *displayed* progress **eases toward the target at a capped per-frame speed** (lerp + max
  step), so a fast scroll cannot teleport it — it keeps driving at a believable pace and
  catches up. Wheel-spin rate and heading are derived from the *damped* speed, so the
  mechanics stay consistent.
- **Caption.** Tiny, **below the frame, outside it**: `first discussion · mill mountain
  coffee · roanoke`. Fades in only once the photo is fully drawn.
- **Fallbacks.** `prefers-reduced-motion` or viewport ≤ 760px → single column, finished
  photo shown statically in the frame, no turtle, no animation.

## Turtle production decision

Hand-built, rigged SVG — **not** AI-text-to-SVG and **not** a vectorized raster. Rationale:
a realistic-looking turtle that also (a) animates separate wheels and (b) rotates cleanly to
heading requires authored geometry; generated/traced SVG is a single non-riggable blob. The
"AI-image" look comes from gradients and shading inside the authored SVG. A CAD/3-D
sprite-atlas turtle remains a clean future swap (drop a turtle atlas + flip a flag) if the
SVG wheels ever feel too flat at display size.

## Architecture (page-scoped, dependency-free)

- **Markup:** `.vt-layout` grid → `.vt-prose` (left) + `aside.vt-wall` (right). `.vt-wall`
  is sticky at `top: header`, height `100vh − header`, flex-centers `.vt-frame`
  (border-image gold) → `.vt-stage` (4:3 clip) containing one inline `<svg>`:
  mask `<path>` (serpentine) + `<image>` photo (masked) + `<g>` turtle (dome, two wheel
  `<g>`s, pen). Caption `<figcaption>` sits *after* `.vt-frame`, outside it.
- **One serpentine path drives four things:** photo reveal (`stroke-dashoffset` on the mask
  path), turtle position (`getPointAtLength`), heading (tangent via a look-ahead point),
  wheel phase (function of distance travelled).
- **Controller (vanilla, rAF):** state machine `INTRO_SPIN → DRAW`. Each frame: compute
  target progress from scroll; lerp displayed progress toward it with a max step (damping);
  set mask offset; place/rotate turtle; advance wheels by Δdistance. Static branch for
  reduced-motion/mobile sets progress = 1 and hides the turtle.

## Build / verify order (de-risk the repeatedly-rejected element first)

1. **Author the turtle SVG standalone** and verify look + intro spin + wheel animation in
   the browser *before wiring anything else*. The turtle's appearance is what's been
   rejected three times — validate it in isolation and iterate until approved.
2. Wall + mounted, header-excluded centered frame; confirm it stays fixed while the essay
   scrolls.
3. Reveal mask + damped drive + heading.
4. Intro spin → draw handoff, caption, fallbacks.
5. Browser-verify: load (empty frame + spin), mid, end (full photo + caption), **fast-flick
   scroll** (damping holds), reduced-motion, ≤760px.

## Out of scope

Chalk treatment (removed). The lorem-ipsum slow-wifi fix (separate, PR #14). Any
shared-stylesheet or other-page changes.
