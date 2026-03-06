"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function buildGrid(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

interface DeadlinePickerProps {
  value: string;        // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DeadlinePicker({
  value,
  onChange,
  placeholder = "Pick a deadline…",
}: DeadlinePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  const init = selected ?? today;
  const [viewYear, setViewYear] = useState(init.getFullYear());
  const [viewMonth, setViewMonth] = useState(init.getMonth());

  // When external value changes, sync the view
  useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const atMinMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  function prevMonth() {
    if (atMinMonth) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function pickDay(date: Date) {
    if (date < today) return;
    const iso = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    onChange(iso);
    setOpen(false);
  }

  function clearDate(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  const cells = buildGrid(viewYear, viewMonth);

  const displayLabel = selected
    ? selected.toLocaleDateString(undefined, {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--th-bg)",
          border: `1.5px solid ${open ? "var(--th-accent)" : "var(--th-border)"}`,
          color: selected ? "var(--th-text)" : "var(--th-text-2)",
          borderRadius: 10,
          padding: "9px 12px",
          fontSize: 14,
          outline: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "border-color 0.15s",
        }}
      >
        <CalendarIcon size={15} style={{ color: "var(--th-accent)", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{displayLabel ?? placeholder}</span>
        {selected && (
          <span
            role="button"
            onClick={clearDate}
            style={{
              display: "flex", alignItems: "center",
              color: "var(--th-text-2)", borderRadius: 4, padding: 2,
              transition: "color 0.14s", cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-text-2)")}
          >
            <X size={13} />
          </span>
        )}
      </button>

      {/* ── Popover ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 60,
            background: "var(--th-card)",
            border: "1px solid var(--th-border)",
            borderRadius: 16,
            boxShadow: "0 16px 48px rgba(0,0,0,0.28)",
            padding: "16px 14px 14px",
            width: 288,
            userSelect: "none",
          }}
        >
          {/* Month header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <NavBtn onClick={prevMonth} disabled={atMinMonth}>
              <ChevronLeft size={14} strokeWidth={2.5} />
            </NavBtn>

            <span style={{ color: "var(--th-text)", fontWeight: 700, fontSize: 13, letterSpacing: "0.01em" }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <NavBtn onClick={nextMonth}>
              <ChevronRight size={14} strokeWidth={2.5} />
            </NavBtn>
          </div>

          {/* Day-of-week labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  color: "var(--th-text-2)",
                  padding: "3px 0",
                  textTransform: "uppercase",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {cells.map((date, idx) => {
              if (!date) return <div key={idx} />;

              const disabled = date < today;
              const isToday = isSameDay(date, today);
              const isSel = !!selected && isSameDay(date, selected);

              return (
                <DayCell
                  key={idx}
                  day={date.getDate()}
                  disabled={disabled}
                  isToday={isToday}
                  isSelected={isSel}
                  onClick={() => pickDay(date)}
                />
              );
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid var(--th-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 28,
            }}
          >
            {selected ? (
              <>
                <span style={{ color: "var(--th-text-2)", fontSize: 11 }}>
                  {selected.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </span>
                <button
                  type="button"
                  onClick={() => { onChange(""); }}
                  style={{
                    color: "#ef4444", background: "none", border: "none",
                    fontSize: 11, cursor: "pointer", padding: 0,
                    transition: "opacity 0.14s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Clear
                </button>
              </>
            ) : (
              <span style={{ color: "var(--th-text-2)", fontSize: 11 }}>
                Select a date to set deadline
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function NavBtn({
  onClick,
  disabled = false,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 28, height: 28,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 7,
        border: "1px solid var(--th-border)",
        background: "var(--th-bg)",
        color: disabled ? "var(--th-border)" : "var(--th-text)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "border-color 0.14s, color 0.14s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = "var(--th-accent)";
          e.currentTarget.style.color = "var(--th-accent)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--th-border)";
        e.currentTarget.style.color = disabled ? "var(--th-border)" : "var(--th-text)";
      }}
    >
      {children}
    </button>
  );
}

function DayCell({
  day,
  disabled,
  isToday,
  isSelected,
  onClick,
}: {
  day: number;
  disabled: boolean;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  let bg = "transparent";
  if (isSelected) bg = "var(--th-accent)";
  else if (hovered && !disabled) bg = "color-mix(in srgb, var(--th-accent) 13%, transparent)";

  const color = isSelected
    ? "var(--th-accent-fg)"
    : disabled
    ? "var(--th-text-2)"
    : isToday
    ? "var(--th-accent)"
    : "var(--th-text)";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        border: isToday && !isSelected
          ? "1.5px solid var(--th-accent)"
          : "1.5px solid transparent",
        background: bg,
        color,
        fontSize: 12,
        fontWeight: isSelected || isToday ? 700 : 400,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        transition: "background 0.1s, color 0.1s",
        outline: "none",
        padding: 0,
      }}
    >
      {day}
    </button>
  );
}
