"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { CTAButton } from "@/components/CTAButton";

// 3D folder stack — loaded client-side only, zero SSR cost
const FolderStack = dynamic(
  () => import("@/components/FolderStack").then((m) => ({ default: m.FolderStack })),
  { ssr: false, loading: () => null }
);

// ── Scroll-triggered reveal ───────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Problem card illustrations ────────────────────────────────────────────────

// Card 01: one person (left) has a stacking pile of tasks; others are idle
function OverloadViz() {
  return (
    <svg
      width="80" height="44" viewBox="0 0 80 44"
      fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
      style={{ display: "block", color: "var(--th-accent)" }}
    >
      {[0, 1, 2].map((i) => (
        <rect key={i} x="2" y={2 + i * 7} width="18" height="5" rx="1.3"
          opacity={1 - i * 0.22}
          style={{ animation: `nc-prob-bob ${1.9 + i * 0.15}s ease-in-out ${i * 0.14}s infinite` }}
        />
      ))}
      {/* Person 1 — overloaded */}
      <circle cx="11" cy="31" r="6" />
      <line x1="11" y1="37" x2="11" y2="44" strokeWidth="2" />
      {/* Persons 2 & 3 — idle */}
      {[40, 69].map((x) => (
        <g key={x} opacity="0.14">
          <circle cx={x} cy="31" r="6" />
          <line x1={x} y1="37" x2={x} y2="44" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}

// Card 02: a grade that rapidly cycles through random letters
const GRADES = ["A+", "D−", "B", "F", "C+"];
function RandomGradeViz() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % GRADES.length), 950);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        key={i}
        style={{
          width: 46, height: 46, borderRadius: 10, flexShrink: 0,
          border: "1px solid color-mix(in srgb, var(--th-accent) 28%, var(--th-border))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700,
          color: "var(--th-accent)",
          animation: "nc-prob-grade-in 0.28s ease-out",
        }}
      >
        {GRADES[i]}
      </div>
      {/* Rubric lines — static, same rubric, different grade every time */}
      <svg width="30" height="16" viewBox="0 0 30 16" fill="none"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.3">
        <line x1="0" y1="2"  x2="30" y2="2"  />
        <line x1="0" y1="8"  x2="22" y2="8"  />
        <line x1="0" y1="14" x2="26" y2="14" />
      </svg>
    </div>
  );
}

