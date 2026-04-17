# Animation Performance Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 animation/performance issues on the NoCarry landing page to eliminate CPU waste, DOM thrashing, and minor bugs without changing any visual behavior.

**Architecture:** Each fix is surgical — one file changed per task. No new dependencies. No refactors beyond the listed scope. CSS hover replaces JS style mutation where possible; module-level observer singleton replaces per-component IntersectionObserver instances.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS custom properties, Web APIs (IntersectionObserver, requestAnimationFrame, visibilitychange)

---

## File Map

| File | What changes |
|------|-------------|
| `src/components/ui/etheral-shadow.tsx` | Add visibility-aware RAF pause (IntersectionObserver + visibilitychange) |
| `src/components/CursorGlow.tsx` | Throttle mousemove with RAF; fix hydration mismatch |
| `src/app/page.tsx` | Shared IntersectionObserver for Reveal; ProblemCard CSS hover; feedback error state |
| `src/components/CTAButton.tsx` | Replace setTimeout with animationend event |
| `src/app/globals.css` | Add `will-change: transform` to `.nc-btn-3d`, `.nc-problem-card`; add `.nc-problem-card` hover rules |

---

### Task 1: Pause EtherealShadow RAF when not visible

**Files:**
- Modify: `src/components/ui/etheral-shadow.tsx:77-103`

The `tick()` loop runs at 30 FPS even when the element is scrolled out of view or the browser tab is hidden. Add an IntersectionObserver on the wrapper div and a `visibilitychange` listener to pause/resume the RAF loop.

- [ ] **Step 1: Add a ref for the wrapper div**

In `etheral-shadow.tsx`, add `containerRef` alongside `feColorMatrixRef`:

```tsx
const feColorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
const containerRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 2: Replace the animation useEffect with visibility-aware version**

Replace lines 77-103 entirely:

```tsx
useEffect(() => {
    if (!animationEnabled || !feColorMatrixRef.current) return;

    const cycleDurationMs = (animationDuration / 25) * 1000;

    let rafId: number;
    let lastUpdateMs = 0;
    let isVisible = true;      // IntersectionObserver result
    let isTabVisible = true;   // document visibility result

    function tick(nowMs: number) {
        rafId = requestAnimationFrame(tick);
        if (!isVisible || !isTabVisible) return;
        if (nowMs - lastUpdateMs < FILTER_INTERVAL_MS) return;
        lastUpdateMs = nowMs;
        const hue = (nowMs / cycleDurationMs * 360) % 360;
        feColorMatrixRef.current?.setAttribute("values", String(hue));
    }

    rafId = requestAnimationFrame(tick);

    // Pause when scrolled off-screen
    const io = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
    });
    if (containerRef.current) io.observe(containerRef.current);

    // Pause when tab is hidden
    function onVisibilityChange() {
        isTabVisible = document.visibilityState === "visible";
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
        cancelAnimationFrame(rafId);
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibilityChange);
    };
}, [animationEnabled, animationDuration]);
```

- [ ] **Step 3: Attach containerRef to the outer wrapper div**

The non-mobile return's outermost `<div>` needs the ref. Change line 122:

```tsx
// Before:
<div
    className={className}
    style={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        ...style
    }}
>

// After:
<div
    ref={containerRef}
    className={className}
    style={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        ...style
    }}
