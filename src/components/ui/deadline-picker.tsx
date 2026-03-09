"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X } from "lucide-react";

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

// Parse value: supports "YYYY-MM-DD", "YYYY-MM-DDTHH:MM", or ""
function parseValue(value: string): { date: Date | undefined; hour: number; minute: number } {
  if (!value) return { date: undefined, hour: 23, minute: 59 };
  const [datePart, timePart] = value.split("T");
  const date = datePart ? new Date(datePart + "T00:00:00") : undefined;
  if (timePart) {
    const [h, m] = timePart.split(":").map(Number);
    return { date, hour: isNaN(h) ? 23 : h, minute: isNaN(m) ? 59 : m };
  }
  return { date, hour: 23, minute: 59 };
}

function buildValue(date: Date, hour: number, minute: number): string {
  const d = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  const t = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return `${d}T${t}`;
}

interface DeadlinePickerProps {
  value: string;        // "YYYY-MM-DD", "YYYY-MM-DDTHH:MM", or ""
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

  const parsed = parseValue(value);
  const selected = parsed.date;

  const [viewYear, setViewYear] = useState((selected ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((selected ?? today).getMonth());
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);

  // Sync view when external value changes
  useEffect(() => {
    const p = parseValue(value);
    if (p.date) {
      setViewYear(p.date.getFullYear());
      setViewMonth(p.date.getMonth());
    }
    setHour(p.hour);
    setMinute(p.minute);
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
    // Select date but keep open for time selection
    onChange(buildValue(date, hour, minute));
  }

  function updateTime(newHour: number, newMinute: number) {
    if (!selected) return;
    setHour(newHour);
    setMinute(newMinute);
    onChange(buildValue(selected, newHour, newMinute));
  }

  function clearDate(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  const cells = buildGrid(viewYear, viewMonth);

  // Display label
  const displayLabel = selected
    ? (() => {
        const dateStr = selected.toLocaleDateString(undefined, {
          weekday: "short", month: "short", day: "numeric", year: "numeric",
        });
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        const ampm = hour < 12 ? "AM" : "PM";
        return `${dateStr} at ${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
      })()
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

          {/* ── Time picker ── */}
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid var(--th-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--th-text-2)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                Time
              </span>
              {!selected && (
                <span style={{ color: "var(--th-text-2)", fontSize: 10, opacity: 0.6 }}>
                  Select a date first
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: selected ? 1 : 0.35, pointerEvents: selected ? "auto" : "none" }}>
              {/* Hour stepper */}
              <TimeStepper
                value={hour}
                min={0}
                max={23}
                display={String(hour % 12 === 0 ? 12 : hour % 12).padStart(2, "0")}
                onIncrement={() => updateTime((hour + 1) % 24, minute)}
                onDecrement={() => updateTime((hour + 23) % 24, minute)}
              />

              <span style={{ color: "var(--th-text)", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>:</span>

              {/* Minute stepper */}
              <TimeStepper
                value={minute}
                min={0}
                max={59}
                display={String(minute).padStart(2, "0")}
                onIncrement={() => updateTime(hour, (minute + 1) % 60)}
                onDecrement={() => updateTime(hour, (minute + 59) % 60)}
              />

              {/* AM/PM toggle */}
              <button
                type="button"
                onClick={() => updateTime(hour < 12 ? hour + 12 : hour - 12, minute)}
                style={{
                  marginLeft: 2,
                  padding: "4px 10px",
                  borderRadius: 8,
                  border: "1.5px solid var(--th-border)",
                  background: "var(--th-bg)",
                  color: "var(--th-text)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transition: "border-color 0.14s, color 0.14s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--th-accent)";
                  e.currentTarget.style.color = "var(--th-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--th-border)";
                  e.currentTarget.style.color = "var(--th-text)";
                }}
              >
                {hour < 12 ? "AM" : "PM"}
              </button>

              {/* Done button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  marginLeft: "auto",
                  padding: "4px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--th-accent)",
                  color: "var(--th-accent-fg)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity 0.14s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Done
              </button>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 10,
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
                  {" · "}
                  {String(hour % 12 === 0 ? 12 : hour % 12).padStart(2, "0")}:{String(minute).padStart(2, "0")} {hour < 12 ? "AM" : "PM"}
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

/* ── TimeStepper ── */

function TimeStepper({
  display,
  onIncrement,
  onDecrement,
}: {
  value: number;
  min: number;
  max: number;
  display: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <button
        type="button"
        onClick={onIncrement}
        style={stepBtnStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--th-accent)";
          e.currentTarget.style.color = "var(--th-accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--th-border)";
          e.currentTarget.style.color = "var(--th-text)";
        }}
      >
        <ChevronUp size={11} strokeWidth={2.5} />
      </button>

      <div
        style={{
          width: 40,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--th-bg)",
          border: "1.5px solid var(--th-border)",
          borderRadius: 8,
          color: "var(--th-text)",
          fontSize: 14,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {display}
      </div>

      <button
        type="button"
        onClick={onDecrement}
        style={stepBtnStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--th-accent)";
          e.currentTarget.style.color = "var(--th-accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--th-border)";
          e.currentTarget.style.color = "var(--th-text)";
        }}
      >
        <ChevronDown size={11} strokeWidth={2.5} />
      </button>
    </div>
  );
}

const stepBtnStyle: React.CSSProperties = {
  width: 24,
  height: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 5,
  border: "1px solid var(--th-border)",
  background: "var(--th-bg)",
  color: "var(--th-text)",
  cursor: "pointer",
  transition: "border-color 0.14s, color 0.14s",
  padding: 0,
};

/* ── NavBtn ── */

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

/* ── DayCell ── */

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
