"use client";

import { useState, useRef } from "react";
import Link from "next/link";

type CourseSummary = { id: string; name: string; code: string; projectCount: number };

interface Props {
  courses: CourseSummary[];
}

const SWIPE_THRESHOLD = 55;
const MAX_ROTATE = 10;

export function MobileCourseSlider({ courses }: Props) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);

  const startX = useRef(0);
  const startY = useRef(0);
  const lockAxis = useRef<"h" | "v" | null>(null);

  const canGoNext = index < courses.length - 1;
  const canGoPrev = index > 0;

  function flyOut(dir: "left" | "right") {
    if (exiting) return;
    const going = dir === "left" ? canGoNext : canGoPrev;
    if (!going) {
      setDragX(0);
      return;
    }
    setExiting(dir);
    setTimeout(() => {
      setIndex((i) => (dir === "left" ? i + 1 : i - 1));
      setDragX(0);
      setExiting(null);
    }, 310);
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    lockAxis.current = null;
    setIsDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (lockAxis.current === null) {
      lockAxis.current = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
    }

    if (lockAxis.current === "v") return;
    e.preventDefault();
    setDragX(dx);
  }

  function onTouchEnd() {
    setIsDragging(false);
    lockAxis.current = null;
    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      flyOut(dragX < 0 ? "left" : "right");
    } else {
      setDragX(0);
    }
  }

  if (courses.length === 0) return null;

  const current = courses[index];
  const nextCard = courses[index + 1];

  // Live card physics
  const liveDx = exiting === "left" ? -380 : exiting === "right" ? 380 : dragX;
  const rotate = liveDx * (MAX_ROTATE / 300);
  const liveOpacity = Math.max(0, 1 - Math.abs(liveDx) / 260);
  const isInTransit = exiting !== null;

  // Direction hint overlays
  const hintOpacity = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  const showLike = dragX > 12;   // swipe right = prev
  const showPass = dragX < -12;  // swipe left  = next

  return (
    <div>
      {/* Card stack area */}
      <div
        style={{
          position: "relative",
          height: 158,
          marginBottom: 14,
          touchAction: "pan-y",
        }}
      >
        {/* Behind card (peek) */}
        {nextCard && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              margin: "0 18px",
              background: "var(--th-bg)",
              border: "1px solid var(--th-border)",
              borderRadius: 18,
              transform: `scale(${0.92 + Math.min(Math.abs(liveDx) / 500, 0.08)})`,
              transition: isDragging ? "transform 0.08s" : "transform 0.3s ease",
              opacity: 0.65,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Main swipe card */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--th-bg)",
            border: "1px solid color-mix(in srgb, var(--th-accent) 22%, var(--th-border))",
            borderRadius: 18,
            padding: "20px 22px",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transform: `translateX(${liveDx}px) rotate(${rotate}deg)`,
            opacity: liveOpacity,
            transition: isDragging ? "none" : "transform 0.31s cubic-bezier(0.22,1,0.36,1), opacity 0.31s ease",
            boxShadow: `0 8px 28px color-mix(in srgb, var(--th-accent) 8%, transparent), 0 2px 8px color-mix(in srgb, #000 12%, transparent)`,
          }}
        >
          {/* ← PREV hint */}
          {showLike && canGoPrev && (
            <div style={{
              position: "absolute",
              top: 16,
              left: 18,
              border: "2px solid #22c55e",
              borderRadius: 8,
              padding: "2px 10px",
              opacity: hintOpacity,
              transform: `rotate(-${Math.min(Math.abs(rotate), 8)}deg)`,
              transition: "opacity 0.06s",
            }}>
              <span style={{ color: "#22c55e", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                ← PREV
              </span>
            </div>
          )}

          {/* NEXT → hint */}
          {showPass && canGoNext && (
            <div style={{
              position: "absolute",
              top: 16,
              right: 18,
              border: "2px solid #ef4444",
              borderRadius: 8,
              padding: "2px 10px",
              opacity: hintOpacity,
              transform: `rotate(${Math.min(Math.abs(rotate), 8)}deg)`,
              transition: "opacity 0.06s",
            }}>
              <span style={{ color: "#ef4444", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                NEXT →
              </span>
            </div>
          )}

          {/* Card content */}
          <Link
            href="/dashboard/courses"
            style={{ textDecoration: "none", flex: 1, display: "flex", flexDirection: "column" }}
            onClick={(e) => { if (isDragging || isInTransit) e.preventDefault(); }}
          >
            <div style={{ marginBottom: "auto" }}>
              <p style={{
                color: "var(--th-accent)",
                fontSize: "0.6875rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}>
                {current.code}
              </p>
              <p style={{
                color: "var(--th-text)",
                fontSize: "1rem",
                fontWeight: 700,
                lineHeight: 1.25,
                marginBottom: 10,
              }}>
                {current.name}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{
                background: "color-mix(in srgb, var(--th-accent) 10%, transparent)",
                color: "var(--th-accent)",
                border: "1px solid color-mix(in srgb, var(--th-accent) 20%, transparent)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 999,
              }}>
                {current.projectCount} project{current.projectCount !== 1 ? "s" : ""}
              </span>
              <span style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", fontWeight: 500 }}>
                {index + 1} / {courses.length}
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Dot indicators + tap arrows */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        {/* Prev button */}
        <button
          onClick={() => flyOut("right")}
          disabled={!canGoPrev || !!exiting}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid var(--th-border)",
            background: canGoPrev ? "var(--th-card)" : "transparent",
            color: canGoPrev ? "var(--th-text)" : "var(--th-border)",
            cursor: canGoPrev ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s, color 0.15s",
            flexShrink: 0,
          }}
          aria-label="Previous course"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Dots */}
        <div style={{ display: "flex", gap: 6 }}>
          {courses.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (exiting || i === index) return;
                const dir = i > index ? "left" : "right";
                // Jump directly without animation for distant taps
                setIndex(i);
                setDragX(0);
              }}
              style={{
                width: i === index ? 20 : 6,
                height: 6,
                borderRadius: 999,
                background: i === index ? "var(--th-accent)" : "var(--th-border)",
                border: "none",
                padding: 0,
                cursor: i === index ? "default" : "pointer",
                transition: "width 0.25s ease, background 0.2s",
              }}
              aria-label={`Go to course ${i + 1}`}
            />
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => flyOut("left")}
          disabled={!canGoNext || !!exiting}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid var(--th-border)",
            background: canGoNext ? "var(--th-card)" : "transparent",
            color: canGoNext ? "var(--th-text)" : "var(--th-border)",
            cursor: canGoNext ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s, color 0.15s",
            flexShrink: 0,
          }}
          aria-label="Next course"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
