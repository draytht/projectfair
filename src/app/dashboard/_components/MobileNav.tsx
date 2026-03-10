"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomePanel } from "./HomePanel";
import { SettingsModal } from "./SettingsModal";

interface MobileNavProps {
  name: string;
  avatarUrl: string | null;
  role: string;
  isPro?: boolean;
}

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    exact: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    label: "Courses",
    href: "/dashboard/courses",
    exact: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 15.5V4.5A1.5 1.5 0 015.5 3H16v13H5.5A1.5 1.5 0 014 15.5z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 15.5A1.5 1.5 0 005.5 17H16v-1" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 7h6M7 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    exact: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M2 7C2 5.9 2.9 5 4 5h3.5l2 2H16c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V7z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    ),
  },
  {
    label: "Plan",
    href: "/dashboard/plan",
    exact: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2L12.2 7H17.5L13.2 10.1L14.9 15.5L10 12.5L5.1 15.5L6.8 10.1L2.5 7H7.8L10 2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    exact: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function MobileNav({ name, avatarUrl, role, isPro }: MobileNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [homePanelOpen, setHomePanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => { closeMenu(); }, [pathname, closeMenu]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menuOpen, closeMenu]);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const firstName = name.split(" ")[0];
  const initial = firstName[0]?.toUpperCase() ?? "?";

  return (
    <>
      {/* ── Fixed Navbar ─────────────────────────────────────────────────── */}
      <header
        className="md:hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9990,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: menuOpen
            ? "transparent"
            : "color-mix(in srgb, var(--th-card) 82%, transparent)",
          backdropFilter: menuOpen ? "none" : "blur(24px) saturate(180%)",
          WebkitBackdropFilter: menuOpen ? "none" : "blur(24px) saturate(180%)",
          borderBottom: menuOpen
            ? "1px solid transparent"
            : "1px solid color-mix(in srgb, var(--th-border) 55%, transparent)",
          transition: "background 0.35s ease, border-color 0.3s ease",
        }}
      >
        {/* Brand — taps to open HomePanel */}
        <button
          onClick={() => setHomePanelOpen(true)}
          aria-label="Open home panel"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: menuOpen ? 0 : 1,
            transform: menuOpen ? "translateX(-6px)" : "translateX(0)",
            transition: "opacity 0.22s ease, transform 0.22s ease",
            pointerEvents: menuOpen ? "none" : "auto",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: "var(--th-accent)",
              display: "block",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-sora), sans-serif",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-0.03em",
              color: "var(--th-text)",
            }}
          >
            No<span style={{ color: "var(--th-accent)" }}>Carry</span>
          </span>
        </button>

        {/* Animated hamburger / × */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            color: "var(--th-text)",
            padding: 0,
          }}
        >
          <HamburgerIcon open={menuOpen} />
        </button>
      </header>

      {/* ── Full-screen Overlay ───────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9980,
            background: "color-mix(in srgb, var(--th-bg) 94%, transparent)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            display: "flex",
            flexDirection: "column",
            padding: "64px 28px 36px",
            animation: "nc-mobile-overlay-in 0.3s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Nav items — vertically centered */}
          <nav
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 2,
            }}
          >
            {NAV_ITEMS.map(({ label, href, icon, exact }, i) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 18px",
                    borderRadius: 14,
                    color: active ? "var(--th-accent)" : "var(--th-text)",
                    background: active
                      ? "color-mix(in srgb, var(--th-accent) 9%, transparent)"
                      : "transparent",
                    textDecoration: "none",
                    fontFamily: "var(--font-sora), sans-serif",
                    fontWeight: active ? 600 : 400,
                    fontSize: 22,
                    letterSpacing: "-0.03em",
                    transition: "background 0.15s, color 0.15s",
                    animation: `nc-mobile-item-in 0.45s cubic-bezier(0.16,1,0.3,1) ${0.07 + i * 0.055}s both`,
                  }}
                >
                  <span
                    style={{
                      opacity: active ? 1 : 0.4,
                      color: active ? "var(--th-accent)" : "currentColor",
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </span>
                  {label}
                  {label === "Plan" && isPro && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        padding: "2px 7px",
                        borderRadius: 999,
                        background: "var(--th-accent)",
                        color: "var(--th-accent-fg)",
                      }}
                    >
                      PRO
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: settings + user card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              animation:
                "nc-mobile-item-in 0.45s cubic-bezier(0.16,1,0.3,1) 0.42s both",
            }}
          >
            <div
              style={{
                height: 1,
                background: "var(--th-border)",
                opacity: 0.35,
                margin: "2px 0 6px",
              }}
            />

            {/* Settings */}
            <button
              onClick={() => {
                closeMenu();
                setTimeout(() => setSettingsOpen(true), 220);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "12px 18px",
                borderRadius: 14,
                background: "none",
                border: "none",
                color: "var(--th-text-2)",
                fontFamily: "var(--font-sora), sans-serif",
                fontWeight: 400,
                fontSize: 17,
                letterSpacing: "-0.02em",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
            >
              <SettingsIcon />
              Settings
            </button>

            {/* User card + logout */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderRadius: 16,
                background:
                  "color-mix(in srgb, var(--th-card) 65%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--th-border) 55%, transparent)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={name}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background:
                        "color-mix(in srgb, var(--th-accent) 14%, transparent)",
                      border:
                        "1px solid color-mix(in srgb, var(--th-accent) 28%, transparent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--th-accent)",
                      fontWeight: 700,
                      fontSize: 13,
                      fontFamily: "var(--font-sora), sans-serif",
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>
                )}
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--th-text)",
                      lineHeight: 1.2,
                    }}
                  >
                    {firstName}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--th-text-2)",
                      marginTop: 2,
                      textTransform: "lowercase",
                    }}
                  >
                    {role.replace(/_/g, " ").toLowerCase()}
                  </div>
                </div>
              </div>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  style={{
                    padding: "7px 14px",
                    borderRadius: 9,
                    border:
                      "1px solid color-mix(in srgb, var(--th-border) 80%, transparent)",
                    background: "transparent",
                    color: "var(--th-text-2)",
                    fontFamily: "var(--font-sora), sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* HomePanel (opened by brand tap) */}
      {homePanelOpen && (
        <HomePanel
          name={name}
          avatarUrl={avatarUrl}
          role={role}
          onClose={() => setHomePanelOpen(false)}
        />
      )}

      {/* Settings Modal (opened from overlay) */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HamburgerIcon({ open }: { open: boolean }) {
  const base: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    transition:
      "opacity 0.22s ease, transform 0.28s cubic-bezier(0.16,1,0.3,1)",
  };
  return (
    <div style={{ position: "relative", width: 20, height: 20 }}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{
          ...base,
          opacity: open ? 0 : 1,
          transform: open ? "scale(0.7) rotate(90deg)" : "scale(1) rotate(0deg)",
        }}
      >
        <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{
          ...base,
          opacity: open ? 1 : 0,
          transform: open ? "scale(1) rotate(0deg)" : "scale(0.7) rotate(-90deg)",
        }}
      >
        <line x1="5" y1="5" x2="15" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="15" y1="5" x2="5" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.5V4M10 16V17.5M2.5 10H4M16 10H17.5M4.4 4.4L5.5 5.5M14.5 14.5L15.6 15.6M4.4 15.6L5.5 14.5M14.5 5.5L15.6 4.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
