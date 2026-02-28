"use client";

import { useState } from "react";
import { NavLinks } from "./NavLinks";
import { SettingsModal } from "./SettingsModal";
import { HomePanel } from "./HomePanel";

function initials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0][0] ?? "?").toUpperCase();
}

function Avatar({ url, name, size = 28 }: { url: string | null; name: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--th-accent)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ color: "#fff", fontSize: size * 0.36, fontWeight: 700, lineHeight: 1 }}>
          {initials(name)}
        </span>
      )}
    </div>
  );
}

export function Sidebar({
  role,
  name,
  avatarUrl,
}: {
  role: string;
  name: string;
  avatarUrl: string | null;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);

  return (
    <aside
      className="nc-sidebar hidden md:flex shrink-0 flex-col"
      style={{
        position: "relative",
        background: "var(--th-card)",
        borderRight: "1px solid var(--th-border)",
        overflow: "hidden",
      }}
    >
      <div className="flex flex-col flex-1 py-6" style={{ width: "100%" }}>

        {/* Brand */}
        <button
          onClick={() => setHomeOpen(true)}
          className="nc-brand nc-sidebar-brand"
          style={{
            marginBottom: 24,
            height: 28,
            background: "none",
            border: "none",
            cursor: "pointer",
            width: "100%",
            paddingRight: 12,
          }}
        >
          <span className="nc-brand-dot" style={{ flexShrink: 0 }} />
          <span className="nc-sidebar-reveal nc-brand-text">
            No<span style={{ color: "var(--th-accent)" }}>Carry</span>
          </span>
        </button>

        {/* Nav links */}
        <NavLinks role={role} />

        {/* Bottom: avatar + info + actions */}
        <div
          className="mt-auto"
          style={{ borderTop: "1px solid var(--th-border)", paddingTop: 16 }}
        >
          {/* Avatar row */}
          <div
            className="nc-sidebar-user"
            style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 12 }}
          >
            <Avatar url={avatarUrl} name={name} size={28} />
            <div className="nc-sidebar-reveal-block" style={{ minWidth: 0 }}>
              <p style={{ color: "var(--th-text)", fontSize: "0.75rem", fontWeight: 500 }} className="truncate">{name}</p>
              <p style={{ color: "var(--th-text-2)", fontSize: "0.75rem" }} className="capitalize">{role.toLowerCase()}</p>
            </div>
          </div>

          {/* Logout + settings */}
          <div
            className="nc-sidebar-actions"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
              marginTop: 12,
            }}
          >
            <form action="/api/auth/logout" method="POST">
              <button
                style={{ color: "var(--th-text-2)" }}
                className="text-xs hover:opacity-70 transition cursor-pointer"
              >
                Log out
              </button>
            </form>
            <button
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              className="nc-gear-btn"
              style={{ color: "var(--th-text-2)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
      </div>

      {/* Expand hint */}
      <div
        className="nc-sidebar-hint-icon"
        style={{
          position: "absolute",
          bottom: 12,
          left: 0,
          width: 44,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <svg
          width="12" height="12" viewBox="0 0 12 12"
          fill="none" stroke="var(--th-text-2)"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: "nc-sidebar-hint 1.8s ease-in-out infinite" }}
        >
          <polyline points="4 2 8 6 4 10" />
        </svg>
      </div>

      {homeOpen && (
        <HomePanel
          name={name}
          avatarUrl={avatarUrl}
          role={role}
          onClose={() => setHomeOpen(false)}
        />
      )}
    </aside>
  );
}
