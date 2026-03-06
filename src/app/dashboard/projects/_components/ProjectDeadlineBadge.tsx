"use client";

import { useEffect, useState } from "react";

export function ProjectDeadlineBadge({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(deadline).getTime();
  const diff = target - now;
  const overdue = diff <= 0;
  const totalSecs = Math.max(0, Math.floor(diff / 1000));

  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  const color = overdue
    ? "#ef4444"
    : days < 1
    ? "#f97316"
    : days < 3
    ? "#eab308"
    : "var(--th-accent)";

  const bg = overdue
    ? "rgba(239,68,68,0.10)"
    : days < 1
    ? "rgba(249,115,22,0.10)"
    : days < 3
    ? "rgba(234,179,8,0.10)"
    : "color-mix(in srgb, var(--th-accent) 10%, transparent)";

  const label = overdue
    ? "Overdue"
    : days > 0
    ? `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`
    : `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: bg,
        borderRadius: 6,
        padding: "3px 8px",
        marginTop: 4,
      }}
    >
      {/* clock icon */}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span style={{ color, fontSize: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
        {label}
      </span>
    </div>
  );
}
