"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

// ── Hex / CSS-variable color resolver ────────────────────────────────────────

function resolveHex(color: string): [number, number, number] {
  // Unwrap CSS variable
  if (color.startsWith("var(")) {
    const name = color.slice(4, -1).trim();
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return resolveHex(val || "#888888");
  }
  // Hex #RGB / #RRGGBB
  if (color.startsWith("#")) {
    const h = color.slice(1);
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  }
  // rgb(r,g,b)
  const m = color.match(/\d+/g);
  if (m && m.length >= 3) return [+m[0], +m[1], +m[2]];
  return [136, 136, 136];
}

// ── FlickeringGrid ────────────────────────────────────────────────────────────

interface FlickeringGridProps {
  className?: string;
  squareSize?: number;
  gridGap?: number;
  /** CSS color or CSS variable string, e.g. "var(--th-accent)" */
  color?: string;
  maxOpacity?: number;
  flickerChance?: number;
  /** Text to render as a bright mask over the grid */
  text?: string;
}

function FlickeringGrid({
  className,
  squareSize = 4,
  gridGap = 6,
  color = "#888888",
  maxOpacity = 0.35,
  flickerChance = 0.12,
  text,
}: FlickeringGridProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let cols = 0;
    let rows = 0;
    let squares: Float32Array = new Float32Array(0);
    let textMask: Uint8ClampedArray | null = null;
    let maskW = 0;

    function buildTextMask(w: number, h: number) {
      if (!text || w <= 0 || h <= 0) { textMask = null; return; }
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const oc = off.getContext("2d");
      if (!oc) return;
      // Thin, wide-tracked display font
      const fs = Math.min(w * 0.21, h * 0.62, 130);
      oc.clearRect(0, 0, w, h);
      // Wide letter-spacing via repeated single-char draws centered on canvas
      oc.fillStyle = "#fff";
      oc.font = `200 ${fs}px 'Sora', system-ui, -apple-system, sans-serif`;
      oc.textAlign = "center";
      oc.textBaseline = "middle";
      // Apply letterSpacing if supported (Chrome 99+, Firefox 116+)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (oc as any).letterSpacing = `${Math.round(fs * 0.12)}px`;
      oc.fillText(text, w / 2, h / 2);
      textMask = oc.getImageData(0, 0, w, h).data;
      maskW = w;
    }

    function inText(col: number, row: number, w: number, h: number): boolean {
      if (!textMask) return false;
      const x = Math.round(col * (squareSize + gridGap) + squareSize / 2);
      const y = Math.round(row * (squareSize + gridGap) + squareSize / 2);
      if (x < 0 || x >= w || y < 0 || y >= h) return false;
      return textMask[(y * maskW + x) * 4 + 3] > 64;
    }

    function resize() {
      const { width, height } = container!.getBoundingClientRect();
      const w = Math.round(width);
      const h = Math.round(height);
      if (w <= 0 || h <= 0) return;
      canvas!.width = w;
      canvas!.height = h;
      cols = Math.ceil(w / (squareSize + gridGap));
      rows = Math.ceil(h / (squareSize + gridGap));
      const prev = squares;
      squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = i < prev.length ? prev[i] : Math.random() * maxOpacity * 0.3;
      }
      buildTextMask(w, h);
    }

    // ctx is guaranteed non-null here (early return above)
    const c = ctx;

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      c.clearRect(0, 0, w, h);

      const [r, g, b] = resolveHex(color);
      // Diagonal shimmer wave: travels left→right with slight vertical lean
      const t = performance.now() / 1000;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          const lit = inText(col, row, w, h);

          if (lit) {
            // Two overlapping sine waves at different speeds/phases create
            // a beating shimmer that sweeps diagonally across the text
            const phase = (col / cols) * Math.PI * 6 - (row / rows) * Math.PI * 1.5;
            const wave1 = (Math.sin(t * 2.2 - phase) + 1) / 2;          // fast sweep
            const wave2 = (Math.sin(t * 0.8 - phase * 0.6 + 1.3) + 1) / 2; // slow pulse
            const shine = wave1 * 0.65 + wave2 * 0.35;
            const op = maxOpacity * (0.28 + shine * 0.72);
            c.fillStyle = `rgba(${r},${g},${b},${op})`;
            c.fillRect(
              col * (squareSize + gridGap),
              row * (squareSize + gridGap),
              squareSize,
              squareSize,
            );
          } else {
            // Background: very sparse, slow random drift — barely visible
            if (Math.random() < 0.0018) {
              squares[idx] = Math.random() * maxOpacity * 0.09;
            }
            if (squares[idx] > 0.004) {
              c.fillStyle = `rgba(${r},${g},${b},${squares[idx]})`;
              c.fillRect(
                col * (squareSize + gridGap),
                row * (squareSize + gridGap),
                squareSize,
                squareSize,
              );
            }
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [squareSize, gridGap, color, maxOpacity, flickerChance, text]);

  return (
    <div ref={containerRef} className={`absolute inset-0${className ? ` ${className}` : ""}`}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}

