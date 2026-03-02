"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AutoScrollingCarouselItem {
  name: string;
  logo?: React.ReactNode;
  href?: string;
}

export interface AutoScrollingClientCarouselProps {
  title?: string;
  clients?: AutoScrollingCarouselItem[];
  /** Seconds for one full scroll cycle. Lower = faster. */
  speed?: number;
  className?: string;
}

// ── Tech stack SVG logos ──────────────────────────────────────────────────────

const NextjsLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
    <path d="M14 0C6.268 0 0 6.268 0 14s6.268 14 14 14 14-6.268 14-14S21.732 0 14 0Zm5.83 20.023L10.658 8.4H8.4v11.193h1.89V10.84l8.258 10.3a11.17 11.17 0 0 1-4.548.96c-6.075 0-11-4.925-11-11s4.925-11 11-11 11 4.925 11 11c0 2.996-1.2 5.712-3.15 7.714v.01Zm.07-3.64V8.4h-1.89v6.107l1.89 2.357-.001-.48Z" />
  </svg>
);

const ReactLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
    <circle cx="14" cy="14" r="2.4" />
    <ellipse cx="14" cy="14" rx="13" ry="5.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <ellipse cx="14" cy="14" rx="13" ry="5.2" fill="none" stroke="currentColor" strokeWidth="1.4" transform="rotate(60 14 14)" />
    <ellipse cx="14" cy="14" rx="13" ry="5.2" fill="none" stroke="currentColor" strokeWidth="1.4" transform="rotate(120 14 14)" />
  </svg>
);

const TypeScriptLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
    <rect width="28" height="28" rx="3" />
    <path fill="var(--th-bg,#fff)" d="M6 16.5h4.2v-1.4H8.6V11H7V16.5Zm7.5 0c1.6 0 2.6-.8 2.6-2 0-1-.6-1.6-1.8-2l-.5-.2c-.7-.3-1-.5-1-.9 0-.3.3-.6.8-.6.5 0 .9.2 1.3.6l.9-1c-.5-.6-1.3-1-2.2-1-1.4 0-2.4.8-2.4 2 0 1 .7 1.7 1.7 2.1l.5.2c.8.3 1 .6 1 1 0 .4-.3.7-.9.7-.6 0-1.1-.3-1.5-.8l-1 .9c.5.7 1.4 1.1 2.5 1.1Z" />
    <path fill="var(--th-bg,#fff)" d="M19.5 11h-2.1v1.4h2.1v4.1h1.6V12.4H23V11h-3.5Z" />
  </svg>
);

const TailwindLogo = () => (
  <svg width="34" height="20" viewBox="0 0 54 32" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M27 0C19.8 0 15.3 3.6 13.5 10.8c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C30.744 12.672 33.808 16 40.5 16c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C36.756 3.328 33.692 0 27 0ZM13.5 16C6.3 16 1.8 19.6 0 26.8c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 28.672 20.308 32 27 32c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C23.256 19.328 20.192 16 13.5 16Z" />
  </svg>
);

const SupabaseLogo = () => (
  <svg width="22" height="28" viewBox="0 0 22 28" fill="currentColor">
    <path d="M12.8 0 .6 15.6a1.25 1.25 0 0 0 .95 2.05H12v10a1.25 1.25 0 0 0 2.25.73L26.4 12.4a1.25 1.25 0 0 0-.95-2.05H15V1.27A1.25 1.25 0 0 0 12.8 0Z" transform="scale(0.84)" />
  </svg>
);

const PrismaLogo = () => (
  <svg width="24" height="28" viewBox="0 0 32 36" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M1.26 27.8 14.84 1.4a1.3 1.3 0 0 1 2.35.17l11.5 31.66a1.3 1.3 0 0 1-1.54 1.7L2.27 29.53a1.3 1.3 0 0 1-1.01-1.73Zm3.57-.25 13.02-23.2 9.7 26.7L4.83 27.55Z" />
  </svg>
);

const ThreejsLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2 26 22H2L14 2Z" />
    <path d="M14 8l7 12H7l7-12Z" opacity="0.5" />
  </svg>
);

