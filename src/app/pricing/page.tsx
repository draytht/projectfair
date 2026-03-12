"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type AuthState = { loading: true } | { loading: false; userId: string | null; plan: "FREE" | "PRO" | null };
type Prices = { monthly: string; annual: string } | null;

const FEATURES = [
  { label: "Courses",               free: "2",          pro: "10" },
  { label: "Projects",              free: "2",          pro: "20" },
  { label: "Kanban task board",     free: true,         pro: true },
  { label: "Peer review system",    free: true,         pro: true },
  { label: "Contribution scoring",  free: true,         pro: true },
  { label: "Project chat",          free: true,         pro: true },
  { label: "File uploads",          free: true,         pro: true },
  { label: "AI report generator",   free: true,         pro: true },
  { label: "Professor monitor view",free: true,         pro: true },
  { label: "Priority support",      free: false,        pro: true },
];

const FAQ = [
  {
    q: "What happens when I hit the Free limit?",
    a: "You'll see a clear error when trying to create a new course or project. Existing ones remain fully functional — nothing is deleted.",
  },
  {
    q: "What happens if I downgrade or cancel?",
    a: "You keep Pro access until the end of your billing period. After that, you're back on Free (2 courses, 2 projects). Your existing courses and projects are preserved — you just can't create new ones beyond the Free limits.",
  },
  {
    q: "Can professors use Pro?",
    a: "Absolutely. Pro is designed for professors managing multiple courses and students managing multiple projects simultaneously.",
  },
  {
    q: "Is there a student discount?",
    a: "The annual plan at $59/year is already priced with students in mind — it's less than $5/month. If you need further help, reach out via the support tab in Settings.",
  },
  {
    q: "Can I switch between monthly and annual?",
    a: "Yes. Open the billing portal (Manage Subscription) and switch plans at any time. Proration is handled automatically by Stripe.",
  },
];

