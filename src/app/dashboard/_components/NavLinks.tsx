"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useAnimation } from "framer-motion";

// ── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard() {
  // 2×2 grid — pops on hover
  return (
    <span className="nc-nav-icon nc-nav-icon-pop" style={{ width: 15, height: 15 }}>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
        <rect x="1"   y="1"   width="5.5" height="5.5" rx="1.2" />
        <rect x="8.5" y="1"   width="5.5" height="5.5" rx="1.2" />
        <rect x="1"   y="8.5" width="5.5" height="5.5" rx="1.2" />
        <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" />
      </svg>
    </span>
  );
}

function IconProfile() {
  // Person silhouette — bounces on hover
  return (
    <span className="nc-nav-icon nc-nav-icon-bounce" style={{ width: 15, height: 15 }}>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7.5" cy="4.5" r="2.5" />
        <path d="M2 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      </svg>
    </span>
  );
}

function IconProjects() {
  // Folder — wiggles on hover
  return (
    <span className="nc-nav-icon nc-nav-icon-wiggle" style={{ width: 15, height: 15 }}>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4.5A1.5 1.5 0 0 1 2.5 3H5l1.5 1.5H12.5A1.5 1.5 0 0 1 14 6v5.5A1.5 1.5 0 0 1 12.5 13h-10A1.5 1.5 0 0 1 1 11.5z" />
      </svg>
    </span>
  );
}

function IconCourses() {
  // Open book — spins on hover
  return (
    <span className="nc-nav-icon nc-nav-icon-spin" style={{ width: 15, height: 15 }}>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 4C6 2.5 2 2.5 1 3v8.5c1-.5 5-.5 6.5 1 1.5-1.5 5.5-1.5 6.5-1V3c-1-.5-5-.5-6.5 1z" />
        <line x1="7.5" y1="4" x2="7.5" y2="12.5" />
      </svg>
    </span>
  );
}

function IconPlan() {
  // Diamond gem — pops on hover
  return (
    <span className="nc-nav-icon nc-nav-icon-pop" style={{ width: 15, height: 15 }}>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="7.5,1.5 13.5,5.5 7.5,13.5 1.5,5.5" />
        <polyline points="1.5,5.5 7.5,7 13.5,5.5" />
        <line x1="7.5" y1="1.5" x2="7.5" y2="7" />
      </svg>
    </span>
  );
}

function ArchiveNavLink({ active }: { active: boolean }) {
  const controls = useAnimation();
  function handleMouseEnter() {
    controls.start({
      y: [0, -3, 0],
      transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
    });
  }
  return (
    <Link
      href="/dashboard/archive"
      title="Archive"
      className="nc-nav-link"
      style={active ? { color: "var(--th-accent)", background: "color-mix(in srgb, var(--th-accent) 12%, transparent)" } : {}}
      onMouseEnter={handleMouseEnter}
    >
      <motion.span
        className="nc-nav-icon"
        style={{ width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center" }}
        animate={controls}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3.5" width="13" height="2" rx="0.8" />
          <rect x="1.5" y="5.5" width="12" height="8" rx="1" />
          <line x1="5.5" y1="9.5" x2="9.5" y2="9.5" />
        </svg>
      </motion.span>
      <span className="nc-sidebar-reveal">Archive</span>
    </Link>
  );
}

function TrashNavLink({ active }: { active: boolean }) {
  const controls = useAnimation();
  function handleMouseEnter() {
    controls.start({
      rotate: [0, -9, 7, 0],
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    });
  }
  return (
    <Link
      href="/dashboard/trash"
      title="Trash"
      className="nc-nav-link"
      style={active ? { color: "var(--th-accent)", background: "color-mix(in srgb, var(--th-accent) 12%, transparent)" } : {}}
      onMouseEnter={handleMouseEnter}
    >
      <motion.span
        className="nc-nav-icon"
        style={{ width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center" }}
        animate={controls}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" y1="4" x2="13" y2="4" />
          <path d="M5.5 4V2.8h4V4" />
          <path d="M3.5 4l.7 8.5a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L11.5 4" />
          <line x1="6" y1="7" x2="6" y2="10.5" />
          <line x1="9" y1="7" x2="9" y2="10.5" />
        </svg>
      </motion.span>
      <span className="nc-sidebar-reveal">Trash</span>
    </Link>
  );
}

// ── NavLinks ─────────────────────────────────────────────────────────────────

export function NavLinks({ role }: { role: string }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function navLink(href: string, label: string, icon: React.ReactNode) {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        title={label}
        className="nc-nav-link"
        style={
          active
            ? {
                color: "var(--th-accent)",
                background: "color-mix(in srgb, var(--th-accent) 12%, transparent)",
              }
            : {}
        }
      >
        {icon}
        <span className="nc-sidebar-reveal">{label}</span>
      </Link>
    );
  }

  return (
    <>
      {navLink("/dashboard",          "Dashboard",   <IconDashboard />)}
      {navLink("/dashboard/profile",  "Profile",     <IconProfile />)}
      {navLink("/dashboard/courses",  "My Courses",  <IconCourses />)}
      {navLink("/dashboard/projects", "My Projects", <IconProjects />)}
      {navLink("/dashboard/plan",     "Plan",        <IconPlan />)}
      <ArchiveNavLink active={isActive("/dashboard/archive")} />
      <TrashNavLink  active={isActive("/dashboard/trash")} />
    </>
  );
}

// ── MobileNavLinks ────────────────────────────────────────────────────────────

export function MobileNavLinks({ role }: { role: string }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function mobileLink(href: string, label: string) {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        style={{ color: active ? "var(--th-accent)" : "var(--th-text-2)" }}
        className="text-sm font-medium px-3 py-2.5 rounded-lg hover:opacity-70 transition flex items-center min-h-[44px]"
      >
        {label}
      </Link>
    );
  }

  return (
    <>
      {mobileLink("/dashboard/courses",  "Courses")}
      {mobileLink("/dashboard/projects", "Projects")}
      {mobileLink("/dashboard/profile",  "Profile")}
      {mobileLink("/dashboard/plan",     "Plan")}
      {mobileLink("/dashboard/archive",  "Archive")}
      {mobileLink("/dashboard/trash",    "Trash")}
    </>
  );
}