>
```

- [ ] **Step 4: Verify in browser**

Run `npm run dev`. Open the landing page. Open DevTools Performance tab → Record while scrolling past the hero section. Confirm CPU usage drops after the ethereal shadow scrolls out of view. Switch tabs — confirm no RAF activity while hidden.

- [ ] **Step 5: Commit**

```bash
cd /home/drayy/Drayy/Projects/projectfair
git add src/components/ui/etheral-shadow.tsx
git commit -m "perf: pause EtherealShadow RAF when off-screen or tab hidden"
```

---

### Task 2: Throttle CursorGlow mousemove + fix hydration mismatch

**Files:**
- Modify: `src/components/CursorGlow.tsx`

Two issues: (1) `useState(true)` causes a hydration mismatch when localStorage says `false` — the server renders the glow div, client hydrates it, then effect removes it (flash). (2) The `mousemove` handler updates the DOM directly on every mouse event, up to 144 times/sec on high-refresh monitors.

- [ ] **Step 1: Fix hydration mismatch — initialize enabled to null**

Replace the entire component with this version:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  // null = "not yet determined" — prevents server/client mismatch
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    // Disable on touch-primary devices (phones/tablets)
    if (window.matchMedia("(pointer: coarse)").matches) {
      setEnabled(false);
      return;
    }
    setEnabled(localStorage.getItem("nc-cursor-glow") !== "false");

    function onSettings(e: Event) {
      const detail = (e as CustomEvent).detail;
      if ("cursorGlow" in detail) setEnabled(detail.cursorGlow);
    }
    window.addEventListener("nc-settings", onSettings);
    return () => window.removeEventListener("nc-settings", onSettings);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const SIZE = 520;
    const HALF = SIZE / 2;
    let pending = false;

    function onMove(e: MouseEvent) {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        el!.style.transform = `translate(${e.clientX - HALF}px, ${e.clientY - HALF}px)`;
        pending = false;
      });
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => document.removeEventListener("mousemove", onMove);
  }, [enabled]);

  // null (not hydrated yet) or false (disabled) — render nothing
  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 520,
        height: 520,
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 9997,
        background: "radial-gradient(circle, var(--th-accent) 0%, transparent 65%)",
        opacity: 0.06,
        willChange: "transform",
        transform: "translate(-9999px, -9999px)",
      }}
    />
  );
}
```

- [ ] **Step 2: Verify in browser**

Open DevTools → Console. Confirm no hydration warnings. Move mouse rapidly — confirm glow follows smoothly at 60fps (not more). Open Application → Local Storage, set `nc-cursor-glow` to `"false"`, reload — confirm glow doesn't appear.

- [ ] **Step 3: Commit**

```bash
cd /home/drayy/Drayy/Projects/projectfair
git add src/components/CursorGlow.tsx
git commit -m "perf: throttle CursorGlow mousemove to rAF; fix hydration mismatch"
```

---

### Task 3: Consolidate Reveal IntersectionObserver instances

**Files:**
- Modify: `src/app/page.tsx:117-154` (the `Reveal` component)

Currently every `<Reveal>` creates its own `IntersectionObserver`. With 15+ `<Reveal>` calls on the page, that's 15 observer instances all watching the DOM. Replace with a module-level singleton observer that all `Reveal` instances share.

- [ ] **Step 1: Add the shared observer singleton above the Reveal component**

Insert this block immediately above the `function Reveal(` declaration (after the `FeedbackCarousel` function ends, around line 116):

```tsx
// ── Shared IntersectionObserver for all Reveal instances ─────────────────────
// One observer watches every reveal element; callbacks are keyed by element.
let _sharedObserver: IntersectionObserver | null = null;
const _revealCallbacks = new Map<Element, () => void>();

function getRevealObserver(): IntersectionObserver {
  if (!_sharedObserver) {
    _sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            _revealCallbacks.get(entry.target)?.();
            _sharedObserver!.unobserve(entry.target);
            _revealCallbacks.delete(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
  }
  return _sharedObserver;
}
```

- [ ] **Step 2: Rewrite the Reveal useEffect to use the shared observer**

Replace lines 130-138 (the `useEffect` inside `Reveal`):

```tsx
useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = getRevealObserver();
    _revealCallbacks.set(el, () => setVisible(true));
    obs.observe(el);
    return () => {
        obs.unobserve(el);
        _revealCallbacks.delete(el);
    };
}, []);
```

- [ ] **Step 3: Verify behavior is unchanged**

Run `npm run dev`. Scroll down the landing page slowly. Confirm all sections (feedback label, problem cards, feature rows, student/professor sections, final CTA) still fade+slide in as they enter the viewport. No regressions.

- [ ] **Step 4: Commit**

```bash
cd /home/drayy/Drayy/Projects/projectfair
git add src/app/page.tsx
git commit -m "perf: consolidate Reveal IntersectionObserver instances into shared singleton"
```

