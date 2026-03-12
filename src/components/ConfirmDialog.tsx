"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmVariant = "delete" | "unlink" | "restore" | "create" | "update" | "terminate";

export interface ConfirmOptions {
  title: string;
  message?: string;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

// ─── Variant config ───────────────────────────────────────────────────────────

const VARIANT_COLORS: Record<ConfirmVariant, string> = {
  delete:    "#ef4444",
  unlink:    "#f97316",
  restore:   "#22c55e",
  create:    "var(--th-accent)",
  update:    "var(--th-accent)",
  terminate: "#ef4444",
};

const DEFAULT_LABELS: Record<ConfirmVariant, string> = {
  delete:    "Delete",
  unlink:    "Unlink",
  restore:   "Restore",
  create:    "Create",
  update:    "Save",
  terminate: "Terminate",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function DeleteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function UnlinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.84 12.25l1.72-1.71a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
      <path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />
      <line x1="8" y1="2" x2="8" y2="5" />
      <line x1="2" y1="8" x2="5" y2="8" />
      <line x1="16" y1="19" x2="16" y2="22" />
      <line x1="19" y1="16" x2="22" y2="16" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function UpdateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TerminateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "nc-confirm-spin 0.8s linear infinite", flexShrink: 0 }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

const VARIANT_ICON: Record<ConfirmVariant, () => JSX.Element> = {
  delete:    DeleteIcon,
  unlink:    UnlinkIcon,
  restore:   RestoreIcon,
  create:    CreateIcon,
  update:    UpdateIcon,
  terminate: TerminateIcon,
};

// ─── Dialog component ─────────────────────────────────────────────────────────

export function ConfirmDialog({
  open, onClose, onConfirm,
  title, message,
  variant = "delete",
  confirmLabel,
  cancelLabel = "Cancel",
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const color = VARIANT_COLORS[variant];
  const label = confirmLabel ?? DEFAULT_LABELS[variant];
  const Icon  = VARIANT_ICON[variant];

  // Auto-focus confirm button when opened
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => confirmBtnRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);

  const handleConfirm = useCallback(async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }, [onConfirm]);

  if (!open) return null;

  const isAccent = variant === "create" || variant === "update";

  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes nc-confirm-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        @keyframes nc-confirm-spin {
          to { transform: rotate(360deg); }
        }
      `}} />

      {/* Backdrop */}
      <div
        onClick={() => { if (!busy) onClose(); }}
        style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }}
      >
        {/* Panel */}
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="nc-confirm-title"
          aria-describedby={message ? "nc-confirm-msg" : undefined}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 400,
            background: "var(--th-card)",
            border: "1px solid var(--th-border)",
            borderRadius: 18,
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            animation: "nc-confirm-in 0.22s cubic-bezier(0.16,1,0.3,1) both",
            overflow: "hidden",
          }}
        >
          {/* Body */}
          <div style={{ padding: "28px 28px 20px" }}>
            {/* Icon badge */}
            <div style={{
              width: 44, height: 44, borderRadius: 12, marginBottom: 16,
              background: isAccent
                ? "color-mix(in srgb, var(--th-accent) 15%, transparent)"
                : `color-mix(in srgb, ${color} 14%, transparent)`,
              color: isAccent ? "var(--th-accent)" : color,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon />
            </div>

            {/* Title */}
            <p
              id="nc-confirm-title"
              style={{
                margin: message ? "0 0 8px" : 0,
                fontSize: 15.5, fontWeight: 600,
                color: "var(--th-text)", lineHeight: 1.35,
              }}
            >
              {title}
            </p>

            {/* Message */}
            {message && (
              <p
                id="nc-confirm-msg"
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  color: "var(--th-text-2)",
                  lineHeight: 1.55,
                }}
              >
                {message}
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", gap: 8,
            padding: "0 28px 24px",
            justifyContent: "flex-end",
          }}>
            {/* Cancel */}
            <button
              onClick={onClose}
              disabled={busy}
              className="nc-confirm-cancel-btn"
              style={{
                padding: "8px 18px", borderRadius: 9,
                border: "1px solid var(--th-border)",
                background: "transparent",
                color: "var(--th-text-2)",
                fontSize: 13.5, fontWeight: 500,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.5 : 1,
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
                fontFamily: "inherit",
              }}
            >
              {cancelLabel}
            </button>

            {/* Confirm */}
            <button
              ref={confirmBtnRef}
              onClick={handleConfirm}
              disabled={busy}
              style={{
                padding: "8px 18px", borderRadius: 9,
                border: "none",
                background: isAccent ? "var(--th-accent)" : color,
                color: isAccent ? "var(--th-accent-fg)" : "#fff",
                fontSize: 13.5, fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.78 : 1,
                transition: "opacity 0.15s, filter 0.15s",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!busy) (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.filter = "none";
              }}
            >
              {busy && <SpinnerIcon />}
              {busy ? "Working…" : label}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── useConfirm hook ──────────────────────────────────────────────────────────

/**
 * Promise-based drop-in for window.confirm(). Renders nothing on its own —
 * you must spread `dialog` somewhere in your JSX.
 *
 * @example
 *   const { confirm, dialog } = useConfirm();
 *
 *   async function handleDelete() {
 *     const ok = await confirm({
 *       title: `Delete "${course.name}"?`,
 *       message: "It will be moved to Trash and can be restored later.",
 *       variant: "delete",
 *     });
 *     if (!ok) return;
 *     // … proceed with deletion
 *   }
 *
 *   return (
 *     <>
 *       {dialog}
 *       <button onClick={handleDelete}>Delete</button>
 *     </>
 *   );
 */
export function useConfirm() {
  const [pending, setPending] = useState<
    (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  >(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const handleClose = useCallback(() => {
    pending?.resolve(false);
    setPending(null);
  }, [pending]);

  const handleConfirm = useCallback(() => {
    pending?.resolve(true);
    setPending(null);
  }, [pending]);

  const dialog = pending ? (
    <ConfirmDialog
      open
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={pending.title}
      message={pending.message}
      variant={pending.variant}
      confirmLabel={pending.confirmLabel}
      cancelLabel={pending.cancelLabel}
    />
  ) : null;

  return { confirm, dialog };
}