// ── Footer link with hover chevron ───────────────────────────────────────────

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        color: hovered ? "var(--th-text)" : "var(--th-text-2)",
        fontSize: "0.8125rem",
        transition: "color 0.18s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ChevronRight
        size={11}
        style={{
          opacity: hovered ? 0.55 : 0,
          transition: "opacity 0.18s",
          flexShrink: 0,
        }}
      />
      {children}
    </Link>
  );
}

// ── Nav data ─────────────────────────────────────────────────────────────────

const NAV: { label: string; links: { label: string; href: string }[] }[] = [
  {
    label: "Platform",
    links: [
      { label: "Features",     href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Sign up",      href: "/signup" },
      { label: "Log in",       href: "/login" },
    ],
  },
  {
    label: "For Students",
    links: [
      { label: "Track your work",   href: "/signup" },
      { label: "Peer reviews",      href: "/signup" },
      { label: "Task board",        href: "/signup" },
      { label: "Flag freeloaders",  href: "/signup" },
    ],
  },
  {
    label: "For Professors",
    links: [
      { label: "Grade fairly",        href: "/signup" },
      { label: "AI reports",          href: "/signup" },
      { label: "Monitor teams",       href: "/signup" },
      { label: "Detect freeloaders",  href: "/signup" },
    ],
  },
];

// ── Main export ───────────────────────────────────────────────────────────────

export function FlickeringFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--th-border)" }}>
      {/* ── Flickering grid band with "NoCarry" text mask ──────────────── */}
      <div
        style={{ position: "relative", height: 160, overflow: "hidden" }}
        aria-hidden="true"
      >
        {/* Four-edge fade so grid bleeds into page background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background: `
              linear-gradient(to bottom,  var(--th-bg) 0%,  transparent 28%, transparent 65%, var(--th-bg) 100%),
              linear-gradient(to right,   var(--th-bg) 0%,  transparent 12%, transparent 88%, var(--th-bg) 100%)
            `,
          }}
        />
        <FlickeringGrid
          squareSize={3}
          gridGap={5}
          color="var(--th-accent)"
          maxOpacity={0.72}
          text="NoCarry"
        />
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div
        style={{ background: "var(--th-bg)" }}
        className="px-6 md:px-10 pb-10"
      >
        {/* Brand + nav grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-4 gap-10 py-8"
          style={{ borderBottom: "1px solid var(--th-border)" }}
        >
          {/* Brand column */}
          <div>
            <Link href="/" className="nc-brand inline-flex mb-4">
              <span className="nc-brand-dot" />
              <span className="nc-brand-text">
                No<span style={{ color: "var(--th-accent)" }}>Carry</span>
              </span>
            </Link>
            <p
              style={{
                color: "var(--th-text-2)",
                fontSize: "0.8125rem",
                lineHeight: 1.65,
                maxWidth: 220,
              }}
            >
              Track real contributions, surface freeloaders automatically, and
              give professors the data they need to grade with confidence.
            </p>
          </div>

          {/* Nav columns */}
          {NAV.map((section) => (
            <div key={section.label}>
              <p
                style={{
                  color: "var(--th-text)",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                {section.label}
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-5"
        >
          <p style={{ color: "var(--th-text-2)", fontSize: "0.75rem" }}>
            © {new Date().getFullYear()} NoCarry — Built for students. Trusted by professors.
          </p>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.75rem" }}>
            Made with care for the ones who always carry.
          </p>
        </div>
      </div>
    </footer>
  );
}
