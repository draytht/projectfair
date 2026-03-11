"use client";

import React, { useState, useEffect, useRef, type FormEvent } from "react";
import { toast } from "sonner";
import { Component as EtherealShadow } from "@/components/ui/etheral-shadow";

const THEMES = [
  { id: "dark",        label: "Dark",        dot: "#555566" },
  { id: "light",       label: "Light",       dot: "#dddddd" },
  { id: "gruvbox",     label: "Gruvbox",     dot: "#d79921" },
  { id: "nord",        label: "Nord",        dot: "#88c0d0" },
  { id: "tokyo-night", label: "Tokyo Night", dot: "#7aa2f7" },
  { id: "dracula",     label: "Dracula",     dot: "#bd93f9" },
  { id: "catppuccin",  label: "Catppuccin",  dot: "#cba6f7" },
] as const;

type Theme = typeof THEMES[number]["id"];

// ─── Draggable card with throw physics ───────────────────────────────────────
function DraggableCard({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const elRef   = useRef<HTMLDivElement>(null);
  const physRef = useRef({
    pos:         null as { x: number; y: number } | null,
    vel:         { x: 0, y: 0 },
    prev:        { x: 0, y: 0, t: 0 },
    dragging:    false,
    startClient: { x: 0, y: 0 },
    startPos:    { x: 0, y: 0 },
    raf:         0,
  });

  const [fixedPos, setFixedPos] = useState<{ x: number; y: number } | null>(null);
  const [grabbed,  setGrabbed]  = useState(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const r = physRef.current;

    // ── shared: start / move / end helpers ──────────────────────────────────
    const startDrag = (clientX: number, clientY: number) => {
      cancelAnimationFrame(r.raf);
      const rect   = el.getBoundingClientRect();
      const startX = r.pos ? r.pos.x : rect.left;
      const startY = r.pos ? r.pos.y : rect.top;
      r.pos         = { x: startX, y: startY };
      r.vel         = { x: 0, y: 0 };
      r.dragging    = true;
      r.startClient = { x: clientX, y: clientY };
      r.startPos    = { x: startX,  y: startY };
      r.prev        = { x: clientX, y: clientY, t: Date.now() };
      setFixedPos({ x: startX, y: startY });
      setGrabbed(true);
    };

    const moveDrag = (clientX: number, clientY: number) => {
      if (!r.dragging) return;
      const now = Date.now();
      const dt  = now - r.prev.t;
      if (dt > 0) {
        r.vel.x = (clientX - r.prev.x) / dt;
        r.vel.y = (clientY - r.prev.y) / dt;
      }
      r.prev = { x: clientX, y: clientY, t: now };
      const np = {
        x: r.startPos.x + (clientX - r.startClient.x),
        y: r.startPos.y + (clientY - r.startClient.y),
      };
      r.pos = np;
      setFixedPos({ ...np });
    };

    const endDrag = () => {
      if (!r.dragging) return;
      r.dragging = false;
      setGrabbed(false);
      r.vel.x *= 18;
      r.vel.y *= 18;
      const FRICTION = 0.88;
      const animate = () => {
        r.vel.x *= FRICTION;
        r.vel.y *= FRICTION;
        if (Math.abs(r.vel.x) < 0.08 && Math.abs(r.vel.y) < 0.08) return;
        r.pos!.x += r.vel.x;
        r.pos!.y += r.vel.y;
        setFixedPos({ x: r.pos!.x, y: r.pos!.y });
        r.raf = requestAnimationFrame(animate);
      };
      r.raf = requestAnimationFrame(animate);
    };

    // ── Touch Events (iOS / Android) ─────────────────────────────────────────
    // Touch events are the most reliable on mobile — do NOT call
    // preventDefault on touchstart before pointerdown fires (kills pointerdown
    // on iOS). Instead handle drag entirely through touch events.
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // safe here — we're NOT using pointerdown on mobile
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    };
    const onTouchEnd = () => endDrag();

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    // move + end on document so tracking survives finger leaving element
    document.addEventListener("touchmove",   onTouchMove, { passive: false });
    document.addEventListener("touchend",    onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);

    // ── Pointer Events (desktop mouse only — skip touch pointers) ────────────
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // handled by touch events above
      e.preventDefault();
      startDrag(e.clientX, e.clientY);

      const onMove = (ev: PointerEvent) => moveDrag(ev.clientX, ev.clientY);
      const onUp   = () => {
        endDrag();
        document.removeEventListener("pointermove",   onMove);
        document.removeEventListener("pointerup",     onUp);
        document.removeEventListener("pointercancel", onUp);
      };
      document.addEventListener("pointermove",   onMove, { passive: false });
      document.addEventListener("pointerup",     onUp);
      document.addEventListener("pointercancel", onUp);
    };
    el.addEventListener("pointerdown", onPointerDown, { passive: false });

    return () => {
      cancelAnimationFrame(r.raf);
      el.removeEventListener("touchstart",   onTouchStart);
      document.removeEventListener("touchmove",    onTouchMove);
      document.removeEventListener("touchend",     onTouchEnd);
      document.removeEventListener("touchcancel",  onTouchEnd);
      el.removeEventListener("pointerdown",  onPointerDown);
    };
  }, []);

  const floatAnim = fixedPos ? "none" : style?.animation;

  return (
    <div
      ref={elRef}
      className={`cs-draggable${className ? ` ${className}` : ""}`}
      style={{
        ...style,
        animation: floatAnim,
        touchAction:  "none",
        userSelect:   "none",
        pointerEvents:"auto",
        ...(fixedPos
          ? { position: "fixed", left: fixedPos.x, top: fixedPos.y, right: "auto", bottom: "auto", transform: "none" }
          : {}),
        cursor:     grabbed ? "grabbing" : "grab",
        zIndex:     grabbed ? 999 : (style?.zIndex ?? 2),
        boxShadow:  grabbed
          ? "0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px color-mix(in srgb,var(--th-accent) 30%,transparent)"
          : undefined,
        scale:      grabbed ? "1.06" : "1",
        transition: grabbed ? "box-shadow .15s, scale .15s" : "box-shadow .3s, scale .3s",
      }}
    >
      {children}
    </div>
  );
}

