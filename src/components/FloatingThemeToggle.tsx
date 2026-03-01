"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme, Theme } from "./ThemeProvider";

const THEMES: { id: Theme; label: string; dot: string }[] = [
  { id: "dark",        label: "Dark",        dot: "#222222" },
  { id: "light",       label: "Light",       dot: "#dddddd" },
  { id: "gruvbox",     label: "Gruvbox",     dot: "#d79921" },
  { id: "nord",        label: "Nord",        dot: "#88c0d0" },
  { id: "tokyo-night", label: "Tokyo Night", dot: "#7aa2f7" },
  { id: "dracula",     label: "Dracula",     dot: "#bd93f9" },
  { id: "catppuccin",  label: "Catppuccin",  dot: "#cba6f7" },
];

interface Pos { x: number; y: number }

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

const BTN_W = 128;
const BTN_H = 36;
const DROPDOWN_W = 150;
const ITEM_H = 34;

export function FloatingThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Start off-screen and invisible; move to real position after mount
  const [pos, setPos] = useState<Pos>({ x: -400, y: -400 });
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const drag = useRef({
    active: false,
    startMouse: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    moved: false,
  });

  // ── Init position ─────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("nc-float-pos");
    if (saved) {
      try {
        const p = JSON.parse(saved) as Pos;
        setPos({ x: clamp(p.x, 0, window.innerWidth - BTN_W), y: clamp(p.y, 0, window.innerHeight - BTN_H) });
        setReady(true);
        return;
      } catch {}
    }
    // Default: bottom-left on mobile (stacked above fixed settings button),
    // bottom-right on desktop
    const isMobile = window.innerWidth < 768;
    setPos({
      x: isMobile ? 16 : window.innerWidth - BTN_W - 24,
      // On mobile: sit at bottom-80px so it clears the 44px settings button at bottom-24px
      y: isMobile ? window.innerHeight - BTN_H - 84 : window.innerHeight - BTN_H - 24,
    });
    setReady(true);
  }, []);

  // ── Clamp on resize ───────────────────────────────────────────
  useEffect(() => {
    function onResize() {
      setPos((p) => ({
        x: clamp(p.x, 0, window.innerWidth - BTN_W),
        y: clamp(p.y, 0, window.innerHeight - BTN_H),
      }));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Close dropdown on outside click ──────────────────────────
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const root = document.getElementById("nc-float-toggle");
      if (root && !root.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const savePos = useCallback((p: Pos) => {
    localStorage.setItem("nc-float-pos", JSON.stringify(p));
  }, []);

  // ── Mouse drag ────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    drag.current = { active: true, startMouse: { x: e.clientX, y: e.clientY }, startPos: pos, moved: false };
    setIsDragging(true);

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - drag.current.startMouse.x;
      const dy = ev.clientY - drag.current.startMouse.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true;
      setPos({
        x: clamp(drag.current.startPos.x + dx, 0, window.innerWidth - BTN_W),
        y: clamp(drag.current.startPos.y + dy, 0, window.innerHeight - BTN_H),
      });
    }

    function onUp(ev: MouseEvent) {
      drag.current.active = false;
      setIsDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);

      if (!drag.current.moved) {
        setOpen((o) => !o);
      } else {
        const finalPos = {
          x: clamp(drag.current.startPos.x + (ev.clientX - drag.current.startMouse.x), 0, window.innerWidth - BTN_W),
          y: clamp(drag.current.startPos.y + (ev.clientY - drag.current.startMouse.y), 0, window.innerHeight - BTN_H),
        };
        setPos(finalPos);
        savePos(finalPos);
        setOpen(false);
      }
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [pos, savePos]);

  // ── Touch drag ────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    drag.current = { active: true, startMouse: { x: touch.clientX, y: touch.clientY }, startPos: pos, moved: false };

    function onMove(ev: TouchEvent) {
      ev.preventDefault();
      const t = ev.touches[0];
      const dx = t.clientX - drag.current.startMouse.x;
      const dy = t.clientY - drag.current.startMouse.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true;
      setPos({
        x: clamp(drag.current.startPos.x + dx, 0, window.innerWidth - BTN_W),
        y: clamp(drag.current.startPos.y + dy, 0, window.innerHeight - BTN_H),
      });
    }

    function onEnd(ev: TouchEvent) {
      drag.current.active = false;
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      if (!drag.current.moved) {
        setOpen((o) => !o);
      } else {
        const t = ev.changedTouches[0];
        const finalPos = {
          x: clamp(drag.current.startPos.x + (t.clientX - drag.current.startMouse.x), 0, window.innerWidth - BTN_W),
          y: clamp(drag.current.startPos.y + (t.clientY - drag.current.startMouse.y), 0, window.innerHeight - BTN_H),
        };
        setPos(finalPos);
        savePos(finalPos);
        setOpen(false);
      }
    }

    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  }, [pos, savePos]);

  const current = THEMES.find((t) => t.id === theme);
  const dropdownH = THEMES.length * ITEM_H + 8;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const openAbove = pos.y + BTN_H + 8 + dropdownH > vh;
  const dropdownX = clamp(pos.x, 8, vw - DROPDOWN_W - 8);
  const dropdownY = openAbove ? pos.y - dropdownH - 6 : pos.y + BTN_H + 6;

  return (
    <div id="nc-float-toggle" style={{ position: "fixed", zIndex: 9999, top: 0, left: 0, pointerEvents: "none" }}>
      {/* Floating pill */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          pointerEvents: "all",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "none",
          opacity: ready ? 1 : 0,
          transition: ready ? "box-shadow 0.2s ease, transform 0.15s ease, opacity 0.2s ease" : "none",
          transform: isDragging ? "scale(1.06)" : "scale(1)",
        }}
      >
        <div
          style={{
            background: "var(--th-card)",
            border: "1px solid var(--th-border)",
            color: "var(--th-text)",
            borderRadius: "999px",
            padding: "0.45rem 0.85rem",
            fontSize: "0.72rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            boxShadow: isDragging
              ? "0 16px 48px rgba(0,0,0,0.3)"
              : "0 4px 20px rgba(0,0,0,0.2)",
            backdropFilter: "blur(14px)",
            whiteSpace: "nowrap",
          }}
        >
          {/* 3×3 drag handle */}
          <svg width="9" height="9" viewBox="0 0 9 9" style={{ opacity: 0.35, flexShrink: 0 }}>
            {[1.5, 4.5, 7.5].flatMap((cy) =>
              [1.5, 4.5, 7.5].map((cx) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1" fill="currentColor" />
              ))
            )}
          </svg>

          {/* Theme colour dot */}
          <span
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: current?.dot ?? "var(--th-accent)",
              display: "inline-block", flexShrink: 0,
            }}
          />

          <span style={{ color: "var(--th-text-2)" }}>{current?.label ?? "Theme"}</span>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            left: dropdownX,
            top: dropdownY,
            pointerEvents: "all",
            background: "var(--th-card)",
            border: "1px solid var(--th-border)",
            borderRadius: "0.75rem",
            overflow: "hidden",
            boxShadow: "0 10px 48px rgba(0,0,0,0.24)",
            width: DROPDOWN_W,
            padding: "4px",
            animation: "nc-page-in 0.18s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  width: "100%",
                  padding: "0.48rem 0.75rem",
                  fontSize: "0.75rem",
                  background: active ? "var(--th-border)" : "transparent",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  color: active ? "var(--th-text)" : "var(--th-text-2)",
                  fontWeight: active ? 600 : 400,
                  transition: "background 0.12s ease",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--th-border)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: t.dot, display: "inline-block", flexShrink: 0,
                    boxShadow: active ? `0 0 6px ${t.dot}99` : "none",
                    transition: "box-shadow 0.15s ease",
                  }}
                />
                {t.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
