"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

type Step = "form" | "loading" | "done" | "error";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  );
}

function PasswordInput({
  label, value, onChange, placeholder, autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label style={{ color: "var(--th-text-2)", fontSize: 11, fontWeight: 500, display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <div style={{
        display: "flex", alignItems: "center",
        background: "var(--th-bg)",
        border: `1px solid ${focused ? "var(--th-accent)" : "var(--th-border)"}`,
        borderRadius: 9, overflow: "hidden",
        transition: "border-color 0.15s",
      }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "var(--th-text)", fontSize: 13, padding: "10px 12px",
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "0 12px", color: "var(--th-text-2)",
            display: "flex", alignItems: "center",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--th-accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-text-2)")}
          aria-label={show ? "Hide password" : "Show password"}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  );
}

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; color: string };

function getStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const map: Record<0 | 1 | 2 | 3 | 4, Omit<Strength, "score">> = {
    0: { label: "",         color: "transparent" },
    1: { label: "Weak",     color: "#ef4444" },
    2: { label: "Fair",     color: "#f97316" },
    3: { label: "Good",     color: "#eab308" },
    4: { label: "Strong",   color: "#22c55e" },
  };
  return { score: capped, ...map[capped] };
}

function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {([1, 2, 3, 4] as const).map((s) => (
          <div key={s} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: score >= s ? color : "var(--th-border)",
            transition: "background 0.25s",
          }} />
        ))}
      </div>
      {label && (
        <p style={{ fontSize: 10, color, fontWeight: 600, margin: 0, transition: "color 0.25s" }}>
          {label}
        </p>
      )}
    </div>
  );
}

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [step,     setStep]     = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");

  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset all state when opened
  useEffect(() => {
    if (open) {
      setCurrent(""); setNext(""); setConfirm("");
      setStep("form"); setErrorMsg("");
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    if (step === "loading") return; // prevent close mid-request
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!current) { setErrorMsg("Enter your current password"); return; }
    if (next.length < 8) { setErrorMsg("New password must be at least 8 characters"); return; }
    if (next !== confirm) { setErrorMsg("Passwords do not match"); return; }
    if (current === next) { setErrorMsg("New password must be different from current"); return; }

    setStep("loading");

    try {
      const supabase = createClient();

      // Get the current user's email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) throw new Error("Session expired — please log in again");

      // Re-authenticate with current password to confirm identity
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Apply the new password
      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) throw new Error(updateError.message);

      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

  if (!open) return null;

  const mismatch = confirm.length > 0 && next !== confirm;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{
        width: "100%", maxWidth: 420,
        background: "var(--th-card)",
        border: "1px solid var(--th-border)",
        borderRadius: 18,
        boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
        overflow: "hidden",
        animation: "nc-modal-in 0.22s cubic-bezier(0.16,1,0.3,1)",
      }}>

        {/* ── Success state ── */}
        {step === "done" ? (
          <div style={{ padding: "40px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "color-mix(in srgb, #22c55e 15%, transparent)",
              border: "1px solid color-mix(in srgb, #22c55e 35%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "nc-saved-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p style={{ color: "var(--th-text)", fontWeight: 700, fontSize: 15, margin: 0 }}>Password updated</p>
            <p style={{ color: "var(--th-text-2)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              Your password has been changed successfully.
            </p>
            <button
              onClick={handleClose}
              style={{
                marginTop: 8, padding: "9px 28px", borderRadius: 9, border: "none",
                background: "var(--th-accent)", color: "var(--th-accent-fg)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
              className="hover:opacity-85 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 22px 14px",
              borderBottom: "1px solid var(--th-border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--th-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ color: "var(--th-text)", fontSize: 14, fontWeight: 700 }}>Change Password</span>
              </div>
              <button
                onClick={handleClose}
                disabled={step === "loading"}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--th-text-2)", fontSize: 20, lineHeight: 1,
                  padding: "2px 6px", borderRadius: 6,
                  opacity: step === "loading" ? 0.4 : 1,
                }}
                className="hover:opacity-60 transition"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: "22px 22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

              <PasswordInput
                label="Current password"
                value={current}
                onChange={setCurrent}
                placeholder="Enter current password"
                autoComplete="current-password"
              />

              <div>
                <PasswordInput
                  label="New password"
                  value={next}
                  onChange={setNext}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
                <StrengthBar password={next} />
              </div>

              <div>
                <PasswordInput
                  label="Confirm new password"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
                {mismatch && (
                  <p style={{ color: "#ef4444", fontSize: 10, marginTop: 5, fontWeight: 500 }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              {(step === "error" || errorMsg) && (
                <div style={{
                  padding: "10px 14px", borderRadius: 9,
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}>
                  <p style={{ color: "#ef4444", fontSize: 12, margin: 0 }}>{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={step === "loading" || mismatch}
                style={{
                  padding: "11px 0", borderRadius: 9, border: "none",
                  background: "var(--th-accent)", color: "var(--th-accent-fg)",
                  fontSize: 13, fontWeight: 600,
                  cursor: step === "loading" || mismatch ? "not-allowed" : "pointer",
                  opacity: step === "loading" || mismatch ? 0.55 : 1,
                  transition: "opacity 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: 4,
                }}
              >
                {step === "loading" ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      style={{ animation: "nc-icon-spin 0.8s linear infinite" }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Updating…
                  </>
                ) : "Update Password"}
              </button>

              <p style={{ color: "var(--th-text-2)", fontSize: 10.5, textAlign: "center", margin: 0, lineHeight: 1.5 }}>
                You'll stay logged in after changing your password.
              </p>
            </form>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes nc-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}} />
    </div>,
    document.body
  );
}
