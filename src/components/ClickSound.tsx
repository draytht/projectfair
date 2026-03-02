"use client";

import { useEffect, useRef } from "react";

// ── AudioContext singleton ────────────────────────────────────────────────────

function getCtx(ref: React.RefObject<AudioContext | null>): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ref.current) ref.current = new AudioContext();
  } catch {
    return null;
  }
  const ctx = ref.current;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

// ── Sound synthesizers ────────────────────────────────────────────────────────

/**
 * HOVER — ultra-subtle high-freq noise tick, almost subliminal.
 * Feels like UI "breathing" as your cursor brushes over elements.
 */
function playHover(ctx: AudioContext) {
  const now = ctx.currentTime;
  const len = Math.ceil(ctx.sampleRate * 0.016);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1);

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 4800 + Math.random() * 800;
  bp.Q.value = 1.8;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.026, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

  src.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
  src.start(now); src.stop(now + 0.018);
}

/**
 * POP — modern app "launch" feel.
 * A satisfying low sine sweep + crisp harmonic.
 * Used on primary CTA buttons.
 */
function playPop(ctx: AudioContext) {
  const now = ctx.currentTime;
  const v = 0.92 + Math.random() * 0.16;

  // Low thump sweep
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(240 * v, now);
  osc.frequency.exponentialRampToValueAtTime(62 * v, now + 0.10);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.24, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.11);

  // Bright harmonic layer
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(480 * v, now);
  osc2.frequency.exponentialRampToValueAtTime(120 * v, now + 0.055);
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.08, now);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
  osc2.connect(g2); g2.connect(ctx.destination);
  osc2.start(now); osc2.stop(now + 0.06);

  // Transient click — very short noise burst at impact
  const clen = Math.ceil(ctx.sampleRate * 0.008);
  const cbuf = ctx.createBuffer(1, clen, ctx.sampleRate);
  const cch = cbuf.getChannelData(0);
  for (let i = 0; i < clen; i++) cch[i] = Math.random() * 2 - 1;
  const csrc = ctx.createBufferSource();
  csrc.buffer = cbuf;
  const chp = ctx.createBiquadFilter();
  chp.type = "highpass"; chp.frequency.value = 2000;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.12, now);
  cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);
  csrc.connect(chp); chp.connect(cg); cg.connect(ctx.destination);
  csrc.start(now); csrc.stop(now + 0.01);
}

/**
 * BOOP — quick rising-then-falling tone.
 * Feels forward and digital. Used on secondary buttons.
 */
function playBoop(ctx: AudioContext) {
  const now = ctx.currentTime;
  const v = 0.94 + Math.random() * 0.12;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(370 * v, now);
  osc.frequency.exponentialRampToValueAtTime(580 * v, now + 0.04);
  osc.frequency.exponentialRampToValueAtTime(300 * v, now + 0.085);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.11, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.09);
}

/**
 * PING — clean high-frequency sine decay.
 * Feels precise and digital. Fires on input focus.
 */
function playPing(ctx: AudioContext) {
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1174, now); // D6
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.055, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.21);

  // Softer sub-octave for warmth
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(587, now); // D5
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.025, now);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  osc2.connect(g2); g2.connect(ctx.destination);
  osc2.start(now); osc2.stop(now + 0.15);
}

/**
 * SWIPE — filtered noise sweep from low → high frequency.
 * Feels like swiping to a new screen. Used on nav/link clicks.
 */
function playSwipe(ctx: AudioContext) {
  const now = ctx.currentTime;
  const dur = 0.10;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(280, now);
  bp.frequency.exponentialRampToValueAtTime(4200, now + dur);
  bp.Q.value = 0.7;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.065, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(bp); bp.connect(g); g.connect(ctx.destination);
  src.start(now); src.stop(now + dur + 0.01);
}

// ── Element selectors ────────────────────────────────────────────────────────

const SEL_ALL    = "button, a, [role='button'], input, select, textarea, label, summary";
const SEL_POP    = ".nc-btn-primary, .nc-btn-3d, [data-sound='primary']";
const SEL_LINK   = "a[href]";
const SEL_INPUT  = "input, textarea, select";

// ── Main component ───────────────────────────────────────────────────────────

export function ClickSound() {
  const ctxRef       = useRef<AudioContext | null>(null);
  const lastClick    = useRef(0);
  const lastHoverAt  = useRef(0);
  const lastHoverEl  = useRef<Element | null>(null);

  useEffect(() => {
    const init = () => getCtx(ctxRef);
    const muted = () => localStorage.getItem("nc-sound") === "false";
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    // ── Click / tap ───────────────────────────────────────────────────────────
    function onMouseDown(e: MouseEvent) {
      if (muted()) return;
      const now = Date.now();
      if (now - lastClick.current < 45) return;

      const el = (e.target as Element)?.closest(SEL_ALL);
      if (!el) return;
      lastClick.current = now;

      const ctx = init();
      if (!ctx) return;

      if (el.matches(SEL_POP))          playPop(ctx);
      else if (el.matches(SEL_LINK))    playSwipe(ctx);
      else if (el.matches("button"))    playBoop(ctx);
      // inputs: handled by focus event below
    }

    // ── Hover — plays once per element entry (desktop only) ──────────────────
    function onMouseOver(e: MouseEvent) {
      if (muted() || isTouch) return;
      const now = Date.now();

      const el = (e.target as Element)?.closest(SEL_ALL);
      if (!el) return;
      if (el === lastHoverEl.current) return;   // still on same element
      if (now - lastHoverAt.current < 28) return; // throttle rapid moves

      lastHoverEl.current = el;
      lastHoverAt.current = now;

      const ctx = init();
      if (!ctx) return;
      playHover(ctx);
    }

    // ── Input focus ping ──────────────────────────────────────────────────────
    function onFocus(e: FocusEvent) {
      if (muted()) return;
      const target = e.target as Element;
      if (!target?.matches(SEL_INPUT)) return;
      const ctx = init();
      if (!ctx) return;
      playPing(ctx);
    }

    // ── Touch ─────────────────────────────────────────────────────────────────
    function onTouchStart(e: TouchEvent) {
      if (muted()) return;
      const now = Date.now();
      if (now - lastClick.current < 45) return;

      const el = (e.target as Element)?.closest(SEL_ALL);
      if (!el) return;
      lastClick.current = now;

      const ctx = init();
      if (!ctx) return;

      if (el.matches(SEL_POP))       playPop(ctx);
      else if (el.matches(SEL_LINK)) playSwipe(ctx);
      else if (el.matches("button")) playBoop(ctx);
    }

    document.addEventListener("mousedown",  onMouseDown,  { passive: true });
    document.addEventListener("mouseover",  onMouseOver,  { passive: true });
    document.addEventListener("focus",      onFocus,      { capture: true, passive: true });
    document.addEventListener("touchstart", onTouchStart, { passive: true });

    return () => {
      document.removeEventListener("mousedown",  onMouseDown);
      document.removeEventListener("mouseover",  onMouseOver);
      document.removeEventListener("focus",      onFocus,      { capture: true });
      document.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return null;
}
