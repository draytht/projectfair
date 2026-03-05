"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { ChangePasswordModal } from "./ChangePasswordModal";

const THEMES: { id: Theme; label: string; bg: string; accent: string }[] = [
  { id: "dark",        label: "Dark",       bg: "#0d0d0d", accent: "#e0e0e0" },
  { id: "light",       label: "Light",      bg: "#f0f0f0", accent: "#111111" },
  { id: "gruvbox",     label: "Gruvbox",    bg: "#282828", accent: "#d79921" },
  { id: "nord",        label: "Nord",       bg: "#2e3440", accent: "#88c0d0" },
  { id: "tokyo-night", label: "Tokyo",      bg: "#1a1b26", accent: "#7aa2f7" },
  { id: "dracula",     label: "Dracula",    bg: "#282a36", accent: "#bd93f9" },
  { id: "catppuccin",  label: "Catppuccin", bg: "#1e1e2e", accent: "#cba6f7" },
];

type ShortcutKey = string | { mac: string; other: string };
interface ShortcutDef {
  keys: ShortcutKey[];
  combo?: boolean; // true = hold simultaneously, undefined = sequential
  label: string;
}

const SHORTCUTS: ShortcutDef[] = [
  { keys: [{ mac: "⌘", other: "Ctrl" }, ","], combo: true, label: "Open Settings" },
  { keys: [{ mac: "⌘", other: "Ctrl" }, "B"], combo: true, label: "Toggle sidebar" },
  { keys: ["G", "H"],                                       label: "Go to Dashboard" },
  { keys: ["G", "P"],                                       label: "Go to Profile" },
  { keys: ["?"],                                            label: "Show shortcuts" },
  { keys: ["Esc"],                                          label: "Close modal / panel" },
  { keys: [{ mac: "⌘", other: "Ctrl" }, "1"], combo: true, label: "Project → Board tab" },
  { keys: [{ mac: "⌘", other: "Ctrl" }, "2"], combo: true, label: "Project → History tab" },
  { keys: [{ mac: "⌘", other: "Ctrl" }, "3"], combo: true, label: "Project → Contributions tab" },
  { keys: [{ mac: "⌘", other: "Ctrl" }, "4"], combo: true, label: "Project → Files tab" },
  { keys: [{ mac: "⌘", other: "Ctrl" }, "5"], combo: true, label: "Project → Activity tab" },
  { keys: [{ mac: "⌘", other: "Ctrl" }, "6"], combo: true, label: "Project → Chat tab" },
  { keys: [{ mac: "⌘", other: "Ctrl" }, "↵"], combo: true, label: "Chat → Send message" },
];

type Category = "appearance" | "effects" | "account" | "support";
type SupportView = "menu" | "feedback" | "bug";

// ── Reusable input style ──────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "9px 12px", borderRadius: 8,
  background: "var(--th-bg)",
  border: "1px solid var(--th-border)",
  color: "var(--th-text)", fontSize: 12,
  outline: "none", resize: "none",
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      style={{ width: 40, height: 22, borderRadius: 11, border: "none",
        background: checked ? "var(--th-accent)" : "var(--th-border)",
        position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: checked ? "var(--th-accent-fg)" : "var(--th-text-2)",
        transition: "left 0.2s, background 0.2s", display: "block" }} />
    </button>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      padding: "12px 0", borderBottom: "1px solid var(--th-border)" }}>
      <div>
        <p style={{ color: "var(--th-text)", fontSize: 13, fontWeight: 500, margin: 0 }}>{label}</p>
        {description && <p style={{ color: "var(--th-text-2)", fontSize: 11, margin: "2px 0 0" }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ActionRow({ icon, label, description, onClick, href, rightLabel }: {
  icon: React.ReactNode; label: string; description?: string;
  onClick?: () => void; href?: string; rightLabel?: string;
}) {
  const inner = (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 10,
      background: "var(--th-bg)", border: "1px solid var(--th-border)", cursor: "pointer", textDecoration: "none",
      transition: "opacity 0.15s" }}>
      <span style={{ color: "var(--th-accent)", flexShrink: 0, display: "flex" }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "var(--th-text)", fontSize: 13, fontWeight: 500, margin: 0 }}>{label}</p>
        {description && <p style={{ color: "var(--th-text-2)", fontSize: 11, margin: "2px 0 0" }}>{description}</p>}
      </div>
      <span style={{ color: "var(--th-text-2)", fontSize: 13, flexShrink: 0 }}>{rightLabel ?? "→"}</span>
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} className="hover:opacity-75 transition">{inner}</a>;
  return <button onClick={onClick} style={{ all: "unset", display: "block", width: "100%", boxSizing: "border-box" }} className="hover:opacity-75 transition">{inner}</button>;
}

