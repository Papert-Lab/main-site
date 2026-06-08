# Gold-Framed Turtle Reveal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On `projects/vt-discussion/index.html`, a hand-authored 2.5-D SVG turtle robot drives across a gold-framed picture mounted on a fixed wall, drawing the first-discussion photo in as the essay scrolls (intro spin, turning wheels, heading rotation, damped speed), per `docs/superpowers/specs/2026-06-07-vt-discussion-reveal-design.md`.

**Architecture:** Page-scoped CSS/JS in one HTML file, no dependencies. A sticky full-height "wall" panel flex-centers the gold `border-image` frame in the space below the header; one serpentine SVG path drives a luminance-mask photo reveal, the turtle's position, its heading, and its wheel phase; a rAF controller damps displayed-progress toward scroll-target and runs an `INTRO_SPIN → DRAW` state machine.

**Tech Stack:** HTML, CSS (sticky, grid, `border-image`, `mask`), vanilla JS (`requestAnimationFrame`, SVG `getPointAtLength`); macOS `python3 -m http.server` + claude-in-chrome for verification.

**Testing note:** No unit-test harness exists for a static page. Verification = serve locally, drive with the Chrome MCP, screenshot at defined scroll states, assert against explicit visual criteria, and read the console for errors. The turtle's *appearance* is validated in an isolated lab file and iterated until Hudson approves before any wiring.

---

### Task 1: Turtle SVG lab — author and validate the look in isolation

**Files:**
- Create: `projects/vt-discussion/_lab/turtle-lab.html` (throwaway harness; deleted in Task 6)

