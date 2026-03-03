import Link from "next/link";

const LAST_UPDATED = "March 2, 2026";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using NoCarry ("the Service"), you agree to be bound by these Terms of Use. If you do not agree, do not use the Service. NoCarry is intended for educational use by students, professors, and academic institutions.`,
  },
  {
    title: "2. Account Security",
    body: `You are responsible for maintaining the confidentiality of your account credentials. You must immediately notify us at security@nocarry.space if you suspect any unauthorized access to your account. NoCarry uses industry-standard authentication provided by Supabase and will never ask for your password via email, chat, or any channel outside the official login form at nocarry.space.

Accounts are personal and non-transferable. Sharing your account credentials with others — including teammates — is strictly prohibited and may result in account suspension.`,
  },
  {
    title: "3. Data You Submit",
    body: `When you use NoCarry, you submit task data, peer reviews, contribution logs, and project information ("User Content"). You retain ownership of your User Content. By submitting it, you grant NoCarry a limited, non-exclusive license to store, display, and process it solely to operate the Service.

You must not submit content that is false, misleading, defamatory, or violates another person's privacy. Fabricating peer reviews or activity logs to manipulate contribution scores is a breach of these terms and may be reported to your academic institution.`,
  },
  {
    title: "4. Academic Integrity",
    body: `NoCarry is a tool designed to support fair academic evaluation. You agree not to use the Service to:

— Misrepresent your contributions to a project
— Submit another person's work as your own
— Manipulate peer review scores through coordinated rating abuse
— Share professor access or contribution reports with unauthorized parties

Violations may result in account termination and, at the discretion of your institution, academic disciplinary action.`,
  },
  {
    title: "5. Prohibited Conduct",
    body: `You may not:

— Attempt to gain unauthorized access to any part of the Service or its underlying infrastructure
— Perform automated scraping, crawling, or bulk extraction of data
— Reverse engineer, decompile, or attempt to extract the source code of the Service
— Upload malicious code, scripts, or payloads of any kind
— Impersonate another user, professor, or NoCarry personnel
— Use the Service for any purpose that violates applicable law`,
  },
  {
    title: "6. Security Practices",
    body: `NoCarry implements the following security measures to protect your data:

— All data is transmitted over HTTPS (TLS 1.2+)
— Authentication tokens are issued and managed by Supabase Auth using industry-standard JWT
— Passwords are hashed using bcrypt and never stored in plaintext
— Database access is restricted to server-side API routes and never exposed client-side
— Role-based access control (RBAC) ensures students cannot access professor-only data and vice versa

Despite these measures, no system is completely immune to security risks. We encourage you to use a strong, unique password and enable any multi-factor authentication options when available.`,
  },
  {
    title: "7. Availability and Changes",
    body: `The Service is provided "as is" without warranty of any kind. We do not guarantee uninterrupted access or error-free operation. We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice where possible.

We may update these Terms of Use from time to time. Continued use of the Service after changes are posted constitutes your acceptance of the revised terms.`,
  },
  {
    title: "8. Termination",
    body: `We may suspend or terminate your account if you breach these terms, engage in fraudulent activity, or use the Service in a way that harms other users or the integrity of the platform. Upon termination, your right to access the Service ceases immediately. Data retention after termination is governed by our Privacy Policy.`,
  },
  {
    title: "9. Limitation of Liability",
    body: `To the maximum extent permitted by law, NoCarry and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including lost grades, academic outcomes, or data loss. Our total liability for any claim shall not exceed the amount you paid for the Service in the preceding 12 months.`,
  },
  {
    title: "10. Contact",
    body: `Questions about these Terms? Reach us at legal@nocarry.space. For security vulnerabilities, please use our responsible disclosure email: security@nocarry.space.`,
  },
];

export default function TermsPage() {
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ color: "var(--th-accent)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Legal</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.025em", marginBottom: 12 }}>
            Terms of Use
          </h1>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem" }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Intro */}
        <div style={{ borderRadius: 12, border: "1px solid var(--th-border)", background: "var(--th-card)",
          padding: "16px 20px", marginBottom: 40 }}>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", lineHeight: 1.7, margin: 0 }}>
            Please read these terms carefully before using NoCarry. They outline your rights and responsibilities when using our platform, and the security commitments we make to protect you.
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
          <Link href="/privacy" style={{ color: "var(--th-accent)", fontSize: "0.8125rem", textDecoration: "none" }}
            className="hover:opacity-70 transition">
            Privacy Policy →
          </Link>
          <a href="mailto:legal@nocarry.space" style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", textDecoration: "none" }}
            className="hover:opacity-70 transition">
            Contact legal
          </a>
        </div>
      </div>
    </main>
  );
}
