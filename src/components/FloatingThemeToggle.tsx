"use client";

import { useState, useEffect } from "react";
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

const DROPDOWN_W = 150;
const ITEM_H = 34;

export function FloatingThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  // Read initial visibility from localStorage
  useEffect(() => {
    setVisible(localStorage.getItem("nc-theme-toggle") !== "false");
  }, []);

  // Listen for settings changes
  useEffect(() => {
    function onSettings(e: Event) {
      const detail = (e as CustomEvent).detail;
      if ("themeToggle" in detail) setVisible(detail.themeToggle);
    }
    window.addEventListener("nc-settings", onSettings);
    return () => window.removeEventListener("nc-settings", onSettings);
  }, []);

  // Close dropdown on outside click / tap
  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent | TouchEvent) {
      const root = document.getElementById("nc-float-toggle");
      const target = (e instanceof TouchEvent ? e.touches[0]?.target : e.target) as Node | null;
      if (root && target && !root.contains(target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [open]);

  const current = THEMES.find((t) => t.id === theme);

  if (!visible) return null;

  return (
    <div
      id="nc-float-toggle"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
    >
      {/* Dropdown — opens upward */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
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
                onPointerDown={(e) => { e.stopPropagation(); setTheme(t.id); setOpen(false); }}
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

      {/* Pill button */}
      <div
        onClick={() => setOpen((o) => !o)}
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
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          whiteSpace: "nowrap",
          cursor: "pointer",
          userSelect: "none",
          transition: "box-shadow 0.2s ease, transform 0.15s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.28)"; e.currentTarget.style.transform = "scale(1.04)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)"; e.currentTarget.style.transform = "scale(1)"; }}
      >
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
  );
}