export default function ComingSoonPage() {
  const [email, setEmail]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [isMobile, setIsMobile]   = useState(false);
  const [theme, setThemeState]    = useState<Theme>("dark");
  const [themeOpen, setThemeOpen] = useState(false);
  const toggleRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mobile =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    setIsMobile(mobile);

    // Force dark on mobile; respect saved preference on desktop
    const saved = localStorage.getItem("nc-theme") as Theme | null;
    const initial: Theme = mobile ? "dark" : (saved ?? "dark");
    document.documentElement.setAttribute("data-theme", initial);
    setThemeState(initial);

    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  // Close theme dropdown on outside click
  useEffect(() => {
    if (!themeOpen) return;
    function onOutside(e: MouseEvent | TouchEvent) {
      const target =
        e instanceof TouchEvent ? e.touches[0]?.target : (e.target as Node);
      if (toggleRef.current && target && !toggleRef.current.contains(target as Node))
        setThemeOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [themeOpen]);

  const applyTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("nc-theme", t);
    setThemeOpen(false);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSubmitted(true);
    toast.success("You're on the list. We'll reach out when we launch.");
  };

  const current = THEMES.find((t) => t.id === theme);

  return (
    <>
      <style>{`
        /* ─── Entrance ───────────────────────────────── */
        @keyframes cs-fade-up {
          from { opacity:0; transform:translateY(22px) scale(0.98); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
        @keyframes cs-fade-in {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes cs-scan {
          from { transform:translateY(-100%); }
          to   { transform:translateY(100vh); }
        }

        /* ─── Mobile background orbs ─────────────────── */
        @keyframes cs-orb-breathe {
          0%,100% { opacity:0.18; transform:scale(1); }
          50%     { opacity:0.28; transform:scale(1.10); }
        }
        @keyframes cs-orb-drift {
          0%,100% { transform:translateX(-50%) scale(1)   translateY(0); }
          40%     { transform:translateX(-52%) scale(1.06) translateY(-14px); }
          70%     { transform:translateX(-48%) scale(0.97) translateY(10px); }
        }
        @keyframes cs-orb2-drift {
          0%,100% { transform:translate(0,0); }
          50%     { transform:translate(-12px,-16px); }
        }
        @keyframes cs-dotgrid-in {
          from { opacity:0; }
          to   { opacity:1; }
        }

        /* ─── Content ────────────────────────────────── */
        @keyframes cs-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position:-200% center; }
        }
        @keyframes cs-dot-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:.35; transform:scale(.5); }
        }
        @keyframes cs-ring-expand {
          0%   { transform:scale(1);   opacity:0.7; }
          100% { transform:scale(2.6); opacity:0; }
        }
        @keyframes cs-bar {
          from { width:0; }
        }
        @keyframes cs-float-a {
          0%,100% { transform:translateY(0) rotate(-2deg); }
          50%     { transform:translateY(-14px) rotate(-0.5deg); }
        }
        @keyframes cs-float-b {
          0%,100% { transform:translateY(0) rotate(2deg); }
          50%     { transform:translateY(-11px) rotate(3.5deg); }
        }
        @keyframes cs-float-c {
          0%,100% { transform:translateY(0) rotate(-1deg); }
          60%     { transform:translateY(-9px) rotate(-2.5deg); }
        }
        @keyframes cs-toggle-in {
          from { opacity:0; transform:translateY(6px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)   scale(1); }
        }

        /* ─── Typography ─────────────────────────────── */
        .cs-heading {
          font-family: var(--font-display, var(--font-sora));
          font-size: clamp(2.2rem, 5.5vw, 4.5rem);
          font-weight: 400;
          line-height: 1.08;
          letter-spacing: -0.025em;
          color: var(--th-text);
          margin: 0 0 20px;
          text-align: center;
        }
        .cs-heading em {
          font-style: italic;
          background: linear-gradient(
            120deg,
            var(--th-accent) 20%,
            color-mix(in srgb, var(--th-accent) 55%, #fff) 48%,
            var(--th-accent) 78%
          );
          background-size: 220% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: cs-shimmer 4s linear infinite;
        }

        /* ─── Draggable wrapper ──────────────────────── */
        .cs-draggable {
          touch-action: none;
          -webkit-user-select: none;
          user-select: none;
        }

        /* ─── Cards ──────────────────────────────────── */
        .cs-hint-card {
          position: absolute;
          touch-action: none;
          backdrop-filter: blur(16px) saturate(1.5);
          -webkit-backdrop-filter: blur(16px) saturate(1.5);
          background: color-mix(in srgb, var(--th-card) 40%, transparent);
          border: 1px solid color-mix(in srgb, var(--th-border) 40%, transparent);
          border-radius: 14px;
          padding: 12px 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.14);
        }

        /* ─── Form ───────────────────────────────────── */
        .cs-email-input {
          flex:1; min-width:0;
          padding:.75rem 1rem;
          border-radius:10px;
          border:1px solid var(--th-border);
          background:color-mix(in srgb,var(--th-card) 60%,transparent);
          color:var(--th-text);
          font-family: var(--font-sora, DM Sans, sans-serif);
          font-size:.875rem;
          outline:none;
          backdrop-filter:blur(8px);
          transition:border-color .2s, background .2s, box-shadow .2s;
        }
        .cs-email-input::placeholder { color:var(--th-text-2); opacity:0.6; }
        .cs-email-input:focus {
          border-color:color-mix(in srgb,var(--th-accent) 70%,var(--th-border));
          background:color-mix(in srgb,var(--th-card) 85%,transparent);
          box-shadow:0 0 0 3px color-mix(in srgb,var(--th-accent) 12%,transparent);
        }
        .cs-submit-btn {
          padding:.75rem 1.35rem;
          border-radius:10px;
          border:none;
          background:var(--th-accent);
          color:var(--th-accent-fg);
          font-family: var(--font-sora, DM Sans, sans-serif);
          font-size:.875rem;
          font-weight:600;
          cursor:pointer;
          white-space:nowrap;
          flex-shrink:0;
          transition:opacity .18s, transform .12s, box-shadow .18s;
          box-shadow:0 4px 0 rgba(0,0,0,0.25), 0 2px 12px rgba(0,0,0,0.14);
        }
        .cs-submit-btn:hover  { opacity:.88; transform:translateY(-2px); box-shadow:0 7px 0 rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.2); }
        .cs-submit-btn:active { transform:translateY(2px); box-shadow:0 1px 0 rgba(0,0,0,0.2); }

        /* ─── Badges & pills ─────────────────────────── */
        .cs-badge {
          display:inline-flex; align-items:center; gap:10px;
          padding:6px 16px; border-radius:999px;
          border:1px solid var(--th-border);
          background:color-mix(in srgb,var(--th-card) 55%,transparent);
          backdrop-filter:blur(8px);
          font-size:.7rem; font-weight:600;
          letter-spacing:.1em; text-transform:uppercase;
          color:var(--th-text-2);
        }
        .cs-pill {
          display:inline-flex; align-items:center; gap:8px;
          padding:6px 14px; border-radius:999px;
          border:1px solid var(--th-border);
          background:color-mix(in srgb,var(--th-card) 50%,transparent);
          backdrop-filter:blur(6px);
          font-size:.72rem; font-weight:500; letter-spacing:.02em;
          color:var(--th-text-2);
          white-space:nowrap;
          transition:border-color .2s, background .2s;
        }

        /* ─── Misc ───────────────────────────────────── */
        .cs-grain {
          position:fixed; inset:0; z-index:1; pointer-events:none; opacity:.022;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:180px 180px;
        }
        .cs-scan {
          position:fixed; left:0; right:0; height:1.5px; z-index:2; pointer-events:none;
          background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--th-accent) 12%,transparent),transparent);
          animation:cs-scan 14s linear infinite;
        }
        .cs-rule {
          width:100%; height:1px;
          background:linear-gradient(90deg,transparent,var(--th-border) 25%,
            color-mix(in srgb,var(--th-accent) 30%,var(--th-border)) 50%,
            var(--th-border) 75%,transparent);
        }

        /* ─── Mobile-only orb bg ─────────────────────── */
        .cs-orb-wrap { position:fixed; inset:0; pointer-events:none; overflow:hidden; }
        .cs-orb {
          position:absolute;
          border-radius:50%;
          filter:blur(65px);
        }
        .cs-orb-1 {
          width:min(460px, 110vw);
          height:min(460px, 110vw);
          background:radial-gradient(circle, color-mix(in srgb,var(--th-accent) 45%,transparent), transparent 70%);
          top:-8%;
          left:50%;
          transform:translateX(-50%);
          animation:cs-orb-breathe 7s ease-in-out infinite, cs-orb-drift 13s ease-in-out infinite;
          opacity:0.22;
        }
        .cs-orb-2 {
          width:min(300px, 80vw);
          height:min(300px, 80vw);
          background:radial-gradient(circle, color-mix(in srgb,#7acc8a 35%,transparent), transparent 70%);
          bottom:2%;
          right:-8%;
          animation:cs-orb-breathe 9s ease-in-out 2.5s infinite, cs-orb2-drift 11s ease-in-out infinite;
          opacity:0.15;
        }
        .cs-dotgrid {
          position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image:radial-gradient(circle, color-mix(in srgb,var(--th-border) 55%,transparent) 1px, transparent 1px);
          background-size:26px 26px;
          opacity:0.4;
          animation:cs-dotgrid-in .9s ease .4s both;
          mask-image:radial-gradient(ellipse 75% 75% at 50% 50%, black 10%, transparent 80%);
          -webkit-mask-image:radial-gradient(ellipse 75% 75% at 50% 50%, black 10%, transparent 80%);
        }

        /* ─── Theme toggle ───────────────────────────── */
        .cs-theme-wrap {
          position:fixed;
          bottom:24px;
          left:24px;
          z-index:9999;
          animation:cs-fade-in .5s ease 1.2s both;
        }
        .cs-theme-btn {
          background:var(--th-card);
          border:1px solid var(--th-border);
          color:var(--th-text);
          border-radius:999px;
          padding:.42rem .85rem;
          font-size:.7rem;
          font-weight:500;
          display:flex;
          align-items:center;
          gap:.44rem;
          box-shadow:0 4px 20px rgba(0,0,0,0.22);
          white-space:nowrap;
          cursor:pointer;
          user-select:none;
          transition:box-shadow .2s, transform .15s;
          font-family:var(--font-sora, DM Sans, sans-serif);
          backdrop-filter:blur(10px);
        }
        .cs-theme-btn:hover { box-shadow:0 8px 32px rgba(0,0,0,0.3); transform:scale(1.04); }
        .cs-theme-dropdown {
          position:absolute;
          bottom:calc(100% + 8px);
          left:0;
          background:var(--th-card);
          border:1px solid var(--th-border);
          border-radius:.75rem;
          overflow:hidden;
          box-shadow:0 10px 48px rgba(0,0,0,0.28);
          width:155px;
          padding:4px;
          animation:cs-toggle-in .18s cubic-bezier(.16,1,.3,1);
          backdrop-filter:blur(14px);
        }
        .cs-theme-item {
          display:flex; align-items:center; gap:.55rem;
          width:100%; padding:.45rem .72rem;
          font-size:.73rem;
          background:transparent; border:none; border-radius:.5rem;
          cursor:pointer;
          transition:background .12s;
          font-family:var(--font-sora, DM Sans, sans-serif);
          text-align:left;
          color:var(--th-text-2);
        }
        .cs-theme-item:hover { background:var(--th-border); color:var(--th-text); }
        .cs-theme-item.active { color:var(--th-accent); font-weight:600; }

        /* ─── Resize floating cards + hide theme toggle on mobile ── */
        @media (max-width: 767px) {
          .cs-theme-wrap { display:none !important; }

          /* shrink all cards */
          .cs-hint-card {
            padding: 8px 11px !important;
            border-radius: 10px !important;
            min-width: 0 !important;
            max-width: 130px;
          }

          /* card 1 — top-left corner */
          .cs-card-contribution {
            left: 8px !important;
            top: 72px !important;
            right: auto !important;
            bottom: auto !important;
          }
          .cs-card-contribution .cs-card-big-num { font-size:1.25rem !important; }
          .cs-card-contribution .cs-card-label   { font-size:.58rem !important; }
          .cs-card-contribution .cs-card-sub     { font-size:.55rem !important; }

          /* card 2 — top-right corner */
          .cs-card-grade {
            right: 8px !important;
            top: 72px !important;
            left: auto !important;
            bottom: auto !important;
          }
          .cs-card-grade .cs-card-big-num { font-size:1.5rem !important; }
          .cs-card-grade .cs-card-label   { font-size:.58rem !important; }
          .cs-card-grade .cs-card-sub     { font-size:.55rem !important; }

          /* card 3 — vertically centered, right side */
          .cs-card-freeloader {
            left: auto !important;
            right: 2px !important;
            top: 47% !important;
            bottom: auto !important;
            transform: translateY(-50%) rotate(2deg) !important;
            min-width: 0 !important;
            gap: 7px !important;
          }
          .cs-card-freeloader .cs-card-icon {
            width: 22px !important;
            height: 22px !important;
            border-radius: 6px !important;
            font-size: .75rem !important;
          }
          .cs-card-freeloader .cs-card-title { font-size: .62rem !important; }
          .cs-card-freeloader .cs-card-sub   { font-size: .55rem !important; }
        }
      `}</style>

      {/* Grain + scan */}
      <div className="cs-grain" aria-hidden />
      <div className="cs-scan"  aria-hidden />

      {/* ── Background ── */}
      <div aria-hidden style={{ position:"fixed", inset:0, zIndex:-1, background:"var(--th-bg)", pointerEvents:"none" }}>
        {isMobile ? (
          <>
            <div className="cs-dotgrid" />
            <div className="cs-orb-wrap">
              <div className="cs-orb cs-orb-1" />
              <div className="cs-orb cs-orb-2" />
            </div>
          </>
        ) : (
          <EtherealShadow
            color="var(--th-accent)"
            animation={{ scale: 50, speed: 95 }}
            noise={{ opacity: 0.4, scale: 1.0 }}
            sizing="fill"
            style={{ opacity: 0.20 }}
          />
        )}
      </div>

      {/* ── Floating hint cards (desktop only) ── */}
      {mounted && (
        <>
          {/* Card 1 — Contribution */}
          <DraggableCard
            className="cs-hint-card cs-card-contribution"
            style={{ left:"clamp(1rem,4vw,5rem)", top:"clamp(20%,28%,32%)", display:"flex", flexDirection:"column", gap:8, minWidth:170, animation:"cs-float-a 6s ease-in-out infinite", zIndex:2 }}
          >
            <div className="cs-card-label" style={{ fontSize:".68rem", color:"var(--th-text-2)", fontWeight:600, letterSpacing:".08em", textTransform:"uppercase" }}>Contribution</div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:6 }}>
              <span className="cs-card-big-num" style={{ fontSize:"1.8rem", fontWeight:800, fontFamily:"var(--font-sora)", color:"var(--th-text)", lineHeight:1 }}>92</span>
              <span style={{ fontSize:".7rem", color:"var(--th-text-2)", paddingBottom:3 }}>/ 100</span>
            </div>
            <div style={{ height:4, borderRadius:999, background:"var(--th-border)", overflow:"hidden" }}>
              <div style={{ height:"100%", width:"92%", borderRadius:999, background:"var(--th-accent)", animation:"cs-bar 1.4s cubic-bezier(.16,1,.3,1) 1.6s both" }}/>
            </div>
            <div className="cs-card-sub" style={{ fontSize:".65rem", color:"var(--th-text-2)" }}>Highest on the team ✦</div>
          </DraggableCard>

          {/* Card 2 — Fair Grade */}
          <DraggableCard
            className="cs-hint-card cs-card-grade"
            style={{ right:"clamp(1rem,4vw,5rem)", top:"clamp(22%,30%,36%)", display:"flex", flexDirection:"column", gap:6, minWidth:150, animation:"cs-float-b 7s ease-in-out .5s infinite", zIndex:2 }}
          >
            <div className="cs-card-label" style={{ fontSize:".68rem", color:"var(--th-text-2)", fontWeight:600, letterSpacing:".08em", textTransform:"uppercase" }}>Fair Grade</div>
            <div className="cs-card-big-num" style={{ fontSize:"2rem", fontWeight:800, fontFamily:"var(--font-sora)", color:"var(--th-accent)", lineHeight:1 }}>A</div>
            <div className="cs-card-sub" style={{ fontSize:".65rem", color:"var(--th-text-2)", lineHeight:1.4 }}>Adjusted for<br/>real effort</div>
          </DraggableCard>

          {/* Card 3 — Freeloader */}
          <DraggableCard
            className="cs-hint-card cs-card-freeloader"
            style={{ left:"clamp(1rem,5vw,7rem)", bottom:"clamp(12%,18%,22%)", display:"flex", alignItems:"center", gap:10, minWidth:190, animation:"cs-float-c 8s ease-in-out 1s infinite", zIndex:2 }}
          >
            <div className="cs-card-icon" style={{ width:30, height:30, borderRadius:8, flexShrink:0, background:"color-mix(in srgb,var(--th-accent) 14%,var(--th-card))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem" }}>⚠️</div>
            <div>
              <div className="cs-card-title" style={{ fontSize:".72rem", fontWeight:600, color:"var(--th-text)" }}>Freeloader detected</div>
              <div className="cs-card-sub" style={{ fontSize:".63rem", color:"var(--th-text-2)" }}>Alex · 3% contribution</div>
            </div>
          </DraggableCard>
        </>
      )}

      {/* ── Main content ── */}
      <div style={{
        minHeight:"100dvh",
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        justifyContent:"center",
        position:"relative",
        zIndex:1,
        padding:"2rem 1.25rem 5.5rem",
        fontFamily:"var(--font-sora, DM Sans, sans-serif)",
      }}>

        {/* Brand mark */}
        {mounted && (
          <div className="nc-brand" style={{
            marginBottom:"2.5rem",
            animation:"cs-pop .55s cubic-bezier(.16,1,.3,1) .05s both",
            display:"inline-flex", alignItems:"center", gap:"0.45rem",
          }}>
            <span className="nc-brand-dot" />
            <span className="nc-brand-text" style={{ fontSize:"1rem" }}>NoCarry</span>
          </div>
        )}

        {/* Eyebrow */}
        {mounted && (
          <div style={{
            display:"flex", alignItems:"center", gap:10, marginBottom:24,
            animation:"cs-fade-in .5s ease .18s both",
          }}>
            <div style={{ width:18, height:1.5, background:"var(--th-accent)", flexShrink:0 }} />
            <span style={{
              color:"var(--th-accent)",
              fontSize:"0.6875rem",
              fontWeight:600,
              letterSpacing:"0.08em",
              textTransform:"uppercase",
            }}>
              Coming soon
            </span>
            <div style={{ width:18, height:1.5, background:"var(--th-accent)", flexShrink:0 }} />
          </div>
        )}

        {/* Heading */}
        {mounted && (
          <h1
            className="cs-heading"
            style={{ animation:"cs-fade-up .7s cubic-bezier(.16,1,.3,1) .26s both", maxWidth:600 }}
          >
            Fair grading,<br />
            <em>finally</em> coming.
          </h1>
        )}

        {/* Body */}
        {mounted && (
          <p style={{
            color:"var(--th-text-2)",
            fontSize:"clamp(.875rem, 2.4vw, .9375rem)",
            lineHeight:1.75,
            maxWidth:420,
            textAlign:"center",
            margin:"0 0 32px",
            animation:"cs-fade-up .7s cubic-bezier(.16,1,.3,1) .38s both",
          }}>
            NoCarry is getting its final polish.{" "}
            Track real contributions, surface freeloaders, and grade group projects fairly.
          </p>
        )}

        {/* Rule */}
        {mounted && (
          <div className="cs-rule" style={{
            maxWidth:420, marginBottom:"1.75rem",
            animation:"cs-fade-in .6s ease .48s both",
          }}/>
        )}

        {/* Feature pills — staggered */}
        {mounted && (
          <div style={{
            display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center",
            marginBottom:"2rem",
          }}>
            {[
              { label:"Contribution tracking", color:"var(--th-accent)",  delay:".56s" },
              { label:"AI-powered reports",    color:"#7acc8a",           delay:".68s" },
              { label:"Fair grade adjustment", color:"color-mix(in srgb,var(--th-accent) 60%,#7aa2f7)", delay:".8s" },
            ].map(({ label, color, delay }) => (
              <div
                key={label}
                className="cs-pill"
                style={{ animation:`cs-pill-pop .55s cubic-bezier(.16,1,.3,1) ${delay} both` }}
              >
                <span style={{
                  width:6, height:6, borderRadius:"50%", flexShrink:0,
                  display:"inline-block", background:color,
                  boxShadow:`0 0 5px ${color}88`,
                }}/>
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Live badge with pulse ring */}
        {mounted && (
          <div className="cs-badge" style={{
            marginBottom:"1.75rem",
            animation:"cs-fade-in .6s ease .9s both",
          }}>
            {/* dot + ring wrapper */}
            <span style={{
              position:"relative", display:"inline-flex",
              alignItems:"center", justifyContent:"center",
              width:12, height:12, flexShrink:0,
            }}>
              <span style={{
                position:"absolute", inset:0, borderRadius:"50%",
                background:"rgba(122,204,138,.5)",
                animation:"cs-ring-expand 2s ease-out infinite",
              }}/>
              <span style={{
                width:7, height:7, borderRadius:"50%",
                background:"#7acc8a", display:"inline-block",
                animation:"cs-dot-pulse 2s ease-in-out infinite",
                boxShadow:"0 0 6px rgba(122,204,138,.65)",
                position:"relative",
              }}/>
            </span>
            Demo in progress
          </div>
        )}

        {/* Email form */}
        {mounted && (
          <div style={{
            width:"100%", maxWidth:420,
            animation:"cs-fade-up .7s cubic-bezier(.16,1,.3,1) 1s both",
          }}>
            {submitted ? (
              <div style={{
                padding:".85rem 1.2rem", borderRadius:12,
                border:"1px solid color-mix(in srgb,#7acc8a 30%,var(--th-border))",
                background:"color-mix(in srgb,#7acc8a 6%,var(--th-card))",
                color:"#7acc8a", fontSize:".875rem", fontWeight:500,
                textAlign:"center", backdropFilter:"blur(8px)",
                animation:"cs-pop .4s cubic-bezier(.16,1,.3,1)",
              }}>
                You&apos;re on the list. Talk soon. ✦
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} style={{ display:"flex", gap:8, width:"100%" }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="cs-email-input"
                  />
                  <button type="submit" className="cs-submit-btn">Notify me</button>
                </form>
                <p style={{
                  marginTop:".6rem", fontSize:".68rem",
                  color:"var(--th-text-2)", opacity:.5,
                  letterSpacing:".03em", textAlign:"center",
                }}>
                  No spam — just a ping when we ship.
                </p>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          position:"absolute", bottom:"1.75rem", left:0, right:0,
          textAlign:"center",
          fontSize:".65rem", color:"var(--th-border)",
          letterSpacing:".08em", fontWeight:700,
          textTransform:"uppercase", zIndex:4,
        }}>
          © 2026 NoCarry — Fair grading, finally.
        </div>
      </div>

      {/* ── Theme toggle — bottom-left, desktop only ── */}
      {mounted && (
        <div ref={toggleRef} className="cs-theme-wrap">
          {themeOpen && (
            <div className="cs-theme-dropdown">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`cs-theme-item${t.id === theme ? " active" : ""}`}
                  onPointerDown={() => applyTheme(t.id)}
                >
                  <span style={{
                    width:8, height:8, borderRadius:"50%",
                    background:t.dot, flexShrink:0, display:"inline-block",
                    boxShadow: t.id === theme ? `0 0 6px ${t.dot}cc` : "none",
                    transition:"box-shadow .15s",
                  }}/>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="cs-theme-btn" onClick={() => setThemeOpen((o) => !o)}>
            <span style={{
              width:7, height:7, borderRadius:"50%",
              background: current?.dot ?? "var(--th-accent)",
              display:"inline-block", flexShrink:0,
            }}/>
            <span style={{ color:"var(--th-text-2)" }}>{current?.label ?? "Theme"}</span>
            <span style={{ color:"var(--th-text-2)", opacity:.5, fontSize:".6rem" }}>
              {themeOpen ? "▾" : "▸"}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
