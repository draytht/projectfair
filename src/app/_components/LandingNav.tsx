import Link from "next/link";

export function LandingNav() {
  return (
    <>
      {/* ── Desktop: plain bar ────────────────────────────────────────────── */}
      <nav
        style={{ borderBottom: "1px solid var(--th-border)" }}
        className="hidden md:flex items-center justify-between px-10 py-4"
      >
        <Link href="/" className="nc-brand" style={{ textDecoration: "none" }}>
          <span className="nc-brand-dot" />
          <span className="nc-brand-text">
            No<span style={{ color: "var(--th-accent)" }}>Carry</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            style={{ color: "var(--th-text-2)" }}
            className="text-sm px-3 py-2.5 rounded-lg hover:opacity-70 transition-opacity min-h-[44px] flex items-center"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            style={{ color: "var(--th-text-2)" }}
            className="text-sm px-3 py-2.5 rounded-lg hover:opacity-70 transition-opacity min-h-[44px] flex items-center"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
            className="text-sm px-4 py-2.5 rounded-lg font-medium hover:opacity-80 active:scale-95 transition-[opacity,transform] min-h-[44px] flex items-center"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Mobile: floating pill navbar ──────────────────────────────────── */}
      <div className="md:hidden flex justify-center w-full pt-5 px-4">
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-full w-full"
          style={{
            background: "color-mix(in srgb, var(--th-card) 90%, transparent)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid color-mix(in srgb, var(--th-border) 70%, transparent)",
            boxShadow: "0 4px 24px color-mix(in srgb, var(--th-text) 6%, transparent)",
            animation: "nc-mobile-overlay-in 0.4s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Brand */}
          <Link href="/" className="nc-brand" style={{ textDecoration: "none" }}>
            <span className="nc-brand-dot" />
            <span className="nc-brand-text">
              No<span style={{ color: "var(--th-accent)" }}>Carry</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-1">
            <Link
              href="/pricing"
              style={{ color: "var(--th-text-2)" }}
              className="text-xs px-2.5 py-1.5 rounded-full hover:opacity-70 transition-opacity flex items-center min-h-[34px]"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              style={{ color: "var(--th-text-2)" }}
              className="text-xs px-2.5 py-1.5 rounded-full hover:opacity-70 transition-opacity flex items-center min-h-[34px]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
              className="text-xs px-3 py-1.5 rounded-full font-semibold hover:opacity-80 active:scale-95 transition-[opacity,transform] flex items-center min-h-[34px]"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
