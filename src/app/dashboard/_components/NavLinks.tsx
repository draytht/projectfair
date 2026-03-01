"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
      {navLink("/dashboard",         "Dashboard",  <IconDashboard />)}
      {navLink("/dashboard/profile", "Profile",    <IconProfile />)}
      {role === "STUDENT"     && navLink("/dashboard/projects", "My Projects", <IconProjects />)}
      {role === "PROFESSOR"   && navLink("/dashboard/courses",  "My Courses",  <IconCourses />)}
      {role === "TEAM_LEADER" && navLink("/dashboard/projects", "My Projects", <IconProjects />)}
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
      {role === "STUDENT"     && mobileLink("/dashboard/projects", "Projects")}
      {role === "PROFESSOR"   && mobileLink("/dashboard/courses",  "Courses")}
      {role === "TEAM_LEADER" && mobileLink("/dashboard/projects", "Projects")}
      {mobileLink("/dashboard/profile", "Profile")}
    </>
  );
}
