"use client";

import { motion } from "framer-motion";

export function ProBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const isMd = size === "md";
  return (
    <motion.span
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      //transition={{ type: "spring", stiffness: 340, damping: 22 }}
      transition={{ type: "tween", ease: "easeOut", duration: 1.2 }}
      className="nc-pro-badge"
      title="Pro plan"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isMd ? 4 : 3,
        fontSize: isMd ? 10 : 8,
        fontWeight: 800,
        padding: isMd ? "3px 9px" : "1px 6px",
        borderRadius: 99,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#78350f",
        flexShrink: 0,
        userSelect: "none",
        cursor: "default",
        lineHeight: 1.6,
      }}
    >
      {/* Diamond icon */}
      <svg
        width={isMd ? 8 : 6}
        height={isMd ? 8 : 6}
        viewBox="0 0 8 8"
        fill="currentColor"
        style={{ flexShrink: 0 }}
      >
        <polygon points="4,0 8,3 4,8 0,3" />
      </svg>
      PRO
    </motion.span>
  );
}
