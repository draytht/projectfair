"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { NavLinks } from "./NavLinks";
import { SettingsModal } from "./SettingsModal";
import { HomePanel } from "./HomePanel";
import { ProBadge } from "@/components/ui/pro-badge";

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
  isPro = false,
}: {
  role: string;
  name: string;
  avatarUrl: string | null;
  isPro?: boolean;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openShortcuts, setOpenShortcuts] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const seqRef = useRef<{ key: string; time: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform));
  }, []);

  // Restore pinned state from localStorage
  useEffect(() => {
    setPinned(localStorage.getItem("nc-sidebar-pinned") === "true");
  }, []);

  const togglePin = useCallback(() => {
    setPinned((prev) => {
      const next = !prev;
      localStorage.setItem("nc-sidebar-pinned", String(next));
      return next;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function isInputFocused() {
      const el = document.activeElement;
      return el instanceof HTMLInputElement
        || el instanceof HTMLTextAreaElement
        || el instanceof HTMLSelectElement
        || (el as HTMLElement)?.isContentEditable;
    }

    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;

      // ⌘/Ctrl combos — always fire regardless of focus
      if (mod && e.key === "b") { e.preventDefault(); togglePin(); return; }
      if (mod && e.key === ",") { e.preventDefault(); setOpenShortcuts(false); setSettingsOpen(true); return; }

      // Sequential and single-key shortcuts — skip when typing in an input
      if (isInputFocused()) return;

      const now = Date.now();
      const seq = seqRef.current;

      if (e.key === "?" || e.key === "/") {
        e.preventDefault();
        setOpenShortcuts(true);
        setSettingsOpen(true);
        seqRef.current = null;
        return;
      }

      // G → H  (Dashboard)  |  G → P  (Profile)
      if ((e.key === "g" || e.key === "G") && !mod) {
        seqRef.current = { key: "g", time: now };
        return;
      }
      if (seq?.key === "g" && now - seq.time < 1000) {
        if (e.key === "h" || e.key === "H") { e.preventDefault(); router.push("/dashboard"); seqRef.current = null; return; }
        if (e.key === "p" || e.key === "P") { e.preventDefault(); router.push("/dashboard/profile"); seqRef.current = null; return; }
      }

      seqRef.current = null;
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [togglePin, router]);

  return (
    <aside
      className={`nc-sidebar hidden md:flex shrink-0 flex-col${pinned ? " nc-sidebar-pinned" : ""}`}
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
            <button
              onClick={() => router.push("/dashboard/profile")}
              title="Go to profile"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}
            >
              <Avatar url={avatarUrl} name={name} size={28} />
            </button>
            <div className="nc-sidebar-reveal-block" style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <p style={{ color: "var(--th-text)", fontSize: "0.75rem", fontWeight: 500 }} className="truncate">{name}</p>
                {isPro && <ProBadge />}
              </div>
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
          <SettingsModal open={settingsOpen} onClose={() => { setSettingsOpen(false); setOpenShortcuts(false); }} openShortcuts={openShortcuts} />
        </div>

        {/* Pin / collapse toggle ─ always visible at bottom */}
        <button
          onClick={togglePin}
          title={`${pinned ? "Collapse" : "Pin"} sidebar  ${isMac ? "⌘B" : "Ctrl+B"}`}
          className="nc-sidebar-pin-btn"
        >
          {/* Chevron: points right (→ pin) when collapsed, left (← collapse) when pinned */}
          <svg
            width="12" height="12" viewBox="0 0 12 12"
            fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, transition: "transform 0.22s ease", transform: pinned ? "rotate(180deg)" : "none" }}
          >
            <polyline points="4 2 8 6 4 10" />
          </svg>
          <span className="nc-sidebar-reveal" style={{ fontSize: 11 }}>
            {pinned ? "Collapse" : "Pin sidebar"}
          </span>
          <span className="nc-sidebar-reveal nc-sidebar-kbd">{isMac ? "⌘B" : "Ctrl+B"}</span>
        </button>
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