// Card 03: two star rows that alternate — friends get 5/5, real contributors get 1/5
function BiasedReviewViz() {
  const [friendsHighlighted, setFriendsHighlighted] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setFriendsHighlighted((h) => !h), 1600);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {([true, false] as const).map((isFriend) => {
        const filled = isFriend ? 5 : 1;
        const active = isFriend ? friendsHighlighted : !friendsHighlighted;
        return (
          <div key={String(isFriend)}
            style={{ display: "flex", alignItems: "center", gap: 3,
              opacity: active ? 1 : 0.18, transition: "opacity 0.5s" }}
          >
            {[0, 1, 2, 3, 4].map((idx) => (
              <svg key={idx} width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1 8 4.5H12L9 6.8l1.2 3.7L6.5 8.3 3.8 10.5 5 6.8 2 4.5h4z"
                  fill={idx < filled ? "var(--th-accent)" : "none"}
                  stroke="var(--th-accent)" strokeWidth="1" strokeLinejoin="round"
                  opacity={idx < filled ? 1 : 0.2}
                />
              </svg>
            ))}
            <span style={{ fontSize: "0.6rem", color: "var(--th-accent)", fontWeight: 600,
              marginLeft: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {isFriend ? "friend" : "contributor"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Problem card ──────────────────────────────────────────────────────────────
function ProblemCard({
  n,
  title,
  desc,
  delay,
  visual,
}: {
  n: string;
  title: string;
  desc: string;
  delay: number;
  visual: React.ReactNode;
}) {
  return (
    <Reveal delay={delay}>
      <div
        className="nc-problem-card"
        style={{
          background: "var(--th-card)",
          border: "1px solid var(--th-border)",
          borderRadius: 16,
          padding: "28px 24px",
          position: "relative",
          overflow: "hidden",
          transition: "border-color 0.2s, transform 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "color-mix(in srgb, var(--th-accent) 40%, var(--th-border))";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--th-border)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        {/* Subtle top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, var(--th-accent), transparent)",
            opacity: 0.5,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2.5rem",
            color: "color-mix(in srgb, var(--th-accent) 18%, var(--th-border))",
            lineHeight: 1, display: "block",
            marginBottom: 20, letterSpacing: "-0.02em",
          }}
        >
          {n}
        </span>
        {/* Animated illustration */}
        <div style={{ marginBottom: 20 }}>{visual}</div>
        <h3 style={{ color: "var(--th-text)", fontWeight: 600, fontSize: "0.9375rem", marginBottom: 8, lineHeight: 1.4 }}>
          {title}
        </h3>
        <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", lineHeight: 1.65 }}>
          {desc}
        </p>
      </div>
    </Reveal>
  );
}

// ── Feature row ───────────────────────────────────────────────────────────────
function FeatureRow({
  icon,
  title,
  desc,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div
        className="flex gap-4 group"
        style={{ padding: "22px 0", borderTop: "1px solid var(--th-border)" }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "color-mix(in srgb, var(--th-accent) 10%, var(--th-card))",
            border: "1px solid color-mix(in srgb, var(--th-accent) 22%, var(--th-border))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--th-accent)",
            transition: "background 0.25s, border-color 0.25s",
          }}
        >
          {icon}
        </div>
        <div>
          <h3
            style={{ color: "var(--th-text)", fontWeight: 600, fontSize: "0.9375rem", marginBottom: 4 }}
          >
            {title}
          </h3>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", lineHeight: 1.65 }}>
            {desc}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

// ── Animated SVG Icons ────────────────────────────────────────────────────────
const I = {
  // Clock with two rotating hands — shows time tracking in action
  Score: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="10" cy="10" r="8" />
      {/* Hour hand — slow */}
      <line x1="10" y1="10" x2="10" y2="5.5" strokeWidth="2"
        style={{ transformOrigin: "10px 10px", animation: "nc-icon-spin 8s linear infinite" }} />
      {/* Minute hand — fast */}
      <line x1="10" y1="10" x2="14" y2="10" strokeWidth="1.4"
        style={{ transformOrigin: "10px 10px", animation: "nc-icon-spin 1.5s linear infinite" }} />
      <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),

  // Circle with a checkmark that draws itself, loops
  Review: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <path d="M6.5 10.5 9 13 13.5 7.5"
        style={{ strokeDasharray: 11, strokeDashoffset: 11, animation: "nc-icon-check 2.6s ease-in-out infinite" }} />
    </svg>
  ),

  // Flag that waves from the pole
  Flag: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="2" x2="4" y2="18" />
      <g style={{ transformOrigin: "4px 2px", animation: "nc-icon-flag 2.4s ease-in-out infinite" }}>
        <path d="M4 2h12l-3 4.5 3 4.5H4" />
      </g>
    </svg>
  ),

  // Robot head with blinking eyes
  AI: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="6.5" width="15" height="9.5" rx="2.5" />
      <path d="M7 6.5V5a3 3 0 0 1 6 0v1.5" />
      <circle cx="7.5" cy="12" r="1.5" fill="currentColor" stroke="none"
        style={{ transformOrigin: "7.5px 12px", animation: "nc-icon-blink 3.2s ease-in-out infinite" }} />
      <circle cx="12.5" cy="12" r="1.5" fill="currentColor" stroke="none"
        style={{ transformOrigin: "12.5px 12px", animation: "nc-icon-blink 3.2s ease-in-out infinite 0.15s" }} />
    </svg>
  ),

  // Kanban columns — middle column grows as tasks are added
  Kanban: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1.5"  y="2.5" width="4" height="9"  rx="1.3" />
      <rect x="8"    y="2.5" width="4" height="5.5" rx="1.3"
        style={{ transformOrigin: "10px 2.5px", animation: "nc-icon-col 3s ease-in-out infinite" }} />
      <rect x="14.5" y="2.5" width="4" height="14" rx="1.3" />
    </svg>
  ),

  // Monitor with animated bar chart inside
  Monitor: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2.5" width="16" height="11" rx="1.5" />
      <path d="M7 17.5h6M10 13.5v4" />
      <rect x="5"  y="8"   width="2.2" height="4.5" rx="0.5" fill="currentColor" stroke="none"
        style={{ transformOrigin: "6.1px 12.5px", animation: "nc-icon-bar 1.9s ease-in-out infinite" }} />
      <rect x="9"  y="6"   width="2.2" height="6.5" rx="0.5" fill="currentColor" stroke="none"
        style={{ transformOrigin: "10.1px 12.5px", animation: "nc-icon-bar 1.9s ease-in-out infinite 0.48s" }} />
      <rect x="13" y="9"   width="2.2" height="3.5" rx="0.5" fill="currentColor" stroke="none"
        style={{ transformOrigin: "14.1px 12.5px", animation: "nc-icon-bar 1.9s ease-in-out infinite 0.96s" }} />
    </svg>
  ),
};

// ── Data ──────────────────────────────────────────────────────────────────────
const problems = [
  { n: "01", title: "One person does everything", desc: "The same student carries the whole team while others coast. No visibility. No accountability." },
  { n: "02", title: "Grades feel random",         desc: "Professors can't see who actually did the work. Everyone gets the same grade regardless of effort." },
  { n: "03", title: "Peer reviews are biased",    desc: "Friends rate friends highly. Real contributors go unrecognized. The system breaks." },
];

const features = [
  { icon: <I.Score />,   title: "Contribution Scoring",    desc: "Every task created, completed, and assigned is tracked. Weighted scores are calculated automatically across the full project timeline." },
  { icon: <I.Review />,  title: "Smart Peer Reviews",      desc: "Rate teammates on quality, communication, timeliness, and initiative. Statistical anomalies and grade inflation are flagged automatically." },
  { icon: <I.Flag />,    title: "Freeloader Detection",    desc: "Members with low activity, last-minute contributions, or mismatched peer ratings are surfaced with hard evidence — not guesses." },
  { icon: <I.AI />,      title: "AI Report Generator",     desc: "Professors get an instant AI-written contribution analysis with grading suggestions, backed by raw data from the entire project." },
  { icon: <I.Kanban />,  title: "Kanban Task Board",       desc: "Teams manage work in a clean board — To Do, In Progress, and Done. Every move is logged and counted toward individual scores." },
  { icon: <I.Monitor />, title: "Professor Dashboard",     desc: "Real-time visibility into every team's progress, task distribution, peer review scores, and contribution flags from one place." },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main style={{ background: "var(--th-bg)", color: "var(--th-text)" }} className="min-h-screen nc-landing">

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav
        style={{ borderBottom: "1px solid var(--th-border)" }}
        className="flex items-center justify-between px-6 md:px-10 py-4"
      >
        <Link href="/" className="nc-brand">
          <span className="nc-brand-dot" />
          <span className="nc-brand-text">No<span style={{ color: "var(--th-accent)" }}>Carry</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            style={{ color: "var(--th-text-2)" }}
            className="text-sm px-3 py-2.5 rounded-lg hover:opacity-70 transition-opacity min-h-[44px] flex items-center"
          >
            Log in
          </Link>
          <CTAButton
            href="/signup"
            style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
            className="text-sm px-4 py-2.5 rounded-lg font-medium hover:opacity-80 active:scale-95 transition-[opacity,transform] min-h-[44px] flex items-center"
          >
            Get started
          </CTAButton>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="nc-hero-grid px-6 md:px-10 pt-16 md:pt-20 pb-16 max-w-5xl mx-auto">
        {/* Left: text */}
        <div className="flex flex-col justify-center" style={{ alignItems: "flex-start" }}>
          <Reveal>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
                padding: "5px 12px",
                borderRadius: 999,
                background: "color-mix(in srgb, var(--th-accent) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--th-accent) 25%, transparent)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--th-accent)",
                  display: "inline-block",
                  boxShadow: "0 0 6px var(--th-accent)",
                }}
              />
              <span style={{ color: "var(--th-accent)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Fair grading for group projects
              </span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="nc-hero-heading">
              Group projects,<br />
              <em>finally</em> fair.
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p style={{ color: "var(--th-text-2)", fontSize: "0.9375rem", lineHeight: 1.75, marginBottom: 32, maxWidth: 400 }}>
              Track real contributions, surface freeloaders automatically, and give professors the data they need to grade with confidence.
            </p>
          </Reveal>

          <Reveal delay={280}>
            <div className="flex flex-wrap gap-3">
              <CTAButton
                href="/signup"
                style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
                className="nc-btn-3d text-sm font-semibold px-6 py-3.5 rounded-lg hover:opacity-85 active:scale-95 transition-[opacity,transform] min-h-[48px] flex items-center"
              >
                Start for free →
              </CTAButton>
              <CTAButton
                href="/login"
                style={{ border: "1px solid var(--th-border)", color: "var(--th-text-2)" }}
                className="text-sm font-medium px-6 py-3.5 rounded-lg hover:opacity-70 active:scale-95 transition-[opacity,transform] min-h-[48px] flex items-center"
              >
                Log in
              </CTAButton>
            </div>
          </Reveal>

          {/* Social proof */}
          <Reveal delay={360}>
            <div className="flex items-center gap-3 mt-10">
              <div className="flex -space-x-2">
                {["#7dd3fc","#86efac","#fca5a5","#f0abfc"].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: c,
                      border: "2px solid var(--th-bg)",
                    }}
                  />
                ))}
              </div>
              <p style={{ color: "var(--th-text-2)", fontSize: "0.75rem" }}>
                Used by students across universities
              </p>
            </div>
          </Reveal>
        </div>

        {/* Right: 3D folder stack */}
        <div className="nc-hero-scene-wrap">
          {/* Radial glow — driven by theme accent, seamless blending */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 50% 45%, color-mix(in srgb, var(--th-accent) 14%, transparent) 0%, transparent 70%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* The folder stack — full width/height of container */}
          <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 1 }}>
            <FolderStack />
          </div>

          {/* Seamless bottom fade — blends scene into page background */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              background: "linear-gradient(to bottom, transparent, var(--th-bg))",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--th-border)" }} className="max-w-5xl mx-auto px-6" />

      {/* ── Problems ──────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-16 max-w-5xl mx-auto">
        <Reveal>
          <div className="flex items-center gap-3 mb-12">
            <div style={{ width: 20, height: 1.5, background: "var(--th-accent)" }} />
            <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
              The problem
            </p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {problems.map((p, i) => (
            <ProblemCard key={p.n} {...p} delay={i * 90}
              visual={[<OverloadViz />, <RandomGradeViz />, <BiasedReviewViz />][i]}
            />
          ))}
        </div>
      </section>

      <div style={{ borderTop: "1px solid var(--th-border)" }} className="max-w-5xl mx-auto" />

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-16 max-w-5xl mx-auto">
        {/* Header spans full width — visually anchors both columns equally */}
        <Reveal>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderBottom: "1px solid var(--th-border)",
              paddingBottom: 18,
              marginBottom: 0,
            }}
          >
            <div style={{ width: 20, height: 1.5, background: "var(--th-accent)", flexShrink: 0 }} />
            <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
              How NoCarry fixes it
            </p>
          </div>
        </Reveal>
        {/* Grid — border-bottom closes the final row cleanly */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0"
          style={{ borderBottom: "1px solid var(--th-border)" }}
        >
          {features.map((f, i) => (
            <FeatureRow key={f.title} {...f} delay={i * 70} />
          ))}
        </div>
      </section>

      {/* ── For students / professors ──────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <Reveal>
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div style={{ width: 20, height: 1.5, background: "var(--th-accent)" }} />
                <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>For Students</p>
              </div>
              <ul className="space-y-4">
                {[
                  "Protect yourself from carrying the team",
                  "Prove your contributions with real data",
                  "Rate teammates fairly and anonymously",
                  "Track your tasks and deadlines clearly",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span style={{ color: "var(--th-accent)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span style={{ color: "var(--th-text-2)", fontSize: "0.875rem", lineHeight: 1.6 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div style={{ width: 20, height: 1.5, background: "var(--th-accent)" }} />
                <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>For Professors</p>
              </div>
              <ul className="space-y-4">
                {[
                  "See real engagement — not just final output",
                  "Get AI-generated grading reports instantly",
                  "Detect freeloaders with contribution flags",
                  "Monitor all teams from a single dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span style={{ color: "var(--th-accent)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>—</span>
                    <span style={{ color: "var(--th-text-2)", fontSize: "0.875rem", lineHeight: 1.6 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <div style={{ borderTop: "1px solid var(--th-border)" }} className="max-w-5xl mx-auto" />

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-28 text-center relative overflow-hidden">
        {/* Radial glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, color-mix(in srgb, var(--th-accent) 8%, transparent) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <Reveal>
          <h2 className="nc-cta-heading">
            Stop letting freeloaders win.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p style={{ color: "var(--th-text-2)", fontSize: "1rem", marginBottom: 40, marginTop: 16 }}>
            Join NoCarry and make group work fair for everyone.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <CTAButton
            href="/signup"
            style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
            className="text-sm font-semibold px-8 py-3.5 rounded-lg hover:opacity-85 active:scale-95 transition-[opacity,transform] inline-block"
          >
            Create your free account →
          </CTAButton>
        </Reveal>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        style={{ borderTop: "1px solid var(--th-border)", color: "var(--th-text-2)" }}
        className="px-6 md:px-10 py-5 flex items-center justify-between text-xs"
      >
        <Link href="/" className="nc-brand">
          <span className="nc-brand-dot" style={{ width: 5, height: 5 }} />
          <span style={{ fontWeight: 600, fontSize: "0.75rem", color: "var(--th-text-2)" }}>NoCarry</span>
        </Link>
        <span>Built for students. Trusted by professors.</span>
      </footer>
    </main>
  );
}