// ── Inline Feedback Form ──────────────────────────────────────────────────────
function FeedbackForm({ onBack }: { onBack: () => void }) {
  const [name, setName]       = useState("");
  const [role, setRole]       = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating]   = useState(5);
  const [status, setStatus]   = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError]     = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending"); setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, message, rating }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); setStatus("error"); return; }
      setStatus("done");
    } catch {
      setError("Network error, please try again"); setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0", textAlign: "center" }}>
        <span style={{ fontSize: 32 }}>🎉</span>
        <p style={{ color: "var(--th-text)", fontWeight: 600, fontSize: 14 }}>Thanks for your feedback!</p>
        <p style={{ color: "var(--th-text-2)", fontSize: 12 }}>We'll review it and it may appear on our site.</p>
        <button onClick={onBack} style={{ marginTop: 8, color: "var(--th-accent)", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>← Back</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button type="button" onClick={onBack}
        style={{ alignSelf: "flex-start", color: "var(--th-text-2)", background: "none", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 2, padding: 0 }}>
        ← Back
      </button>
      <p style={{ color: "var(--th-text)", fontWeight: 600, fontSize: 13, margin: 0 }}>Send Feedback</p>
      <p style={{ color: "var(--th-text-2)", fontSize: 11, margin: 0 }}>Your feedback may be featured on our website.</p>

      {/* Star rating */}
      <div style={{ display: "flex", gap: 4, margin: "4px 0" }}>
        {[1,2,3,4,5].map((s) => (
          <button key={s} type="button" onClick={() => setRating(s)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, fontSize: 20,
              color: s <= rating ? "var(--th-accent)" : "var(--th-border)", transition: "color 0.1s" }}>
            ★
          </button>
        ))}
      </div>

      <input style={inputStyle} placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} required maxLength={80} />
      <input style={inputStyle} placeholder="Your role (e.g. Student at UCLA)" value={role} onChange={e => setRole(e.target.value)} maxLength={100} />
      <textarea style={{ ...inputStyle, minHeight: 90 }} placeholder="Your message *" value={message} onChange={e => setMessage(e.target.value)} required maxLength={500} />
      <p style={{ color: "var(--th-text-2)", fontSize: 10, textAlign: "right", margin: 0 }}>{message.length}/500</p>

      {error && <p style={{ color: "#ef4444", fontSize: 11 }}>{error}</p>}

      <button type="submit" disabled={status === "sending"}
        style={{ padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
          background: "var(--th-accent)", color: "var(--th-accent-fg)", fontSize: 13, fontWeight: 600,
          opacity: status === "sending" ? 0.6 : 1, transition: "opacity 0.15s" }}>
        {status === "sending" ? "Sending…" : "Submit Feedback"}
      </button>
    </form>
  );
}

