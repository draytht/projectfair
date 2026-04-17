"use client";

import Link from "next/link";
import { MouseEvent, ReactNode, CSSProperties } from "react";

interface Props {
  href: string;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function CTAButton({ href, children, style, className }: Props) {
  function handleMouseDown(e: MouseEvent<HTMLAnchorElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.5;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    Object.assign(ripple.style, {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.18)",
      transform: "scale(0)",
      animation: "nc-ripple 0.55s cubic-bezier(0.4,0,0.2,1)",
      pointerEvents: "none",
    });

    el.appendChild(ripple);
    const removeRipple = () => ripple.remove();
    ripple.addEventListener("animationend", removeRipple, { once: true });
    ripple.addEventListener("animationcancel", removeRipple, { once: true });
    setTimeout(removeRipple, 700);
  }

  return (
    <Link
      href={href}
      onMouseDown={handleMouseDown}
      style={{ position: "relative", overflow: "hidden", ...style }}
      className={`nc-btn-3d ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}