function Check({ color = "var(--th-accent)" }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2.5 7.5L6 11L12.5 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M3 3L10 10M10 3L3 10" stroke="var(--th-text-2)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ loading: true });
  const [prices, setPrices] = useState<Prices>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.ok ? r.json() : null),
      fetch("/api/stripe/prices").then((r) => r.ok ? r.json() : null),
    ]).then(async ([me, p]) => {
      if (p?.monthly) setPrices(p);
      if (!me?.id) { setAuth({ loading: false, userId: null, plan: null }); return; }
      const sub = await fetch("/api/stripe/plan").then((r) => r.ok ? r.json() : null);
      setAuth({ loading: false, userId: me.id, plan: sub?.plan ?? "FREE" });
    }).catch(() => setAuth({ loading: false, userId: null, plan: null }));
  }, []);

  async function startCheckout(priceId: string) {
    setCheckoutError("");
    if (!priceId) {
      setCheckoutError("Stripe is not configured yet. Contact support.");
      return;
    }
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error ?? "Checkout failed. Please try again.");
        setLoadingCheckout(false);
      }
    } catch {
      setCheckoutError("Network error. Please try again.");
      setLoadingCheckout(false);
    }
  }

  async function openPortal() {
    setLoadingPortal(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoadingPortal(false);
  }

  const isPro = !auth.loading && auth.plan === "PRO";
  const isLoggedIn = !auth.loading && !!auth.userId;

  function renderProCTA() {
    if (auth.loading) {
      return <div style={{ height: 44, borderRadius: 10, background: "var(--th-border)", opacity: 0.5 }} />;
    }
    if (!isLoggedIn) {
      return (
        <Link
          href="/login"
          style={{ display: "block", textAlign: "center", background: "var(--th-accent)", color: "var(--th-accent-fg)", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 14, textDecoration: "none" }}
        >
          Sign in to upgrade
        </Link>
      );
    }
    if (isPro) {
      return (
        <button
          onClick={openPortal}
          disabled={loadingPortal}
          style={{ width: "100%", background: "var(--th-border)", color: "var(--th-text)", border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: loadingPortal ? 0.6 : 1 }}
        >
          {loadingPortal ? "Opening…" : "Manage subscription"}
        </button>
      );
    }
    const priceId = annual ? prices?.annual : prices?.monthly;
    return (
      <>
        <button
          onClick={() => startCheckout(priceId ?? "")}
          disabled={loadingCheckout || !prices}
          style={{ width: "100%", background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: (loadingCheckout || !prices) ? "not-allowed" : "pointer", opacity: (loadingCheckout || !prices) ? 0.6 : 1 }}
        >
          {loadingCheckout ? "Redirecting…" : !prices ? "Loading…" : `Upgrade to Pro — ${annual ? "$59/yr" : "$7/mo"}`}
        </button>
        {checkoutError && (
          <p style={{ fontSize: 12, color: "#ef4444", textAlign: "center", marginTop: 6, lineHeight: 1.4 }}>{checkoutError}</p>
        )}
      </>
    );
  }

  return (
    <div style={{ background: "var(--th-bg)", color: "var(--th-text)", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--th-border)" }} className="flex items-center justify-between px-6 md:px-10 py-4">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="nc-brand">
          <span className="nc-brand-dot" />
          <span className="nc-brand-text">No<span style={{ color: "var(--th-accent)" }}>Carry</span></span>
        </Link>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link href="/dashboard" style={{ color: "var(--th-text-2)" }} className="text-sm px-3 py-2.5 rounded-lg hover:opacity-70 transition min-h-[44px] flex items-center">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" style={{ color: "var(--th-text-2)" }} className="text-sm px-3 py-2.5 rounded-lg hover:opacity-70 transition min-h-[44px] flex items-center">Log in</Link>
              <Link href="/signup" style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }} className="text-sm px-4 py-2.5 rounded-lg font-medium hover:opacity-80 transition min-h-[44px] flex items-center">Get started</Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ color: "var(--th-accent)", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Pricing</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
            Simple, student-friendly pricing
          </h1>
          <p style={{ color: "var(--th-text-2)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
            Start free. Upgrade when your team grows.
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 40 }}>
          <span style={{ fontSize: 13, color: !annual ? "var(--th-text)" : "var(--th-text-2)", fontWeight: !annual ? 600 : 400 }}>Monthly</span>
          <button
            onClick={() => setAnnual((a) => !a)}
            role="switch"
            aria-checked={annual}
            style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: annual ? "var(--th-accent)" : "var(--th-border)", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}
          >
            <span style={{ position: "absolute", top: 4, left: annual ? 22 : 4, width: 16, height: 16, borderRadius: "50%", background: annual ? "var(--th-accent-fg)" : "var(--th-text-2)", transition: "left 0.2s", display: "block" }} />
          </button>
          <span style={{ fontSize: 13, color: annual ? "var(--th-text)" : "var(--th-text-2)", fontWeight: annual ? 600 : 400 }}>
            Annual
            <span style={{ marginLeft: 6, background: "color-mix(in srgb, var(--th-accent) 15%, transparent)", color: "var(--th-accent)", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.05em" }}>30% off</span>
          </span>
        </div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 64 }}>
          {/* Free */}
          <div style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 18, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--th-text-2)", marginBottom: 8 }}>Free</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800 }}>$0</span>
                <span style={{ color: "var(--th-text-2)", fontSize: 13 }}>/month</span>
              </div>
              <p style={{ color: "var(--th-text-2)", fontSize: 12, marginTop: 6 }}>Forever free. No credit card needed.</p>
            </div>
            {isLoggedIn && !isPro ? (
              <div style={{ background: "var(--th-border)", borderRadius: 10, padding: "11px 0", textAlign: "center", fontSize: 14, fontWeight: 600, color: "var(--th-text-2)" }}>
                Current plan
              </div>
            ) : (
              <Link href={isLoggedIn ? "/dashboard" : "/signup"} style={{ display: "block", textAlign: "center", border: "1px solid var(--th-border)", color: "var(--th-text-2)", borderRadius: 10, padding: "11px 0", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                {isLoggedIn ? "Go to dashboard" : "Get started free"}
              </Link>
            )}
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--th-text-2)" }}><Check />2 courses</li>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--th-text-2)" }}><Check />2 projects</li>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--th-text-2)" }}><Check />All core features</li>
            </ul>
          </div>

          {/* Pro */}
          <div style={{ background: "var(--th-card)", border: `2px solid var(--th-accent)`, borderRadius: 18, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20, position: "relative", boxShadow: "0 8px 32px color-mix(in srgb, var(--th-accent) 12%, transparent)" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--th-accent)", color: "var(--th-accent-fg)", fontSize: 10, fontWeight: 700, padding: "4px 14px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
              Most popular
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--th-accent)", marginBottom: 8 }}>Pro</p>
              {annual ? (
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 800 }}>$4.92</span>
                    <span style={{ color: "var(--th-text-2)", fontSize: 13 }}>/month</span>
                  </div>
                  <p style={{ color: "var(--th-text-2)", fontSize: 12, marginTop: 4 }}>Billed $59/year · save $25</p>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 800 }}>$7</span>
                    <span style={{ color: "var(--th-text-2)", fontSize: 13 }}>/month</span>
                  </div>
                  <p style={{ color: "var(--th-text-2)", fontSize: 12, marginTop: 4 }}>Or $59/year and save 30%</p>
                </div>
              )}
            </div>
            {renderProCTA()}
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}><Check />Up to 10 courses</li>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}><Check />Up to 20 projects</li>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}><Check />All core features</li>
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}><Check />Priority support</li>
            </ul>
          </div>
        </div>

        {/* Feature comparison table */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, textAlign: "center" }}>Full feature comparison</h2>
          <div style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", padding: "10px 20px", borderBottom: "1px solid var(--th-border)", background: "var(--th-bg)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--th-text-2)" }}>Feature</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--th-text-2)", textAlign: "center" }}>Free</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--th-accent)", textAlign: "center" }}>Pro</span>
            </div>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", padding: "13px 20px", borderBottom: i < FEATURES.length - 1 ? "1px solid var(--th-border)" : "none", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--th-text-2)" }}>{f.label}</span>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {typeof f.free === "string" ? (
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{f.free}</span>
                  ) : f.free ? <Check color="var(--th-text-2)" /> : <Cross />}
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {typeof f.pro === "string" ? (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--th-accent)" }}>{f.pro}</span>
                  ) : f.pro ? <Check /> : <Cross />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, textAlign: "center" }}>Frequently asked questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 12, overflow: "hidden" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--th-text)" }}>{item.q}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, transition: "transform 0.2s", transform: openFaq === i ? "rotate(180deg)" : "none" }}>
                    <path d="M2 5L7 10L12 5" stroke="var(--th-text-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 16px", fontSize: 13, color: "var(--th-text-2)", lineHeight: 1.6 }}>{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