**Rig contract the SVG MUST expose (consumed verbatim in Task 4):**
- Root group `#tg` — the whole turtle; the controller sets `transform="translate(x,y) rotate(headingDeg)"` on it. Authored geometry must be drawn centered on (0,0) and "pointing up" (heading 0 = nose toward −Y), tilted ~18° so both wheels are visible.
- Two wheel groups `.tw` (left/right) — each contains a tread/spoke pattern drawn so that setting `transform="rotate(deg)"` (about the wheel's own local center) reads as rolling.
- Everything else (dome, PCB hint, pen nub, contact shadow) is static within `#tg`.

- [ ] **Step 1: Create the lab harness with the turtle rig skeleton**

```html
<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#e9e2d4;display:grid;place-items:center;height:100vh}
  svg{width:280px;height:280px;overflow:visible}
  .ctl{position:fixed;top:12px;left:12px;font:13px sans-serif}
</style></head><body>
<svg viewBox="-100 -100 200 200">
  <defs>
    <radialGradient id="dome" cx="42%" cy="36%" r="70%">
      <stop offset="0%" stop-color="#fff7e6" stop-opacity=".95"/>
      <stop offset="38%" stop-color="#d9b familiarize"/>            <!-- PLACEHOLDER: refine in Step 3 -->
    </radialGradient>
  </defs>
  <g id="tg" transform="rotate(0)">
    <ellipse cx="0" cy="34" rx="78" ry="20" fill="#000" opacity=".18"/>     <!-- contact shadow -->
    <g class="tw" data-side="l" transform="translate(-60,6)"><!-- wheel drawn here, local center 0,0 --></g>
    <g class="tw" data-side="r" transform="translate(60,6)"><!-- wheel --></g>
    <!-- body + dome + PCB hint + pen nub, centered on 0,0, nose toward -Y -->
  </g>
</svg>
<div class="ctl"><button id="spin">spin</button> <button id="roll">roll</button></div>
<script>
  var tg=document.getElementById('tg'), wheels=[].slice.call(document.querySelectorAll('.tw'));
  var deg=0; setInterval(function(){deg=(deg+6)%360; wheels.forEach(function(w){var b=w.getAttribute('transform').match(/translate\([^)]*\)/)[0]; w.setAttribute('transform', b+' rotate('+deg+')');});},40);
  document.getElementById('spin').onclick=function(){tg.style.transition='transform 1.1s ease-in-out'; tg.setAttribute('transform','rotate(360)'); setTimeout(function(){tg.style.transition='';tg.setAttribute('transform','rotate(0)');},1150);};
</script></body></html>
```

- [ ] **Step 2: Serve and open the lab**

Run: `cd projects/vt-discussion && (lsof -ti tcp:8765|xargs kill -9 2>/dev/null; nohup python3 -m ../../../$(pwd) 2>/dev/null & ) ` — simpler: from repo root `python3 -m http.server 8765` (background), open `http://localhost:8765/projects/vt-discussion/_lab/turtle-lab.html` in the Chrome MCP, screenshot.
Expected: a turtle-ish SVG renders; wheels visibly rotate; "spin" button spins the whole body.

- [ ] **Step 3: Author the real geometry and iterate visually**

Replace the placeholder gradient and draw the dome-bot: translucent dome (radial gradient `#fff7e6→#caa15a` with a rim highlight), faint green PCB arc under the dome, two tan wheels with 6–8 tread ticks each (drawn about local 0,0), a small pen nub at nose (−Y). Tilt the whole composition ~18° from overhead (squash Y slightly, offset wheels) so both wheels read. Screenshot, compare to the dome-robot reference, refine paths/gradients. **Acceptance (Hudson):** "reads as the real dome turtle-bot, not a flat icon; wheels clearly turn; not ¾." Iterate until approved.

- [ ] **Step 4: Commit the validated turtle**

```bash
git add projects/vt-discussion/_lab/turtle-lab.html
git commit -m "feat(vt-discussion): turtle SVG lab — validated dome-bot look + rig"
```

---

### Task 2: Wall + mounted, header-excluded centered frame

**Files:**
- Modify: `projects/vt-discussion/index.html` (replace the `.vt-pane`/`.vt-frame` styles + `aside` markup; keep the prose `section` and `border-image` frame asset)

- [ ] **Step 1: Replace the right-column CSS with the wall + mount**

```css
.vt-layout{display:grid;grid-template-columns:minmax(0,60ch) 1fr;gap:3.5rem;align-items:start}
.vt-prose{min-width:0}
/* fixed wall: own surface, spans below the header, does not scroll */
.vt-wall{position:sticky;top:var(--vt-top,84px);height:calc(100vh - var(--vt-top,84px));
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.55rem;
  background:radial-gradient(120% 90% at 50% 35%,#efe7d7,#e4dac6);
  box-shadow:inset 0 0 60px rgba(120,98,60,.12)}
.vt-frame{margin:0;border:17px solid transparent;border-image:url("img/gold-frame.webp") 72 stretch;
  box-shadow:0 18px 44px -22px rgba(40,28,10,.55);width:min(80%,640px)}
.vt-stage{position:relative;aspect-ratio:4/3;overflow:hidden;background:#efe9dc}
.vt-svg{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible}
.vt-cap{font:.62rem/1 -apple-system,sans-serif;letter-spacing:.14em;text-transform:lowercase;
  color:var(--text-tertiary);opacity:0;transition:opacity .5s}
@media (max-width:760px){.vt-layout{grid-template-columns:1fr;gap:2rem}
  .vt-wall{position:static;height:auto;background:none;box-shadow:none}}
@media (prefers-reduced-motion:reduce){.vt-wall{position:static;height:auto}}
```

- [ ] **Step 2: Replace the aside markup (wall → frame → stage → svg; caption OUTSIDE/below frame)**

```html
<aside class="vt-wall" aria-hidden="true">
  <figure class="vt-frame"><div class="vt-stage">
    <svg class="vt-svg" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" role="img">
      <defs><mask id="vt-pen" maskUnits="userSpaceOnUse" x="-220" y="-220" width="1640" height="1340">
        <path id="vt-trail" fill="none" stroke="#fff" stroke-width="216" stroke-linecap="round" stroke-linejoin="round"></path>
      </mask></defs>
      <image id="vt-photo" href="img/first-discussion-1600.jpg" x="0" y="0" width="1200" height="900"
             preserveAspectRatio="xMidYMid slice" mask="url(#vt-pen)"></image>
      <!-- turtle <g id="tg"> from Task 1 pasted here (scaled to ~230 tall) -->
    </svg>
  </div></figure>
  <figcaption class="vt-cap" id="vt-cap">first discussion · mill mountain coffee · roanoke</figcaption>
</aside>
```

- [ ] **Step 3: Verify the mount**

Serve; open the page in Chrome at scroll 0; screenshot. Expected: gold frame centered vertically in the space *below* the header on a visible plaster wall; **empty stage (no photo, no ghost, no hint text)**; essay on the left. Scroll down a little; expected: wall + frame stay put, essay scrolls. Read console: no errors.

- [ ] **Step 4: Commit**

```bash
git add projects/vt-discussion/index.html
git commit -m "feat(vt-discussion): fixed wall with mounted, centered gold frame"
```

---

### Task 3: Serpentine reveal + damped drive + heading (turtle static for now)

**Files:**
- Modify: `projects/vt-discussion/index.html` (replace the controller `<script>`)

- [ ] **Step 1: Paste the controller (path, damping, heading, reveal). Turtle wheel/spin added in Task 4.**

```html
<script>
(function(){
  var trail=document.getElementById('vt-trail');
  var tg=document.getElementById('tg');
  var wheels=[].slice.call(document.querySelectorAll('.tw'));
  var layout=document.querySelector('.vt-layout');
  var wall=document.querySelector('.vt-wall');
  var prose=document.querySelector('.vt-prose');
  var cap=document.getElementById('vt-cap');
  if(!trail||!tg||!layout) return;
  if(prose) prose.classList.add('visible');                 // essay never depends on .reveal observer

  var VB_W=1200, VB_H=900, ROWS=6;
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function topOffset(){return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vt-top'))||84;}
  function clamp(v,a,b){return v<a?a:(v>b?b:v);}

  function buildPath(){var g=VB_H/ROWS,r=g/2,d='';for(var i=0;i<ROWS;i++){var y=g/2+i*g,l2r=i%2===0,
    xs=l2r?0:VB_W,xe=l2r?VB_W:0;if(i===0)d+='M '+xs+' '+y+' ';d+='L '+xe+' '+y+' ';
    if(i<ROWS-1){var yn=g/2+(i+1)*g;d+='A '+r+' '+r+' 0 0 '+(l2r?1:0)+' '+xe+' '+yn+' ';}}return d;}
  trail.setAttribute('d',buildPath());
  var L=trail.getTotalLength(); trail.style.strokeDasharray=L;

  function target(){var t=topOffset(),rc=layout.getBoundingClientRect(),at=rc.top+scrollY,
    s=at-t,e=at+layout.offsetHeight-innerHeight; if(e<=s)return 1; return clamp((scrollY-s)/(e-s),0,1);}

  var shown=0, EASE=0.12, MAX_STEP=0.010;     // damped drive: lerp toward target, capped per frame
  function placeTurtle(p){
    var pt=trail.getPointAtLength(L*p), a=trail.getPointAtLength(Math.min(L,L*p+2));
    var deg=Math.atan2(a.y-pt.y,a.x-pt.x)*180/Math.PI+90;   // +90: art points up at heading 0
    tg.setAttribute('transform','translate('+pt.x+','+pt.y+') rotate('+deg+')');
  }
  function draw(p){trail.style.strokeDashoffset=L*(1-p); placeTurtle(p);
    if(cap) cap.style.opacity=p>0.9?(p-0.9)/0.1:0;}

  function staticShow(){trail.style.strokeDashoffset=0; tg.style.display='none'; if(cap)cap.style.opacity=1;}
  if(reduce||innerWidth<=760){staticShow(); return;}

  function tick(){shown+=clamp(target()-shown,-MAX_STEP,MAX_STEP)*1; draw(shown); requestAnimationFrame(tick);}
  // NB: lerp form -> shown += (target-shown)*EASE, then clamp the step to MAX_STEP:
  function tick2(){var d=(target()-shown)*EASE; d=clamp(d,-MAX_STEP,MAX_STEP); shown=clamp(shown+d,0,1); draw(shown); requestAnimationFrame(tick2);}
  requestAnimationFrame(tick2);
})();
</script>
```

- [ ] **Step 2: Verify reveal + damping**

Serve; load; slow-scroll to mid — expected: photo revealed up to the turtle, turtle sits at the leading edge facing its travel direction. **Fast-flick** to the bottom — expected: the reveal does NOT jump to full; the turtle keeps driving and catches up over ~1s (damping). At rest at bottom: full photo + caption. Console: no errors.

- [ ] **Step 3: Tune `EASE`/`MAX_STEP` if the catch-up feels too slow/fast, re-verify, commit**

```bash
git add projects/vt-discussion/index.html
git commit -m "feat(vt-discussion): serpentine reveal with damped drive + heading"
```

---

### Task 4: Intro spin → draw handoff + turning wheels

**Files:**
- Modify: `projects/vt-discussion/index.html` (controller: add state machine + wheel phase)

- [ ] **Step 1: Add the `INTRO_SPIN → DRAW` machine and wheel rolling**

```js
// inside the IIFE, replace tick2 with the state machine:
var phase='intro', t0=null, SPIN_MS=1100, startPt=trail.getPointAtLength(0);
var wheelDeg=0, prevLen=0;
function rollWheels(curLen){var dl=Math.abs(curLen-prevLen); prevLen=curLen; wheelDeg=(wheelDeg+dl*1.2)%360;
  wheels.forEach(function(w){var base=w.getAttribute('data-base')||(function(){var b=w.getAttribute('transform');w.setAttribute('data-base',b);return b;})();
    w.setAttribute('transform',base+' rotate('+wheelDeg+')');});}
function loop(ts){
  if(phase==='intro'){
    if(t0===null)t0=ts; var k=clamp((ts-t0)/SPIN_MS,0,1);
    var spin=k*360; wheelDeg=(360-spin)%360;            // wheels counter-spin during the pirouette
    tg.setAttribute('transform','translate('+startPt.x+','+startPt.y+') rotate('+spin+')');
    wheels.forEach(function(w){var base=w.getAttribute('data-base')||(function(){var b=w.getAttribute('transform');w.setAttribute('data-base',b);return b;})();
      w.setAttribute('transform',base+' rotate('+wheelDeg+')');});
    if(k>=1)phase='draw';
  } else {
    var d=clamp((target()-shown)*EASE,-MAX_STEP,MAX_STEP); shown=clamp(shown+d,0,1);
    trail.style.strokeDashoffset=L*(1-shown); placeTurtle(shown); rollWheels(L*shown);
    if(cap)cap.style.opacity=shown>0.9?(shown-0.9)/0.1:0;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

- [ ] **Step 2: Verify the intro + wheels**

Serve; hard-reload; **without scrolling** — expected: empty frame, turtle parked at start doing ONE ~1.1s 360° spin (wheels counter-spinning), then it settles. Scroll — expected: it drives and the wheels visibly roll forward; faster scroll → faster roll (still damped). Console: no errors.

- [ ] **Step 3: Commit**

```bash
git add projects/vt-discussion/index.html
git commit -m "feat(vt-discussion): intro spin + rolling wheels"
```

---

### Task 5: Full verification matrix

**Files:** none (verification only)

- [ ] **Step 1: Desktop states** — screenshot at scroll 0 (empty frame + post-spin turtle, no photo/ghost/hint), ~50% (half drawn, wheels rolling, heading correct), bottom (full photo + tiny caption below frame). Wall stays fixed; essay scrolls; caption is OUTSIDE the frame.
- [ ] **Step 2: Fast-scroll** — flick to bottom; confirm damping (no teleport; ~1s catch-up).
- [ ] **Step 3: Reduced-motion / mobile** — emulate ≤760px (or read computed styles): single column, full photo static, turtle hidden, no animation.
- [ ] **Step 4: Console clean** — `read_console_messages` onlyErrors: none.

---

### Task 6: Cleanup + PR

**Files:**
- Delete: `projects/vt-discussion/_lab/turtle-lab.html`

- [ ] **Step 1: Remove the lab file**

```bash
git rm projects/vt-discussion/_lab/turtle-lab.html
```

- [ ] **Step 2: Commit + push; PR #15 updates**

```bash
git commit -m "chore(vt-discussion): remove turtle lab harness"
git push origin feat/vt-discussion-chalkboard-reveal
```

- [ ] **Step 3: Update PR #15 body** to describe the final design (wall + mounted centered frame, hand-authored SVG dome-bot with intro spin + rolling wheels + heading, damped drive, no load-time photo, tiny caption below).

---

## Self-Review

**Spec coverage:** wall/non-scrolling + mounted centered frame → T2. No load-time photo/ghost/hint → T2 (markup) + T3 (mask starts at 0). Hand-authored rigged SVG, ~18° tilt, not ¾ → T1. Intro spin → T4. Rolling wheels → T4. Heading rotation → T3. Damped drive → T3. Tiny caption below frame → T2 markup + T3/T4 opacity. Reduced-motion/mobile static → T2 CSS + T3 `staticShow`. Border-image gold frame reused → T2. All covered.

**Placeholder scan:** the only intentional placeholders are inside the *lab* gradient (T1 Step 1), explicitly resolved in T1 Step 3 (visual iteration) — the production controller code is complete. No "add error handling"/"similar to" placeholders.

**Type/name consistency:** `#tg` (turtle root), `.tw` (wheels), `#vt-trail`, `#vt-photo`, `#vt-cap`, `target()`, `placeTurtle()`, `draw()`, `loop()`, `EASE`, `MAX_STEP`, `shown` used consistently across T1–T4. T3 introduces `draw()`; T4 inlines its body into `loop()` and stops calling `draw()` — consistent (no dangling reference). `data-base` caches the wheel's translate transform so rotate composes about the wheel's local center.
