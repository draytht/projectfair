"use client";

import { useState } from "react";
import { HomePanel } from "./HomePanel";

export function MobileHomeTrigger({
  name,
  avatarUrl,
  role,
}: {
  name: string;
  avatarUrl: string | null;
  role: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="nc-brand"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <span className="nc-brand-dot" />
        <span className="nc-brand-text">
          No<span style={{ color: "var(--th-accent)" }}>Carry</span>
        </span>
      </button>

      {open && (
        <HomePanel
          name={name}
          avatarUrl={avatarUrl}
          role={role}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