---

### Task 4: Fix ProblemCard hover — CSS instead of JS style mutation

**Files:**
- Modify: `src/app/globals.css` (add `.nc-problem-card` block)
- Modify: `src/app/page.tsx:257-325` (remove `onMouseEnter`/`onMouseLeave` handlers)

Inline `onMouseEnter`/`onMouseLeave` mutate `element.style` directly, bypassing React. If the component re-renders mid-hover, the inline style gets wiped and the hover effect disappears. CSS handles hover state correctly and is more performant (no JS call on every hover).

- [ ] **Step 1: Add .nc-problem-card CSS rules to globals.css**

Find the line in `globals.css` that contains `.nc-btn-3d {` (around line 551). Add the following block **before** it:

```css
/* Problem cards — hover lift handled in CSS to avoid JS style mutation */
.nc-problem-card {
  will-change: transform;
  transition: border-color 0.2s, transform 0.2s cubic-bezier(0.16,1,0.3,1);
}
.nc-problem-card:hover {
  border-color: color-mix(in srgb, var(--th-accent) 40%, var(--th-border)) !important;
  transform: translateY(-3px);
}
```

- [ ] **Step 2: Remove inline transition and event handlers from ProblemCard**

In `src/app/page.tsx`, find the `ProblemCard` component. Remove the `transition` from the inline `style`, and remove both `onMouseEnter` and `onMouseLeave` props entirely. The `<div>` at line 273 should become:

```tsx
<div
    className="nc-problem-card"
    style={{
        background: "var(--th-card)",
        border: "1px solid var(--th-border)",
        borderRadius: 16,
        padding: "28px 24px",
        position: "relative",
        overflow: "hidden",
    }}
>
```

- [ ] **Step 3: Verify hover behavior**

Run `npm run dev`. Hover over each of the 3 problem cards. Confirm the card lifts (`translateY(-3px)`) and the border turns accent-colored. Confirm the effect persists through full hover duration with no flicker.

- [ ] **Step 4: Commit**

```bash
cd /home/drayy/Drayy/Projects/projectfair
git add src/app/globals.css src/app/page.tsx
git commit -m "fix: replace ProblemCard JS style mutation with CSS hover; add will-change"
```

---

### Task 5: Add will-change to CTA buttons

**Files:**
- Modify: `src/app/globals.css` (`.nc-btn-3d` block, around line 551)

`.nc-btn-3d` uses `transform` on hover and active — adding `will-change: transform` promotes these elements to their own compositor layer before the interaction, eliminating the repaint on first hover.

- [ ] **Step 1: Add will-change to .nc-btn-3d**

In `globals.css`, find the `.nc-btn-3d {` block. Add `will-change: transform;` to it:

```css
.nc-btn-3d {
  will-change: transform;
  box-shadow: 0 4px 0 rgba(0,0,0,0.28), 0 2px 12px rgba(0,0,0,0.14) !important;
  transition: transform 0.12s cubic-bezier(0.16,1,0.3,1), box-shadow 0.12s ease, opacity 0.15s ease !important;
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/drayy/Drayy/Projects/projectfair
git add src/app/globals.css
git commit -m "perf: add will-change: transform to nc-btn-3d for compositor promotion"
```

---

### Task 6: Fix CTAButton ripple — replace setTimeout with animationend

**Files:**
- Modify: `src/components/CTAButton.tsx:35-36`

`setTimeout(() => ripple.remove(), 600)` fires even after the component unmounts (e.g., navigation happens on click). The ripple element will attempt `.remove()` on a detached DOM node — harmless but wasteful. Replace with `animationend` which fires exactly when the CSS animation completes and self-cleans.

- [ ] **Step 1: Replace setTimeout with animationend listener**

In `CTAButton.tsx`, replace lines 35-36:

```tsx
// Before:
el.appendChild(ripple);
setTimeout(() => ripple.remove(), 600);

// After:
el.appendChild(ripple);
ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
```

- [ ] **Step 2: Verify ripple behavior**

