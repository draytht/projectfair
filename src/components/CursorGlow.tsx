"use client";

import { useEffect, useRef, useState } from "react";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  // null = "not yet determined" — prevents server/client hydration mismatch
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
    let rafHandle = 0;

    function onMove(e: MouseEvent) {
      if (pending) return;
      pending = true;
      rafHandle = requestAnimationFrame(() => {
        el!.style.transform = `translate(${e.clientX - HALF}px, ${e.clientY - HALF}px)`;
        pending = false;
      });
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafHandle);
    };
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
