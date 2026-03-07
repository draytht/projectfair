/**
 * Minimalist UI sound system — Web Audio API only, zero files, zero latency.
 * Respects the "nc-sound" localStorage preference and prefers-reduced-motion.
 */

function enabled(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("nc-sound") === "false") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

function tone(
  freq: number,
  dur: number,
  vol = 0.16,
  type: OscillatorType = "sine",
  delay = 0,
) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur);
    osc.onended = () => ctx.close();
  } catch {}
}

export const sounds = {
  /** Low descending two-tone — item moved to trash */
  trash() {
    if (!enabled()) return;
    tone(260, 0.12, 0.14);
    tone(200, 0.14, 0.09, "sine", 0.06);
  },

  /** Soft mid settle — item archived */
  archive() {
    if (!enabled()) return;
    tone(380, 0.10, 0.14);
    tone(300, 0.13, 0.09, "sine", 0.05);
  },

  /** Clean ascending chime — task or project completed */
  complete() {
    if (!enabled()) return;
    tone(560, 0.09, 0.14);
    tone(740, 0.11, 0.10, "sine", 0.07);
  },

  /** Upward two-tone pop — item restored */
  restore() {
    if (!enabled()) return;
    tone(420, 0.08, 0.13);
    tone(580, 0.10, 0.09, "sine", 0.05);
  },
};