const FramerLogo = () => (
  <svg width="20" height="28" viewBox="0 0 20 28" fill="currentColor">
    <path d="M0 0h20v10H10L0 0Zm0 10h10l10 10H0V10Zm0 10h10v8L0 20Z" />
  </svg>
);

const AnthropicLogo = () => (
  <svg width="28" height="20" viewBox="0 0 180 120" fill="currentColor">
    <path d="M99.5 8h22l38.5 104h-22L128 87H82l-10 25H50L99.5 8ZM105 68h16.5L113 42 105 68ZM8 8h22l38.5 104h-22L36 87H-10L-20 112h-22L8 8Zm5.5 60H30L21.5 42 13.5 68Z" transform="translate(28,0)" />
  </svg>
);

const ShadcnLogo = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 3 5 19" />
    <path d="M13 3h8v8" />
    <path d="M5 11v10h10" />
  </svg>
);

// ── Tech stack items ──────────────────────────────────────────────────────────

const TECH_STACK: AutoScrollingCarouselItem[] = [
  { name: "Next.js",       logo: <NextjsLogo /> },
  { name: "React",         logo: <ReactLogo /> },
  { name: "TypeScript",    logo: <TypeScriptLogo /> },
  { name: "Tailwind CSS",  logo: <TailwindLogo /> },
  { name: "Supabase",      logo: <SupabaseLogo /> },
  { name: "Prisma",        logo: <PrismaLogo /> },
  { name: "Three.js",      logo: <ThreejsLogo /> },
  { name: "Framer Motion", logo: <FramerLogo /> },
  { name: "Anthropic AI",  logo: <AnthropicLogo /> },
  { name: "shadcn/ui",     logo: <ShadcnLogo /> },
];

// ── Single ribbon row ─────────────────────────────────────────────────────────

function Ribbon({
  items,
  speed,
  reverse,
}: {
  items: AutoScrollingCarouselItem[];
  speed: number;
  reverse: boolean;
}) {
  const tripled = [...items, ...items, ...items];

  return (
    <div
      className="overflow-hidden py-3"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div
        className="flex w-max items-center"
        style={{
          animation: `asc-ribbon ${speed}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {tripled.map((item, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-2.5 pl-12 sm:pl-14"
            style={{
              filter: "grayscale(1) opacity(0.55)",
              transition:
                "filter 0.35s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "grayscale(0) opacity(1)";
              e.currentTarget.style.transform = "scale(1.06) translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "grayscale(1) opacity(0.55)";
              e.currentTarget.style.transform = "scale(1) translateY(0)";
            }}
          >
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5"
                aria-label={item.name}
              >
                {item.logo && (
                  <span style={{ color: "var(--th-text)", display: "flex", alignItems: "center" }}>
                    {item.logo}
                  </span>
                )}
                <span
                  className="select-none whitespace-nowrap text-base font-semibold tracking-tight"
                  style={{ color: "var(--th-text)" }}
                >
                  {item.name}
                </span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-2.5">
                {item.logo && (
                  <span style={{ color: "var(--th-text)", display: "flex", alignItems: "center" }}>
                    {item.logo}
                  </span>
                )}
                <span
                  className="select-none whitespace-nowrap text-base font-semibold tracking-tight"
                  style={{ color: "var(--th-text)" }}
                >
                  {item.name}
                </span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AutoScrollingClientCarousel({
  title = "Trusted by leading teams",
  clients = TECH_STACK,
  speed = 35,
  className,
}: AutoScrollingClientCarouselProps) {
  const reversed = React.useMemo(() => [...clients].reverse(), [clients]);

  return (
    <section className={cn("py-12", className)}>
      <div className="mx-auto max-w-5xl px-6">
        {title && (
          <div className="flex items-center gap-3 mb-8">
            <div style={{ width: 20, height: 1.5, background: "var(--th-accent)" }} />
            <p
              style={{
                color: "var(--th-text-2)",
                fontSize: "0.6875rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {title}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Ribbon items={clients} speed={speed} reverse={false} />
        <Ribbon items={reversed} speed={speed * 1.15} reverse={true} />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes asc-ribbon {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(-100% / 3)); }
}`,
        }}
      />
    </section>
  );
}