Run `npm run dev`. Click a CTA button (e.g., "Get Started Free"). Confirm the white ripple spreads and disappears cleanly. Click rapidly multiple times — confirm each ripple removes itself independently.

- [ ] **Step 3: Commit**

```bash
cd /home/drayy/Drayy/Projects/projectfair
git add src/components/CTAButton.tsx
git commit -m "fix: replace ripple setTimeout with animationend listener to avoid post-unmount cleanup"
```

---

### Task 7: Add feedback error state to carousel

**Files:**
- Modify: `src/app/page.tsx` (the `LandingPage` component, lines 466-478, and `FeedbackCarousel`, lines 63-114)

If `/api/feedback` returns an error, the carousel silently shows nothing. Users see an empty section with no context. Add a `feedbackError` flag and pass it to `FeedbackCarousel` to show a short fallback message.

- [ ] **Step 1: Add feedbackError state to LandingPage**

In `LandingPage`, add `feedbackError` state alongside the existing feedback state (around line 468):

```tsx
const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
const [feedbacksLoaded, setFeedbacksLoaded] = useState(false);
const [feedbackError, setFeedbackError] = useState(false);
```

- [ ] **Step 2: Set feedbackError on catch**

Replace the existing fetch effect (lines 473-478):

```tsx
useEffect(() => {
    fetch("/api/feedback")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data: FeedbackItem[]) => {
            setFeedbacks(Array.isArray(data) ? data : []);
            setFeedbacksLoaded(true);
        })
        .catch(() => {
            setFeedbackError(true);
            setFeedbacksLoaded(true);
        });
}, []);
```

- [ ] **Step 3: Pass feedbackError to FeedbackCarousel**

Find where `<FeedbackCarousel>` is rendered in the JSX (search for `<FeedbackCarousel`). Add the `error` prop:

```tsx
<FeedbackCarousel feedbacks={feedbacks} loaded={feedbacksLoaded} error={feedbackError} />
```

- [ ] **Step 4: Add error prop and fallback to FeedbackCarousel**

Replace the `FeedbackCarousel` function signature and add error handling at the top:

```tsx
function FeedbackCarousel({
    feedbacks,
    loaded,
    error,
}: {
    feedbacks: FeedbackItem[];
    loaded: boolean;
    error: boolean;
}) {
    if (loaded && error) {
        return (
            <section className="py-16">
                <div className="max-w-5xl mx-auto px-6 md:px-10">
                    <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem" }}>
                        Unable to load feedback right now.
                    </p>
                </div>
            </section>
        );
    }

    if (loaded && feedbacks.length === 0) return null;
    // ... rest of existing function unchanged ...
```

- [ ] **Step 5: Verify error state**

Temporarily edit the fetch URL to `/api/feedback-bad` to force a 404. Run `npm run dev`, load the landing page — confirm you see "Unable to load feedback right now." instead of a blank section. Restore the URL to `/api/feedback`.

- [ ] **Step 6: Commit**

```bash
cd /home/drayy/Drayy/Projects/projectfair
git add src/app/page.tsx
git commit -m "fix: add error state and fallback UI to feedback carousel"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|-------------|------|
| EtherealShadow IntersectionObserver + visibilitychange | Task 1 ✓ |
| CursorGlow RAF throttle | Task 2 ✓ |
| CursorGlow hydration fix | Task 2 ✓ |
| Shared IntersectionObserver for Reveal | Task 3 ✓ |
| ProblemCard CSS hover (remove JS style mutation) | Task 4 ✓ |
| will-change on animated cards | Task 4 ✓ (nc-problem-card) |
| will-change on CTA buttons | Task 5 ✓ (nc-btn-3d) |
| CTAButton ripple timeout fix | Task 6 ✓ |
| Feedback error state + fallback UI | Task 7 ✓ |

**Placeholder scan:** No TBDs or "similar to Task N" references. All code blocks are complete and self-contained.

**Type consistency:** `feedbackError: boolean` defined in Task 7 Step 1 matches prop type defined in Task 7 Step 4. `getRevealObserver()` and `_revealCallbacks` defined in Task 3 Step 1 used in Task 3 Step 2. All consistent.
