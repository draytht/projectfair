import Link from "next/link";

const LAST_UPDATED = "March 2, 2026";

const sections = [
  {
    title: "1. What We Collect",
    body: `When you create an account, we collect your name, email address, and role (student or professor). You may optionally add a bio, school, major, GitHub URL, and LinkedIn URL to your profile.

When you use the platform, we automatically collect usage data such as tasks you create and complete, peer reviews you submit, and activity logs associated with your projects. We also store technical data like your IP address and browser type for security and diagnostic purposes.

We do not collect payment information. NoCarry is currently free to use.`,
  },
  {
    title: "2. How We Use Your Data",
    body: `We use your data to:

— Operate and improve the Service (power the kanban board, peer reviews, contribution scoring)
— Generate AI contribution analysis reports for professors (using anonymised activity data)
— Send transactional emails (project invitations, account verification)
— Detect abuse, fraud, and security threats
— Comply with legal obligations

We do not sell, rent, or share your personal data with third parties for advertising purposes.`,
  },
  {
    title: "3. Data Sharing",
    body: `Within a project, your name and contribution data are visible to:

— Your teammates (contribution scores, task activity)
— The professor(s) assigned to your project (full contribution reports, peer review summaries)

We work with the following trusted sub-processors to operate the Service:

— Supabase (authentication and database hosting) — EU and US regions
— Anthropic (AI report generation — only anonymised project-level data is sent, never personal identifiers)
— Vercel (hosting and serverless compute)

All sub-processors are contractually obligated to process data only as instructed and in compliance with applicable privacy law.`,
  },
  {
    title: "4. Data Security",
    body: `We take the security of your data seriously:

— All data is encrypted in transit using TLS 1.2 or higher
— Data at rest is encrypted using AES-256 by our database provider
— Authentication is handled by Supabase Auth with JWT-based session tokens
— Database credentials are never exposed client-side — all queries run server-side through our API
— Access to production systems is restricted to authorised personnel only

Despite these precautions, no internet transmission is 100% secure. If you discover a security vulnerability, please disclose it responsibly to security@nocarry.space.`,
  },
  {
    title: "5. Cookies and Local Storage",
    body: `NoCarry uses browser local storage (not cookies) to remember your UI preferences such as your selected theme and sound settings. These are stored locally on your device and are never transmitted to our servers.

Session authentication tokens are managed by Supabase and stored in a secure, httpOnly cookie with SameSite protections to prevent CSRF attacks.`,
  },
  {
    title: "6. Data Retention",
    body: `Your account data is retained for as long as your account is active. If you delete your account, your personal profile data is deleted within 30 days. Project data (tasks, logs, reviews) may be retained in anonymised form to preserve the integrity of academic records for other project participants.

Bug reports and feedback you submit are retained indefinitely to help improve the Service. You may request deletion by emailing privacy@nocarry.space.`,
  },
  {
    title: "7. Your Rights",
    body: `Depending on your location, you may have the right to:

— Access the personal data we hold about you
— Request correction of inaccurate data
— Request deletion of your account and personal data
— Object to certain types of processing
— Export your data in a portable format

To exercise any of these rights, contact us at privacy@nocarry.space. We will respond within 30 days.`,
  },
  {
    title: "8. Children's Privacy",
    body: `NoCarry is intended for users who are 13 years of age or older. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such data, contact us at privacy@nocarry.space and we will promptly delete it.`,
  },
  {
    title: "9. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of material changes by posting a notice on the platform or emailing you. Continued use after changes are posted constitutes acceptance of the updated policy.`,
  },
  {
    title: "10. Contact",
    body: `Privacy questions and requests: privacy@nocarry.space
Security disclosures: security@nocarry.space
General inquiries: hello@nocarry.space`,
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--th-bg)", color: "var(--th-text)" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--th-border)" }}
        className="flex items-center justify-between px-6 md:px-10 py-4 max-w-5xl mx-auto">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--th-accent)", boxShadow: "0 0 6px var(--th-accent)", display: "inline-block" }} />
          <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--th-text)" }}>
            No<span style={{ color: "var(--th-accent)" }}>Carry</span>
          </span>
        </Link>
        <Link href="/" style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", textDecoration: "none" }}
          className="hover:opacity-70 transition">
          ← Back
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 md:px-10 py-16">
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--th-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style={{ color: "var(--th-accent)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Legal</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.025em", marginBottom: 12 }}>
            Privacy Policy
          </h1>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem" }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Intro */}
        <div style={{ borderRadius: 12, border: "1px solid var(--th-border)", background: "var(--th-card)",
          padding: "16px 20px", marginBottom: 40 }}>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", lineHeight: 1.7, margin: 0 }}>
            Your privacy matters to us. This policy explains what data we collect, how we use it, and the choices you have. We aim to be transparent and direct — no legal jargon where plain language will do.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {sections.map((s) => (
            <div key={s.title}>
              <h2 style={{ color: "var(--th-text)", fontWeight: 700, fontSize: "0.9375rem", marginBottom: 10 }}>
                {s.title}
              </h2>
              {s.body.split("\n\n").map((para, i) => (
                <p key={i} style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", lineHeight: 1.75, marginBottom: 10, whiteSpace: "pre-line" }}>
                  {para}
                </p>
              ))}
              <div style={{ borderBottom: "1px solid var(--th-border)", marginTop: 12 }} />
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div style={{ marginTop: 48, display: "flex", gap: 20 }}>
          <Link href="/terms" style={{ color: "var(--th-accent)", fontSize: "0.8125rem", textDecoration: "none" }}
            className="hover:opacity-70 transition">
            Terms of Use →
          </Link>
          <a href="mailto:privacy@nocarry.space" style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", textDecoration: "none" }}
            className="hover:opacity-70 transition">
            Contact privacy team
          </a>
        </div>
      </div>
    </main>
  );
}
