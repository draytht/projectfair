"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Project = { id: string; name: string; courseCode: string | null };

function initials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0][0] ?? "?").toUpperCase();
}

function greeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return { time, text: `Good ${time}, ${name.split(" ")[0]}` };
}

const QUICK_NAV: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
  STUDENT: [
    { label: "Dashboard", href: "/dashboard", icon: <IconDash /> },
    { label: "My Projects", href: "/dashboard/projects", icon: <IconFolder /> },
    { label: "Profile", href: "/dashboard/profile", icon: <IconUser /> },
  ],
  PROFESSOR: [
    { label: "Dashboard", href: "/dashboard", icon: <IconDash /> },
    { label: "My Courses", href: "/dashboard/courses", icon: <IconBook /> },
    { label: "Profile", href: "/dashboard/profile", icon: <IconUser /> },
  ],
  TEAM_LEADER: [
    { label: "Dashboard", href: "/dashboard", icon: <IconDash /> },
    { label: "My Projects", href: "/dashboard/projects", icon: <IconFolder /> },
    { label: "Profile", href: "/dashboard/profile", icon: <IconUser /> },
  ],
};

export function HomePanel({
  name,
  avatarUrl,
  role,
  onClose,
}: {
  name: string;
  avatarUrl: string | null;
  role: string;
  onClose: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const { time, text } = greeting(name);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProjects(data.slice(0, 4)); });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const navItems = QUICK_NAV[role] ?? QUICK_NAV.STUDENT;

  const timeEmoji = time === "morning" ? "☀️" : time === "afternoon" ? "🌤️" : "🌙";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.42)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="nc-member-card w-full"
        style={{
          maxWidth: 360,
          borderRadius: 22,
          overflow: "hidden",
          background: "color-mix(in srgb, var(--th-card) 78%, transparent)",
          border: "1px solid color-mix(in srgb, var(--th-border) 55%, transparent)",
          backdropFilter: "blur(28px) saturate(200%)",
          boxShadow: "0 12px 48px rgba(0,0,0,0.3), 0 1px 0 color-mix(in srgb, var(--th-accent) 10%, transparent) inset",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent strip */}
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--th-accent), color-mix(in srgb, var(--th-accent) 30%, transparent))" }} />

        <div style={{ padding: "28px 24px 24px" }}>
          {/* Avatar + greeting */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--th-accent)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 0 0 3px color-mix(in srgb, var(--th-accent) 22%, transparent), 0 0 0 6px color-mix(in srgb, var(--th-accent) 8%, transparent)",
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "var(--th-accent-fg)", fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
                  {initials(name)}
                </span>
              )}
            </div>
            <div className="text-center">
              <p style={{ color: "var(--th-text)" }} className="text-base font-bold leading-tight">
                {text} {timeEmoji}
              </p>
              <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1 capitalize">
                {role.toLowerCase().replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Quick nav */}
          <div className="flex gap-2 mb-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 4px",
                  borderRadius: 12,
                  background: "color-mix(in srgb, var(--th-accent) 8%, var(--th-bg))",
                  border: "1px solid color-mix(in srgb, var(--th-border) 70%, transparent)",
                  color: "var(--th-text)",
                  textDecoration: "none",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "color-mix(in srgb, var(--th-accent) 16%, var(--th-bg))";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "color-mix(in srgb, var(--th-accent) 40%, transparent)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--th-accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "color-mix(in srgb, var(--th-accent) 8%, var(--th-bg))";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "color-mix(in srgb, var(--th-border) 70%, transparent)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--th-text)";
                }}
              >
                <span style={{ color: "var(--th-accent)", opacity: 0.85 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Recent projects */}
          {projects.length > 0 && (
            <div>
              <p
                style={{ color: "var(--th-text-2)", marginBottom: 8 }}
                className="text-xs uppercase tracking-widest"
              >
                Recent Projects
              </p>
              <div className="space-y-1">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/projects/${p.id}`}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid color-mix(in srgb, var(--th-border) 60%, transparent)",
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "color-mix(in srgb, var(--th-accent) 8%, transparent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--th-accent)",
                          flexShrink: 0,
                          opacity: 0.7,
                        }}
                      />
                      <span style={{ color: "var(--th-text)" }} className="text-xs font-medium truncate">
                        {p.name}
                      </span>
                      {p.courseCode && (
                        <span style={{ color: "var(--th-text-2)" }} className="text-xs shrink-0">
                          · {p.courseCode}
                        </span>
                      )}
                    </div>
                    <span style={{ color: "var(--th-accent)", opacity: 0.6, fontSize: 12 }}>›</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Dismiss hint */}
          <p
            style={{ color: "var(--th-text-2)", opacity: 0.45 }}
            className="text-xs text-center mt-5"
          >
            Click anywhere or press Esc to close
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconDash() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="currentColor">
      <rect x="1"   y="1"   width="5.5" height="5.5" rx="1.2" />
      <rect x="8.5" y="1"   width="5.5" height="5.5" rx="1.2" />
      <rect x="1"   y="8.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4.5A1.5 1.5 0 0 1 2.5 3H5l1.5 1.5H12.5A1.5 1.5 0 0 1 14 6v5.5A1.5 1.5 0 0 1 12.5 13h-10A1.5 1.5 0 0 1 1 11.5z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="4.5" r="2.5" />
      <path d="M2 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 4C6 2.5 2 2.5 1 3v8.5c1-.5 5-.5 6.5 1 1.5-1.5 5.5-1.5 6.5-1V3c-1-.5-5-.5-6.5 1z" />
      <line x1="7.5" y1="4" x2="7.5" y2="12.5" />
    </svg>
  );
}
