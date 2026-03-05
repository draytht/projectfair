"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
          {/* suppressHydrationWarning: year can differ between server (UTC) and client (local timezone) */}
          <p suppressHydrationWarning style={{ color: "var(--th-text-2)", fontSize: "0.75rem" }}>
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
