import Link from "next/link";

const UPCOMING = [
  {
    tag: "AI",
    title: "AI Contribution Analysis Reports",
    description:
      "Professors will receive an automatically generated, AI-written report for each team — summarising contribution data, flagging anomalies, and providing grading suggestions backed by real activity logs.",
  },
  {
    tag: "Dashboard",
    title: "Professor Analytics Dashboard",
    description:
      "A unified view across all teams in a course — live contribution scores, task completion rates, peer review heatmaps, and one-click export to CSV or PDF.",
  },
  {
    tag: "Board",
    title: "Real-Time Kanban Board",
    description:
      "Collaborative task board with live updates across all team members. Drag tasks between columns, assign owners, set due dates, and see every move logged automatically.",
  },
  {
    tag: "Reviews",
    title: "Anonymous Peer Review System",
    description:
      "Rate teammates on quality, communication, timeliness, and initiative. Statistical outlier detection flags inflated or suspiciously low scores to ensure fairness.",
  },
  {
    tag: "Detection",
    title: "Freeloader Detection Engine",
    description:
      "Members with low task activity, last-minute contributions, or mismatched peer ratings are surfaced with a confidence score and supporting evidence — no guessing required.",
  },
  {
    tag: "Integrations",
    title: "GitHub & LMS Integrations",
    description:
      "Link your GitHub repository and pull commit activity directly into contribution scores. Canvas and Blackboard integrations will allow grade passback without leaving NoCarry.",
  },
];

export default function ChangelogPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--th-bg)", color: "var(--th-text)" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--th-border)" }}
        className="flex items-center justify-between px-6 md:px-10 py-4 max-w-5xl mx-auto">
        <Link href="/" className="nc-brand" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--th-accent)", boxShadow: "0 0 6px var(--th-accent)", display: "inline-block" }} />
          <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--th-text)" }}>
            No<span style={{ color: "var(--th-accent)" }}>Carry</span>
          </span>
        </Link>
        <Link href="/dashboard" style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", textDecoration: "none" }}
          className="hover:opacity-70 transition">
          ← Back to dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-16">
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20,
            padding: "5px 12px", borderRadius: 999,
            background: "color-mix(in srgb, var(--th-accent) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--th-accent) 25%, transparent)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--th-accent)",
              display: "inline-block", boxShadow: "0 0 6px var(--th-accent)" }} />
            <span style={{ color: "var(--th-accent)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              What's new
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(1.75rem, 5vw, 2.5rem)", fontWeight: 800, lineHeight: 1.1,
            letterSpacing: "-0.03em", marginBottom: 16 }}>
            Big things are coming.
          </h1>
          <p style={{ color: "var(--th-text-2)", fontSize: "1rem", lineHeight: 1.75, maxWidth: 520 }}>
            NoCarry is actively being built. Below is a preview of features currently in development.
            Follow along — the first release is close.
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div style={{ borderRadius: 14, border: "1px solid color-mix(in srgb, var(--th-accent) 30%, var(--th-border))",
          background: "color-mix(in srgb, var(--th-accent) 6%, var(--th-card))",
          padding: "18px 22px", marginBottom: 48, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "color-mix(in srgb, var(--th-accent) 15%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--th-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
            </svg>
          </div>
          <div>
            <p style={{ color: "var(--th-text)", fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>Early Access Launch</p>
            <p style={{ color: "var(--th-text-2)", fontSize: "0.75rem", margin: "3px 0 0" }}>
              Features are being rolled out progressively. Sign up to get notified when each one ships.
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {UPCOMING.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 20, paddingTop: i === 0 ? 0 : 28, paddingBottom: 28,
              borderBottom: "1px solid var(--th-border)" }}>
              {/* Timeline dot */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 2 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%",
                  border: "2px solid var(--th-accent)",
                  background: "color-mix(in srgb, var(--th-accent) 20%, var(--th-bg))" }} />
                {i < UPCOMING.length - 1 && (
                  <div style={{ width: 1, flex: 1, marginTop: 6,
                    background: "linear-gradient(to bottom, var(--th-border), transparent)" }} />
                )}
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.625rem", fontWeight: 700,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    background: "color-mix(in srgb, var(--th-accent) 12%, transparent)",
                    color: "var(--th-accent)", border: "1px solid color-mix(in srgb, var(--th-accent) 25%, transparent)" }}>
                    {item.tag}
                  </span>
                  <span style={{ color: "var(--th-text-2)", fontSize: "0.6875rem",
                    background: "var(--th-border)", padding: "1px 7px", borderRadius: 999 }}>
                    Coming soon
                  </span>
                </div>
                <h3 style={{ color: "var(--th-text)", fontWeight: 700, fontSize: "1rem", marginBottom: 8, lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", lineHeight: 1.7, margin: 0 }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 56, textAlign: "center" }}>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.875rem", marginBottom: 20 }}>
            Want to try NoCarry when it launches?
          </p>
          <Link href="/signup"
            style={{ display: "inline-block", background: "var(--th-accent)", color: "var(--th-accent-fg)",
              padding: "12px 28px", borderRadius: 10, fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}
            className="hover:opacity-85 transition">
            Sign up for early access →
          </Link>
        </div>
      </div>
    </main>
  );
}