// ── Inline Bug Report Form ────────────────────────────────────────────────────
function BugReportForm({ onBack }: { onBack: () => void }) {
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps]           = useState("");
  const [email, setEmail]           = useState("");
  const [status, setStatus]         = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError]           = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending"); setError("");
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, steps, email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); setStatus("error"); return; }
      setStatus("done");
    } catch {
      setError("Network error, please try again"); setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0", textAlign: "center" }}>
        <span style={{ fontSize: 32 }}>🐛</span>
        <p style={{ color: "var(--th-text)", fontWeight: 600, fontSize: 14 }}>Bug report received!</p>
        <p style={{ color: "var(--th-text-2)", fontSize: 12 }}>We'll investigate and get back to you if an email was provided.</p>
        <button onClick={onBack} style={{ marginTop: 8, color: "var(--th-accent)", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>← Back</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button type="button" onClick={onBack}
        style={{ alignSelf: "flex-start", color: "var(--th-text-2)", background: "none", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 2, padding: 0 }}>
        ← Back
      </button>
      <p style={{ color: "var(--th-text)", fontWeight: 600, fontSize: 13, margin: 0 }}>Report a Bug</p>
      <p style={{ color: "var(--th-text-2)", fontSize: 11, margin: 0 }}>Describe what happened and we'll look into it.</p>

      <input style={inputStyle} placeholder="Short title *  (e.g. 'Board doesn't load on mobile')" value={title} onChange={e => setTitle(e.target.value)} required maxLength={120} />
      <textarea style={{ ...inputStyle, minHeight: 80 }} placeholder="What went wrong? *" value={description} onChange={e => setDescription(e.target.value)} required maxLength={2000} />
      <textarea style={{ ...inputStyle, minHeight: 64 }} placeholder="Steps to reproduce (optional)" value={steps} onChange={e => setSteps(e.target.value)} maxLength={1000} />
      <input style={inputStyle} type="email" placeholder="Your email for follow-up (optional)" value={email} onChange={e => setEmail(e.target.value)} />

      {error && <p style={{ color: "#ef4444", fontSize: 11 }}>{error}</p>}

      <button type="submit" disabled={status === "sending"}
        style={{ padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
          background: "var(--th-accent)", color: "var(--th-accent-fg)", fontSize: 13, fontWeight: 600,
          opacity: status === "sending" ? 0.6 : 1, transition: "opacity 0.15s" }}>
        {status === "sending" ? "Sending…" : "Submit Report"}
      </button>
    </form>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function SettingsModal({ open, onClose, openShortcuts }: { open: boolean; onClose: () => void; openShortcuts?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [cat, setCat] = useState<Category>("appearance");
  const [supportView, setSupportView] = useState<SupportView>("menu");

  const [soundEnabled, setSoundEnabled]   = useState(true);
  const [cursorGlow, setCursorGlow]       = useState(true);
  const [reduceMotion, setReduceMotion]   = useState(false);
  const [showThemeToggle, setShowThemeToggle] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [copied, setCopied]               = useState(false);
  const [pwOpen, setPwOpen]               = useState(false);
  const [isMac, setIsMac]                 = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform));
  }, []);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSoundEnabled(localStorage.getItem("nc-sound") !== "false");
    setCursorGlow(localStorage.getItem("nc-cursor-glow") !== "false");
    setReduceMotion(localStorage.getItem("nc-reduce-motion") === "true");
    setShowThemeToggle(localStorage.getItem("nc-theme-toggle") !== "false");
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && openShortcuts) {
      setCat("support");
      setShortcutsOpen(true);
    }
  }, [open, openShortcuts]);

  // Reset support sub-view when switching categories
  function goToCategory(id: Category) {
    setCat(id);
    setSupportView("menu");
    setShortcutsOpen(false);
  }

  function toggleSound(val: boolean) {
    setSoundEnabled(val);
    localStorage.setItem("nc-sound", String(val));
    window.dispatchEvent(new CustomEvent("nc-settings", { detail: { sound: val } }));
  }
  function toggleCursorGlow(val: boolean) {
    setCursorGlow(val);
    localStorage.setItem("nc-cursor-glow", String(val));
    window.dispatchEvent(new CustomEvent("nc-settings", { detail: { cursorGlow: val } }));
  }
  function toggleReduceMotion(val: boolean) {
    setReduceMotion(val);
    localStorage.setItem("nc-reduce-motion", String(val));
    window.dispatchEvent(new CustomEvent("nc-settings", { detail: { reduceMotion: val } }));
  }
  function toggleThemeToggle(val: boolean) {
    setShowThemeToggle(val);
    localStorage.setItem("nc-theme-toggle", String(val));
    window.dispatchEvent(new CustomEvent("nc-settings", { detail: { themeToggle: val } }));
  }

  async function handleShare() {
    const url  = "https://nocarry.space";
    const text = "Check out NoCarry — fair grading for group projects!";
    if (navigator.share) {
      try { await navigator.share({ title: "NoCarry", text, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  if (!open) return null;

  const CATS: { id: Category; label: string; icon: React.ReactNode }[] = [
    { id: "appearance", label: "Appearance", icon: <PaletteIcon /> },
    { id: "effects",    label: "Effects",    icon: <SparkleIcon /> },
    { id: "account",    label: "Account",    icon: <UserIcon /> },
    { id: "support",    label: "Support",    icon: <LifebuoyIcon /> },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={modalRef} className="nc-settings-modal"
        style={{ width: "100%", maxWidth: 520, background: "var(--th-card)",
          border: "1px solid var(--th-border)", borderRadius: 18, overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--th-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GearIcon style={{ color: "var(--th-accent)", width: 16, height: 16 }} />
            <span style={{ color: "var(--th-text)", fontSize: 14, fontWeight: 700 }}>Settings</span>
          </div>
          <button onClick={onClose}
            style={{ color: "var(--th-text-2)", background: "none", border: "none", cursor: "pointer",
              fontSize: 18, lineHeight: 1, padding: "2px 6px", borderRadius: 6 }}
            className="hover:opacity-70 transition">×</button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar tabs */}
          <div style={{ width: 128, borderRight: "1px solid var(--th-border)", padding: "12px 8px",
            display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
            {CATS.map((c) => (
              <button key={c.id} onClick={() => goToCategory(c.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8,
                  border: "none", cursor: "pointer", textAlign: "left",
                  background: cat === c.id ? "color-mix(in srgb, var(--th-accent) 12%, transparent)" : "transparent",
                  color: cat === c.id ? "var(--th-accent)" : "var(--th-text-2)",
                  fontSize: 12, fontWeight: cat === c.id ? 600 : 400, transition: "all 0.1s" }}>
                <span style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>

            {/* ── Appearance ── */}
            {cat === "appearance" && (
              <div>
                <p style={{ color: "var(--th-text-2)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Theme</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {THEMES.map((t) => (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      style={{ borderRadius: 10, overflow: "hidden",
                        border: theme === t.id ? `2px solid var(--th-accent)` : "2px solid var(--th-border)",
                        cursor: "pointer", background: "none", padding: 0, transition: "border-color 0.15s" }}>
                      <div style={{ background: t.bg, padding: "10px 10px 6px", display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", gap: 3 }}>
                          <div style={{ width: 6, height: 6, borderRadius: 2, background: t.accent, opacity: 0.9 }} />
                          <div style={{ flex: 1, height: 6, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
                        </div>
                        <div style={{ display: "flex", gap: 3 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)" }} />
                          <div style={{ width: 12, height: 4, borderRadius: 2, background: t.accent, opacity: 0.7 }} />
                        </div>
                        <div style={{ width: "60%", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)" }} />
                      </div>
                      <div style={{ background: t.bg, borderTop: `1px solid ${t.accent}22`, padding: "4px 10px 6px" }}>
                        <p style={{ color: theme === t.id ? t.accent : "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 600, margin: 0 }}>{t.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Effects ── */}
            {cat === "effects" && (
              <div>
                <Row label="Click sounds" description="Mechanical keyboard sound on interactions">
                  <Toggle checked={soundEnabled} onChange={toggleSound} />
                </Row>
                <Row label="Cursor glow" description="Soft ambient glow that follows your cursor">
                  <Toggle checked={cursorGlow} onChange={toggleCursorGlow} />
                </Row>
                <Row label="Reduce motion" description="Disable non-essential animations">
                  <Toggle checked={reduceMotion} onChange={toggleReduceMotion} />
                </Row>
                <Row label="Theme picker" description="Show the floating theme button at the bottom">
                  <Toggle checked={showThemeToggle} onChange={toggleThemeToggle} />
                </Row>
                <div style={{ paddingTop: 16 }}>
                  <p style={{ color: "var(--th-text-2)", fontSize: 11, lineHeight: 1.5 }}>
                    Changes take effect immediately. Settings are saved in your browser.
                  </p>
                </div>
              </div>
            )}

            {/* ── Account ── */}
            {cat === "account" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/dashboard/profile" onClick={onClose}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 13px", borderRadius: 10, background: "var(--th-bg)",
                    border: "1px solid var(--th-border)", color: "var(--th-text)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
                  className="hover:opacity-80 transition">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "var(--th-accent)", display: "flex" }}><UserIcon /></span>
                    Edit Profile
                  </div>
                  <span style={{ color: "var(--th-text-2)", fontSize: 16 }}>→</span>
                </Link>
                <button
                  onClick={() => setPwOpen(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 13px", borderRadius: 10, background: "var(--th-bg)",
                    border: "1px solid var(--th-border)", color: "var(--th-text)", fontSize: 13, fontWeight: 500,
                    width: "100%", cursor: "pointer", textAlign: "left" }}
                  className="hover:opacity-80 transition">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "var(--th-accent)", display: "flex" }}><LockIcon /></span>
                    Change Password
                  </div>
                  <span style={{ color: "var(--th-text-2)", fontSize: 16 }}>→</span>
                </button>
                <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
                <div style={{ marginTop: 4, padding: "14px", borderRadius: 10,
                  background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <p style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Sign Out</p>
                  <p style={{ color: "rgba(239,68,68,0.7)", fontSize: 11, marginBottom: 12 }}>You will be redirected to the login page.</p>
                  <form action="/api/auth/logout" method="POST">
                    <button type="submit"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8,
                        padding: "6px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      className="hover:opacity-80 transition">
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ── Support ── */}
            {cat === "support" && (
              <>
                {supportView === "feedback" && <FeedbackForm onBack={() => setSupportView("menu")} />}
                {supportView === "bug"      && <BugReportForm onBack={() => setSupportView("menu")} />}
                {supportView === "menu"     && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                    <ActionRow icon={<ShareIcon />} label="Share with a Friend"
                      description="Invite teammates or classmates to NoCarry"
                      onClick={handleShare} rightLabel={copied ? "Copied!" : "Share"} />

                    <ActionRow icon={<KeyboardIcon />} label="Keyboard Shortcuts"
                      description="View all available shortcuts"
                      onClick={() => setShortcutsOpen((o) => !o)} rightLabel={shortcutsOpen ? "▲" : "▼"} />

                    {shortcutsOpen && (
                      <div style={{ borderRadius: 10, border: "1px solid var(--th-border)", overflow: "hidden", marginTop: -4 }}>
                        {SHORTCUTS.map((s, i) => {
                          const resolvedKeys = s.keys.map((k) =>
                            typeof k === "string" ? k : (isMac ? k.mac : k.other)
                          );
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "9px 14px", borderBottom: i < SHORTCUTS.length - 1 ? "1px solid var(--th-border)" : "none",
                              background: "var(--th-bg)" }}>
                              <span style={{ color: "var(--th-text-2)", fontSize: 12 }}>{s.label}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                {resolvedKeys.flatMap((k, ki) => [
                                  ...(ki > 0 ? [
                                    <span key={`sep-${i}-${ki}`} style={{ color: "var(--th-text-2)", fontSize: 10, userSelect: "none", lineHeight: 1 }}>
                                      {s.combo ? "+" : "›"}
                                    </span>
                                  ] : []),
                                  <kbd key={`k-${i}-${ki}`} style={{ display: "inline-block", padding: "2px 7px", borderRadius: 5,
                                    background: "var(--th-card)", border: "1px solid var(--th-border)",
                                    color: "var(--th-text)", fontSize: 11, fontFamily: "monospace", fontWeight: 600 }}>{k}</kbd>,
                                ])}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <ActionRow icon={<MessageIcon />} label="Send Feedback"
                      description="Tell us what's working or what's not"
                      onClick={() => setSupportView("feedback")} />

                    <ActionRow icon={<SparkleIcon />} label="What's New"
                      description="See the latest features and updates"
                      href="/changelog" />

                    <div style={{ borderTop: "1px solid var(--th-border)", margin: "4px 0" }} />

                    <ActionRow icon={<DocIcon />} label="Terms of Use" href="/terms" />
                    <ActionRow icon={<ShieldIcon />} label="Privacy Policy" href="/privacy" />

                    <ActionRow icon={<BugIcon />} label="Report a Bug"
                      description="Something broken? Let us know"
                      onClick={() => setSupportView("bug")} />

                    <p style={{ color: "var(--th-text-2)", fontSize: 10, textAlign: "center", marginTop: 8, opacity: 0.5 }}>
                      NoCarry v0.1.0
                    </p>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function GearIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function PaletteIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>; }
function SparkleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>; }
function UserIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>; }
function LifebuoyIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>; }
function LockIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function ShareIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>; }
function KeyboardIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>; }
function MessageIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function DocIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>; }
function ShieldIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function BugIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>; }
