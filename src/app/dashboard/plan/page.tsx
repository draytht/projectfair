"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProBadge } from "@/components/ui/pro-badge";

type PlanData = {
  plan: "FREE" | "PRO";
  limits: { courses: number; projects: number };
  usage: { courses: number; projects: number };
  status: string;
  currentPeriodEnd: string | null;
  stripePriceId: string | null;
  cancelAtPeriodEnd: boolean;
};

function UsageBar({ used, limit, accent }: { used: number; limit: number; accent?: boolean }) {
  const pct = Math.min((used / limit) * 100, 100);
  const nearLimit = pct >= 80;
  return (
    <div style={{ width: "100%", height: 6, borderRadius: 99, background: "var(--th-border)", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 99,
          background: nearLimit ? "#ef4444" : accent ? "var(--th-accent)" : "var(--th-accent)",
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active:     { label: "Active",     color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    trialing:   { label: "Trial",      color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    past_due:   { label: "Past due",   color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    canceled:   { label: "Canceled",   color: "var(--th-text-2)", bg: "var(--th-border)" },
    incomplete: { label: "Incomplete", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  };
  const s = map[status] ?? map.active;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, color: s.color, background: s.bg, letterSpacing: "0.04em" }}>
      {s.label}
    </span>
  );
}

type Prices = { monthly: string; annual: string } | null;

export default function PlanPage() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "1";
  const sessionId = searchParams.get("session_id");

  const [data, setData] = useState<PlanData | null>(null);
  const [prices, setPrices] = useState<Prices>(null);
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(upgraded && !!sessionId);
  const [syncFailed, setSyncFailed] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    // Always fetch prices
    fetch("/api/stripe/prices")
      .then((r) => r.ok ? r.json() : null)
      .then((p) => { if (p?.monthly && !cancelled) setPrices(p); })
      .catch(() => {});

    if (upgraded && sessionId) {
      // 1. Fire sync-session once to write PRO into DB (best-effort, don't await)
      fetch("/api/stripe/sync-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});

      // 2. Load current plan immediately so user sees something
      fetch("/api/stripe/plan")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d && !cancelled) { setData(d); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });

      // 3. Poll every 2 seconds until plan === PRO or 30s timeout
      let elapsed = 0;
      poll = setInterval(async () => {
        elapsed += 2000;
        try {
          const res = await fetch("/api/stripe/plan");
          if (res.ok) {
            const d = await res.json();
            if (d.plan === "PRO" && !cancelled) {
              clearInterval(poll!);
              setData(d);
              setSyncing(false);
              window.dispatchEvent(new CustomEvent("nc:plan-upgraded", { detail: "PRO" }));
              return;
            }
          }
        } catch { /* keep polling */ }

        if (elapsed >= 30000 && !cancelled) {
          clearInterval(poll!);
          setSyncing(false);
          setSyncFailed(true);
        }
      }, 2000);
    } else {
      // Normal load
      fetch("/api/stripe/plan")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d && !cancelled) setData(d); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
    }

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function openPortal() {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const d = await res.json();
    if (d.url) window.location.href = d.url;
    else setPortalLoading(false);
  }

  async function startCheckout(priceId: string) {
    setCheckoutError("");
    if (!priceId) {
      setCheckoutError("Price configuration missing. Please restart the dev server.");
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const d = await res.json();
      if (d.url) {
        window.location.href = d.url;
      } else {
        setCheckoutError(d.error ?? "Checkout failed. Please try again.");
        setCheckoutLoading(false);
      }
    } catch {
      setCheckoutError("Network error. Please try again.");
      setCheckoutLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    const res = await fetch("/api/stripe/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reactivate: false }) });
    const d = await res.json();
    if (res.ok) {
      setData((prev) => prev ? { ...prev, cancelAtPeriodEnd: d.cancelAtPeriodEnd, currentPeriodEnd: d.currentPeriodEnd } : prev);
      setCancelConfirm(false);
    }
    setCancelLoading(false);
  }

  async function handleReactivate() {
    setCancelLoading(true);
    const res = await fetch("/api/stripe/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reactivate: true }) });
    const d = await res.json();
    if (res.ok) {
      setData((prev) => prev ? { ...prev, cancelAtPeriodEnd: d.cancelAtPeriodEnd } : prev);
    }
    setCancelLoading(false);
  }

  if (loading) return <p style={{ color: "var(--th-text-2)" }} className="text-sm p-8">Loading…</p>;

  const isPro = data?.plan === "PRO";
  const selectedPriceId = annual ? prices?.annual : prices?.monthly;

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <h2 className="nc-page-title">My Plan</h2>
        {isPro && <ProBadge size="md" />}
      </div>
      <p style={{ color: "var(--th-text-2)", fontSize: 13, marginBottom: 32 }}>
        Manage your subscription and usage.
      </p>

      {upgraded && (
        <div style={{
          background: isPro ? "rgba(34,197,94,0.08)" : syncFailed ? "rgba(239,68,68,0.07)" : "color-mix(in srgb, var(--th-accent) 6%, transparent)",
          border: `1px solid ${isPro ? "rgba(34,197,94,0.25)" : syncFailed ? "rgba(239,68,68,0.25)" : "color-mix(in srgb, var(--th-accent) 25%, transparent)"}`,
          borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10,
        }}>
          {isPro ? (
            <>
              <span style={{ fontSize: 18 }}>🎉</span>
              <p style={{ fontSize: 13, color: "#22c55e", fontWeight: 600, margin: 0 }}>You&apos;re now on Pro! Enjoy your expanded limits.</p>
            </>
          ) : syncing ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--th-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <p style={{ fontSize: 13, color: "var(--th-accent)", fontWeight: 600, margin: 0 }}>Activating your Pro plan…</p>
            </>
          ) : syncFailed ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, margin: 0 }}>
                Couldn&apos;t activate Pro automatically.{" "}
                <button onClick={() => window.location.reload()} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: 0, textDecoration: "underline", fontSize: 13 }}>
                  Refresh
                </button>{" "}
                or contact support if this persists.
              </p>
            </>
          ) : null}
        </div>
      )}

      {/* Plan card */}
      <div style={{ background: "var(--th-card)", border: `1.5px solid ${isPro ? "var(--th-accent)" : "var(--th-border)"}`, borderRadius: 16, padding: "24px", marginBottom: 20, boxShadow: isPro ? "0 4px 24px color-mix(in srgb, var(--th-accent) 10%, transparent)" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: isPro ? "var(--th-accent)" : "var(--th-text)" }}>
                {isPro ? "Pro" : "Free"}
              </span>
              {data && <StatusBadge status={data.status} />}
            </div>
            {isPro && data?.currentPeriodEnd && (
              <p style={{ color: "var(--th-text-2)", fontSize: 11, marginTop: 4 }}>
                Renews {new Date(data.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          {isPro ? (
            <span style={{ fontSize: 22, fontWeight: 800 }}>$7<span style={{ fontSize: 12, fontWeight: 400, color: "var(--th-text-2)" }}>/mo</span></span>
          ) : (
            <span style={{ fontSize: 22, fontWeight: 800 }}>$0</span>
          )}
        </div>

        {/* Usage */}
        {data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--th-text-2)", fontWeight: 500 }}>Courses</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  <span style={{ color: data.usage.courses >= data.limits.courses ? "#ef4444" : "var(--th-text)" }}>{data.usage.courses}</span>
                  <span style={{ color: "var(--th-text-2)" }}> / {data.limits.courses}</span>
                </span>
              </div>
              <UsageBar used={data.usage.courses} limit={data.limits.courses} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--th-text-2)", fontWeight: 500 }}>Projects</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  <span style={{ color: data.usage.projects >= data.limits.projects ? "#ef4444" : "var(--th-text)" }}>{data.usage.projects}</span>
                  <span style={{ color: "var(--th-text-2)" }}> / {data.limits.projects}</span>
                </span>
              </div>
              <UsageBar used={data.usage.projects} limit={data.limits.projects} />
            </div>
          </div>
        )}

        {/* CTA */}
        {isPro ? (
          <button
            onClick={openPortal}
            disabled={portalLoading}
            style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "1px solid var(--th-border)", background: "transparent", color: "var(--th-text)", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: portalLoading ? 0.6 : 1 }}
          >
            {portalLoading ? "Opening portal…" : "Manage subscription"}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Billing toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "8px 0 4px" }}>
              <span style={{ fontSize: 12, color: !annual ? "var(--th-text)" : "var(--th-text-2)", fontWeight: !annual ? 600 : 400 }}>Monthly</span>
              <button
                onClick={() => setAnnual((a) => !a)}
                role="switch"
                aria-checked={annual}
                style={{ width: 36, height: 20, borderRadius: 10, border: "none", background: annual ? "var(--th-accent)" : "var(--th-border)", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}
              >
                <span style={{ position: "absolute", top: 3, left: annual ? 17 : 3, width: 14, height: 14, borderRadius: "50%", background: annual ? "var(--th-accent-fg)" : "var(--th-text-2)", transition: "left 0.2s", display: "block" }} />
              </button>
              <span style={{ fontSize: 12, color: annual ? "var(--th-text)" : "var(--th-text-2)", fontWeight: annual ? 600 : 400 }}>
                Annual
                <span style={{ marginLeft: 5, background: "color-mix(in srgb, var(--th-accent) 15%, transparent)", color: "var(--th-accent)", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.05em" }}>30% off</span>
              </span>
            </div>
            <button
              onClick={() => startCheckout(selectedPriceId ?? "")}
              disabled={checkoutLoading || !prices}
              style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: "var(--th-accent)", color: "var(--th-accent-fg)", fontSize: 13, fontWeight: 700, cursor: (checkoutLoading || !prices) ? "not-allowed" : "pointer", opacity: (checkoutLoading || !prices) ? 0.6 : 1 }}
            >
              {checkoutLoading ? "Redirecting…" : !prices ? "Loading…" : annual ? "Upgrade to Pro — $59/yr" : "Upgrade to Pro — $7/mo"}
            </button>
            {checkoutError && (
              <p style={{ fontSize: 12, color: "#ef4444", textAlign: "center", margin: 0, lineHeight: 1.4 }}>{checkoutError}</p>
            )}
            <Link
              href="/pricing"
              style={{ display: "block", textAlign: "center", fontSize: 12, color: "var(--th-text-2)", textDecoration: "none" }}
            >
              See all plans →
            </Link>
          </div>
        )}
      </div>

      {/* What's included */}
      <div style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 14, padding: "18px 20px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--th-text-2)", marginBottom: 14 }}>
          {isPro ? "Pro includes" : "Free includes"}
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            `Up to ${data?.limits.courses ?? 1} course${(data?.limits.courses ?? 1) > 1 ? "s" : ""}`,
            `Up to ${data?.limits.projects ?? 1} project${(data?.limits.projects ?? 1) > 1 ? "s" : ""}`,
            "Kanban board, peer reviews, contributions",
            "Project chat & file uploads",
            "AI report generator",
            ...(isPro ? ["Priority support"] : []),
          ].map((feat, i) => (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--th-text-2)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7L5.5 10.5L12 4" stroke="var(--th-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {feat}
            </li>
          ))}
        </ul>
      </div>

      {/* Cancel subscription — Pro only */}
      {isPro && (
        <div style={{ marginTop: 12, background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 14, padding: "18px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--th-text-2)", marginBottom: 12 }}>
            Subscription
          </p>

          {data?.cancelAtPeriodEnd ? (
            /* Already scheduled to cancel */
            <div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14, padding: "12px 14px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize: 12, color: "#f59e0b", margin: 0, lineHeight: 1.5 }}>
                  Your Pro access ends on <strong>{data.currentPeriodEnd ? new Date(data.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "the end of this billing period"}</strong>. After that you&apos;ll be moved to the Free plan.
                </p>
              </div>
              <button
                onClick={handleReactivate}
                disabled={cancelLoading}
                style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1.5px solid var(--th-accent)", background: "transparent", color: "var(--th-accent)", fontSize: 13, fontWeight: 600, cursor: cancelLoading ? "not-allowed" : "pointer", opacity: cancelLoading ? 0.6 : 1, transition: "background 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "color-mix(in srgb, var(--th-accent) 8%, transparent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {cancelLoading ? "Reactivating…" : "Reactivate Pro"}
              </button>
            </div>
          ) : cancelConfirm ? (
            /* Confirm step */
            <div>
              <p style={{ fontSize: 13, color: "var(--th-text-2)", marginBottom: 14, lineHeight: 1.5 }}>
                You&apos;ll keep Pro access until <strong style={{ color: "var(--th-text)" }}>{data?.currentPeriodEnd ? new Date(data.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "end of billing period"}</strong>. After that your plan downgrades to Free.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setCancelConfirm(false)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid var(--th-border)", background: "transparent", color: "var(--th-text-2)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Keep Pro
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: cancelLoading ? "not-allowed" : "pointer", opacity: cancelLoading ? 0.6 : 1 }}
                >
                  {cancelLoading ? "Canceling…" : "Yes, cancel"}
                </button>
              </div>
            </div>
          ) : (
            /* Default state */
            <div>
              <p style={{ fontSize: 12, color: "var(--th-text-2)", marginBottom: 12, lineHeight: 1.5 }}>
                Canceling keeps your Pro access until the end of your current billing period, then downgrades to Free.
              </p>
              <button
                onClick={() => setCancelConfirm(true)}
                style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "none", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.14s, border-color 0.14s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.07)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
              >
                Cancel subscription
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
