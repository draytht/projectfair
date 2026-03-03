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
 * HOVER — barely-there cloth brush.
 * Ultra-soft low-passed noise, almost subliminal warmth.
 */
function playHover(ctx: AudioContext) {
  const now = ctx.currentTime;
  const dur = 0.022;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 700;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.016, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
  src.start(now); src.stop(now + dur + 0.005);
}

/**
 * POP — mechanical keyboard "thock".
 * Deep low-passed noise body + brief click transient.
 * Used on primary CTA buttons.
 */
function playPop(ctx: AudioContext) {
  const now = ctx.currentTime;

  // Body thump — low-passed noise that rolls off fast
  const thockLen = Math.ceil(ctx.sampleRate * 0.038);
  const tbuf = ctx.createBuffer(1, thockLen, ctx.sampleRate);
  const tch = tbuf.getChannelData(0);
  for (let i = 0; i < thockLen; i++) tch[i] = Math.random() * 2 - 1;
  const tsrc = ctx.createBufferSource();
  tsrc.buffer = tbuf;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(850, now);
  lp.frequency.exponentialRampToValueAtTime(180, now + 0.042);

  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0.20, now);
  tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

  tsrc.connect(lp); lp.connect(tg); tg.connect(ctx.destination);
  tsrc.start(now); tsrc.stop(now + 0.07);

  // Short high click transient
  const clen = Math.ceil(ctx.sampleRate * 0.004);
  const cbuf = ctx.createBuffer(1, clen, ctx.sampleRate);
  const cch = cbuf.getChannelData(0);
  for (let i = 0; i < clen; i++) cch[i] = Math.random() * 2 - 1;
  const csrc = ctx.createBufferSource();
  csrc.buffer = cbuf;
  const chp = ctx.createBiquadFilter();
  chp.type = "highpass"; chp.frequency.value = 2800;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.09, now);
  cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.005);
  csrc.connect(chp); chp.connect(cg); cg.connect(ctx.destination);
  csrc.start(now); csrc.stop(now + 0.006);
}

/**
 * BOOP — warm piano/jazz keystroke.
 * Triangle wave at G4 + quiet sub octave. Rounded and mellow.
 * Used on secondary buttons.
 */
function playBoop(ctx: AudioContext) {
  const now = ctx.currentTime;
  const v = 0.94 + Math.random() * 0.12;

  // Triangle wave — warmer than sine, piano-ish
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(392 * v, now); // G4
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.09, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.14);

  // Sub octave warmth
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(196 * v, now); // G3
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.05, now);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
  osc2.connect(g2); g2.connect(ctx.destination);
  osc2.start(now); osc2.stop(now + 0.11);
}

/**
 * PING — soft office bell / coffee cup tap.
 * Pure sine with quick attack and slow lofi bell decay.
 * Fires on input focus.
 */
function playPing(ctx: AudioContext) {
  const now = ctx.currentTime;

  // Bell tone — A5, slow decay
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now); // A5
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.040, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.32);

  // Warm sub-octave layer
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(440, now); // A4
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0, now);
  g2.gain.linearRampToValueAtTime(0.020, now + 0.005);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc2.connect(g2); g2.connect(ctx.destination);
  osc2.start(now); osc2.stop(now + 0.19);
}

/**
 * SWIPE — soft paper shuffle / page turn.
 * Low-passed noise that rolls off downward, like flipping a page.
 * Used on nav/link clicks.
 */
function playSwipe(ctx: AudioContext) {
  const now = ctx.currentTime;
  const dur = 0.085;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(2000, now);
  lp.frequency.exponentialRampToValueAtTime(350, now + dur);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.050, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(lp); lp.connect(g); g.connect(ctx.destination);
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
      if (el === lastHoverEl.current) return;
      if (now - lastHoverAt.current < 28) return;

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
    document.addEventListener("focus",      onFocus,      { capture: true, passive: true });
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    if (!isTouch) {
      document.addEventListener("mouseover", onMouseOver, { passive: true });
    }

    return () => {
      document.removeEventListener("mousedown",  onMouseDown);
      document.removeEventListener("focus",      onFocus,      { capture: true });
      document.removeEventListener("touchstart", onTouchStart);
      if (!isTouch) {
        document.removeEventListener("mouseover", onMouseOver);
      }
    };
  }, []);

  return null;
}
