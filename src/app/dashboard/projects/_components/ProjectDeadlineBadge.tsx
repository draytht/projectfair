"use client";

import { useEffect, useState } from "react";

const LEGEND = [
  { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Overdue", desc: "Deadline has passed" },
  { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "< 1 day", desc: "Critical — due very soon" },
  { color: "#eab308", bg: "rgba(234,179,8,0.12)", label: "< 3 days", desc: "Warning — limited time" },
  { color: "var(--th-accent)", bg: "color-mix(in srgb, var(--th-accent) 12%, transparent)", label: "3+ days", desc: "On track" },
];

export function ProjectDeadlineBadge({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(() => Date.now());
  const [showTooltip, setShowTooltip] = useState(false);

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

  const deadlineDate = new Date(deadline).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      style={{ position: "relative", display: "inline-flex", marginTop: 4 }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: bg,
          borderRadius: 6,
          padding: "3px 8px",
          cursor: "default",
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
        {/* info icon */}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" />
          <line x1="12" y1="12" x2="12" y2="16" />
        </svg>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            background: "var(--th-card)",
            border: "1px solid var(--th-border)",
            borderRadius: 10,
            padding: "10px 12px",
            minWidth: 200,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            pointerEvents: "none",
          }}
        >
          {/* Deadline date */}
          <p style={{ color: "var(--th-text-2)", fontSize: 10, marginBottom: 8 }}>
            Due: <span style={{ color: "var(--th-text)", fontWeight: 600 }}>{deadlineDate}</span>
          </p>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--th-border)", marginBottom: 8 }} />

          {/* Color legend */}
          <p style={{ color: "var(--th-text-2)", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Urgency guide
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {LEGEND.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: item.bg,
                  border: `1.5px solid ${item.color}`,
                  flexShrink: 0,
                }} />
                <span style={{ color: item.color, fontSize: 10, fontWeight: 700, minWidth: 48 }}>{item.label}</span>
                <span style={{ color: "var(--th-text-2)", fontSize: 10 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
