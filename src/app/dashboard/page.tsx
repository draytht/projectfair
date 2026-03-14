import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { ProBadge } from "@/components/ui/pro-badge";
import { MobileCourseSlider } from "./_components/MobileCourseSlider";

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect("/login");

  const displayName = dbUser.preferredName || dbUser.name;
  const role = dbUser.role;
  const isFirstLogin = Math.abs(dbUser.createdAt.getTime() - dbUser.updatedAt.getTime()) < 60_000;

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: { plan: true, status: true },
  });
  const isPro =
    subscription?.plan === "PRO" &&
    (subscription?.status === "active" || subscription?.status === "trialing");

  // Courses (all roles) — exclude soft-deleted
  const courses = await prisma.course.findMany({
    where: { ownerId: user.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { projects: { select: { id: true }, where: { deletedAt: null, archivedAt: null } } },
  });

  // ── Student / Team Leader ──────────────────────────────────────────────────
  if (role === "STUDENT" || role === "TEAM_LEADER") {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.id, project: { deletedAt: null, archivedAt: null } },
      include: { project: { include: { tasks: true, members: true } } },
      orderBy: { joinedAt: "desc" },
    });
    const projects = memberships.map((m) => m.project);

    const [assignedTasks, totalTasks, doneTasks, overdueTasks] = await Promise.all([
      prisma.task.findMany({
        where: { assigneeId: user.id, status: { not: "DONE" } },
        include: { project: { select: { id: true, name: true } } },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 8,
      }),
      prisma.task.count({ where: { assigneeId: user.id } }),
      prisma.task.count({ where: { assigneeId: user.id, status: "DONE" } }),
      prisma.task.count({
        where: { assigneeId: user.id, status: { not: "DONE" }, dueDate: { lt: new Date() } },
      }),
    ]);

    return (
      <Dashboard
        name={displayName}
        role={role}
        isPro={isPro ?? false}
        isFirstLogin={isFirstLogin}
        courses={courses.map((c) => ({ id: c.id, name: c.name, code: c.code, projectCount: c.projects.length }))}
        stats={[
          { label: "Projects", value: projects.length, href: "/dashboard/projects" },
          { label: "Courses", value: courses.length, href: "/dashboard/courses" },
          { label: "Tasks Done", value: doneTasks },
          { label: "Overdue", value: overdueTasks, warn: overdueTasks > 0 },
        ]}
        totalTasks={totalTasks}
        doneTasks={doneTasks}
        assignedTasks={assignedTasks.map((t) => ({
          id: t.id, title: t.title, status: t.status,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          project: t.project,
        }))}
        recentProjects={projects.slice(0, 5).map((p) => ({
          id: p.id, name: p.name, courseCode: p.courseCode,
          total: p.tasks.length,
          done: p.tasks.filter((t) => t.status === "DONE").length,
          members: p.members.length,
          href: `/dashboard/projects/${p.id}`,
        }))}
      />
    );
  }

  // ── Professor ──────────────────────────────────────────────────────────────
  if (role === "PROFESSOR") {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.id, project: { deletedAt: null, archivedAt: null } },
      include: { project: { include: { tasks: true, members: { include: { user: true } } } } },
    });
    const projects = memberships.map((m) => m.project);
    const totalStudents = new Set(
      projects.flatMap((p) => p.members.filter((m) => m.user.role === "STUDENT").map((m) => m.userId))
    ).size;
    const totalTasks = projects.reduce((s, p) => s + p.tasks.length, 0);
    const doneTasks = projects.reduce((s, p) => s + p.tasks.filter((t) => t.status === "DONE").length, 0);
    const avgCompletion = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    const projOverviews = projects.map((p) => ({
      id: p.id, name: p.name, courseCode: p.courseCode,
      overdue: p.tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE").length,
      total: p.tasks.length,
      done: p.tasks.filter((t) => t.status === "DONE").length,
      members: p.members.filter((m) => m.user.role === "STUDENT").length,
      href: `/dashboard/monitor/${p.id}`,
    }));
    const flagged = projOverviews.filter((p) => p.overdue > 0);

    return (
      <Dashboard
        name={displayName}
        role={role}
        isPro={isPro ?? false}
        isFirstLogin={isFirstLogin}
        courses={courses.map((c) => ({ id: c.id, name: c.name, code: c.code, projectCount: c.projects.length }))}
        stats={[
          { label: "Projects", value: projects.length, href: "/dashboard/projects" },
          { label: "Courses", value: courses.length, href: "/dashboard/courses" },
          { label: "Students", value: totalStudents },
          { label: "Avg. Done", value: `${avgCompletion}%` },
        ]}
        totalTasks={totalTasks}
        doneTasks={doneTasks}
        flagged={flagged}
        recentProjects={projOverviews.slice(0, 5)}
        assignedTasks={[]}
      />
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type StatItem = { label: string; value: number | string; warn?: boolean; href?: string };

type CourseSummary = { id: string; name: string; code: string; projectCount: number };

type TaskItem = {
  id: string; title: string; status: string;
  dueDate: string | null;
  project: { id: string; name: string };
};

type ProjectItem = {
  id: string; name: string; courseCode: string | null;
  total: number; done: number; members: number; href: string;
  overdue?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Unified Dashboard
// ─────────────────────────────────────────────────────────────────────────────

function Dashboard({
  name, role, isPro = false, isFirstLogin = false, courses, stats, totalTasks, doneTasks,
  assignedTasks = [], recentProjects = [], flagged = [],
}: {
  name: string;
  role: string;
  isPro?: boolean;
  isFirstLogin?: boolean;
  courses: CourseSummary[];
  stats: StatItem[];
  totalTasks: number;
  doneTasks: number;
  assignedTasks?: TaskItem[];
  recentProjects?: ProjectItem[];
  flagged?: ProjectItem[];
}) {
  const isProfessor = role === "PROFESSOR";
  const completionPct = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  const roleLabel = role === "TEAM_LEADER" ? "Team Leader" : role.charAt(0) + role.slice(1).toLowerCase();

  return (
    <div style={{ maxWidth: 1024, margin: "0 auto" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 20, padding: "28px 28px 24px", marginBottom: 24, position: "relative", overflow: "hidden" }}
        className="nc-hero-shine-wrap nc-u-in"
      >
        {/* Subtle radial glow */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, background: "radial-gradient(circle, color-mix(in srgb, var(--th-accent) 8%, transparent), transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ color: "var(--th-text-2)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              {isFirstLogin ? "Welcome to NoCarry" : "Welcome back"}
            </p>
            <h1 style={{ color: "var(--th-text)", fontSize: "1.625rem", fontWeight: 800, lineHeight: 1.15, marginBottom: 10 }}>
              {name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                background: "color-mix(in srgb, var(--th-accent) 12%, transparent)",
                color: "var(--th-accent)",
                border: "1px solid color-mix(in srgb, var(--th-accent) 25%, transparent)",
                fontSize: "0.6875rem", fontWeight: 700, padding: "3px 10px", borderRadius: 999, letterSpacing: "0.06em",
              }}>
                {roleLabel}
              </span>
              {isPro && <ProBadge size="md" />}
              {totalTasks > 0 && (
                <span style={{ color: "var(--th-text-2)", fontSize: "0.75rem" }}>
                  {completionPct}% of tasks complete
                </span>
              )}
            </div>
          </div>

          <div className="hidden md:flex" style={{ gap: 8, flexShrink: 0, alignItems: "flex-start" }}>
            <Link
              href="/dashboard/courses"
              className="text-sm px-4 py-2 rounded-lg hover:opacity-70 transition"
              style={{ border: "1px solid var(--th-border)", color: "var(--th-text-2)", textDecoration: "none" }}
            >
              My Courses
            </Link>
            <Link
              href={isProfessor ? "/dashboard/projects" : "/dashboard/projects/new"}
              className="nc-btn-3d text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-80 transition"
              style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", textDecoration: "none" }}
            >
              {isProfessor ? "My Projects →" : "+ New Project"}
            </Link>
          </div>
        </div>

        {/* Mini progress bar */}
        {totalTasks > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ background: "var(--th-border)", height: 3, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ background: "var(--th-accent)", width: `${completionPct}%`, height: 3, borderRadius: 999, transition: "width 0.6s" }} />
            </div>
            <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", marginTop: 4 }}>
              {doneTasks} of {totalTasks} tasks done across all projects
            </p>
          </div>
        )}
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12, marginBottom: 24 }}>
        {stats.map((s, i) => {
          const inner = (
            <div
              style={{
                background: "var(--th-card)",
                border: `1px solid ${s.warn ? "color-mix(in srgb, #ef4444 35%, var(--th-border))" : "var(--th-border)"}`,
                borderRadius: 14, padding: "18px 16px", textAlign: "center",
                animationDelay: `${0.05 + i * 0.06}s`,
                transition: "border-color 0.15s, transform 0.15s",
              }}
              className={`nc-u-in nc-card-lift ${s.warn ? "nc-warn-card" : ""}`}
            >
              <p
                style={{ color: s.warn ? "#ef4444" : "var(--th-accent)", fontSize: "2.25rem", fontWeight: 800, lineHeight: 1, animationDelay: `${0.1 + i * 0.06}s` }}
                className="nc-stat-num"
              >
                {typeof s.value === "number" ? <AnimatedCounter to={s.value} /> : s.value}
              </p>
              <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", marginTop: 6, letterSpacing: "0.04em" }}>
                {s.label}
              </p>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>{inner}</Link>
          ) : (
            <div key={s.label}>{inner}</div>
          );
        })}
      </div>

      {/* ── My Courses strip ──────────────────────────────────────────────── */}
      <div
        style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 16, padding: "20px 20px 18px", marginBottom: 24, animationDelay: "0.15s" }}
        className="nc-u-in"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ color: "var(--th-text)", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            My Courses
          </h2>
          <Link href="/dashboard/courses" style={{ color: "var(--th-accent)", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}
            className="hover:opacity-70 transition">
            {courses.length > 0 ? "View all →" : "Create one →"}
          </Link>
        </div>

        {courses.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem" }}>No courses yet.</p>
            <Link
              href="/dashboard/courses"
              style={{ color: "var(--th-accent)", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none", border: "1px solid var(--th-border)", padding: "4px 12px", borderRadius: 999 }}
              className="hover:opacity-70 transition"
            >
              + New Course
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile: Tinder-style swipe slider */}
            <div className="md:hidden">
              <MobileCourseSlider courses={courses} />
            </div>

            {/* Desktop: horizontal scroll */}
            <div className="hidden md:flex" style={{ gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {courses.map((c) => (
                <Link
                  key={c.id}
                  href="/dashboard/courses"
                  style={{
                    background: "var(--th-bg)", border: "1px solid var(--th-border)",
                    borderRadius: 12, padding: "12px 14px", textDecoration: "none",
                    flexShrink: 0, minWidth: 140, maxWidth: 180,
                    transition: "border-color 0.15s, transform 0.15s",
                    display: "block",
                  }}
                  className="nc-card-hover"
                >
                  <p style={{ color: "var(--th-accent)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                    {c.code}
                  </p>
                  <p style={{ color: "var(--th-text)", fontSize: "0.8125rem", fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>
                    {c.name}
                  </p>
                  <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem" }}>
                    {c.projectCount} project{c.projectCount !== 1 ? "s" : ""}
                  </p>
                </Link>
              ))}
              {/* Add course chip */}
              <Link
                href="/dashboard/courses"
                style={{
                  border: "1.5px dashed var(--th-border)", borderRadius: 12,
                  padding: "12px 14px", textDecoration: "none", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  minWidth: 100, transition: "border-color 0.15s, color 0.15s",
                  color: "var(--th-text-2)", fontSize: "0.75rem", fontWeight: 600,
                }}
                className="hover:opacity-70 transition"
              >
                + New
              </Link>
            </div>
          </>
        )}
      </div>

      {/* ── Bottom grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>

        {/* Left: Active tasks (student) or Needs Attention (professor) */}
        <div
          style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 16, padding: "20px", animationDelay: "0.18s" }}
          className="nc-u-in"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ color: "var(--th-text)", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {isProfessor ? "Needs Attention" : "Active Tasks"}
            </h2>
            {!isProfessor && (
              <span style={{ color: "var(--th-text-2)", fontSize: "0.75rem" }}>
                {assignedTasks.length} remaining
              </span>
            )}
          </div>

          {isProfessor ? (
            flagged.length === 0 ? (
              <EmptyState icon="✓" text="All projects on track" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {flagged.map((p, i) => (
                  <Link
                    key={p.id}
                    href={p.href}
                    style={{
                      background: "color-mix(in srgb, #ef4444 6%, var(--th-bg))",
                      border: "1px solid color-mix(in srgb, #ef4444 20%, var(--th-border))",
                      borderRadius: 10, padding: "10px 12px", textDecoration: "none",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                      animationDelay: `${0.22 + i * 0.04}s`,
                    }}
                    className="nc-u-in nc-row-slide"
                  >
                    <div style={{ minWidth: 0 }}>
                      {p.courseCode && <p style={{ color: "#ef4444", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>{p.courseCode}</p>}
                      <p style={{ color: "var(--th-text)", fontSize: "0.8125rem", fontWeight: 500 }} className="truncate">{p.name}</p>
                    </div>
                    <span style={{ color: "#f87171", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" }}>
                      {p.overdue} overdue
                    </span>
                  </Link>
                ))}
              </div>
            )
          ) : (
            assignedTasks.length === 0 ? (
              <EmptyState icon="✓" text="All caught up!" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {assignedTasks.map((task, i) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <Link
                      key={task.id}
                      href={`/dashboard/projects/${task.project.id}`}
                      style={{
                        background: "var(--th-bg)",
                        border: `1px solid ${isOverdue ? "color-mix(in srgb, #ef4444 25%, var(--th-border))" : "var(--th-border)"}`,
                        borderRadius: 10, padding: "10px 12px", textDecoration: "none",
                        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
                        animationDelay: `${0.22 + i * 0.04}s`,
                      }}
                      className="nc-u-in nc-row-slide"
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: "var(--th-text)", fontSize: "0.8125rem", fontWeight: 500 }} className="truncate">{task.title}</p>
                        <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", marginTop: 2 }} className="truncate">{task.project.name}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                        <StatusBadge status={task.status} />
                        {task.dueDate && (
                          <span style={{ color: isOverdue ? "#ef4444" : "var(--th-text-2)", fontSize: "0.625rem", whiteSpace: "nowrap" }}>
                            {isOverdue ? "Overdue" : fmtDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Right: Recent projects */}
        <div
          style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 16, padding: "20px", animationDelay: "0.22s" }}
          className="nc-u-in"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ color: "var(--th-text)", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {isProfessor ? "Project Progress" : "Recent Projects"}
            </h2>
            <Link
              href="/dashboard/projects"
              style={{ color: "var(--th-accent)", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}
              className="hover:opacity-70 transition"
            >
              View all →
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <EmptyState text="No projects yet.">
              <Link
                href={isProfessor ? "/dashboard/projects" : "/dashboard/projects/new"}
                style={{ color: "var(--th-accent)", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none", marginTop: 8, display: "inline-block" }}
              >
                {isProfessor ? "Create one →" : "+ Create your first"}
              </Link>
            </EmptyState>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentProjects.map((p, i) => {
                const pct = p.total === 0 ? 0 : Math.round((p.done / p.total) * 100);
                return (
                  <Link
                    key={p.id}
                    href={p.href}
                    style={{
                      background: "var(--th-bg)", border: "1px solid var(--th-border)",
                      borderRadius: 10, padding: "10px 12px", textDecoration: "none",
                      display: "block", animationDelay: `${0.26 + i * 0.05}s`,
                      transition: "border-color 0.15s, transform 0.15s",
                    }}
                    className="nc-u-in nc-card-lift"
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ minWidth: 0 }}>
                        {p.courseCode && (
                          <p style={{ color: "var(--th-accent)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
                            {p.courseCode}
                          </p>
                        )}
                        <p style={{ color: "var(--th-text)", fontSize: "0.8125rem", fontWeight: 600 }} className="truncate">{p.name}</p>
                      </div>
                      <span style={{ color: "var(--th-accent)", fontSize: "0.875rem", fontWeight: 800, flexShrink: 0, marginLeft: 8 }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{ background: "var(--th-border)", height: 3, borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ background: "var(--th-accent)", width: `${pct}%`, height: 3, borderRadius: 999 }} className="nc-bar-anim" />
                    </div>
                    <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", marginTop: 5 }}>
                      {p.done}/{p.total} tasks · {p.members} {isProfessor ? "student" : "member"}{p.members !== 1 ? "s" : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ icon, text, children }: { icon?: string; text: string; children?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 16px" }}>
      {icon && <p style={{ color: "var(--th-accent)", fontSize: "1.5rem", marginBottom: 8 }}>{icon}</p>}
      <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem" }}>{text}</p>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "IN_PROGRESS";
  return (
    <span style={{
      background: active ? "color-mix(in srgb, var(--th-accent) 12%, transparent)" : "var(--th-bg)",
      color: active ? "var(--th-accent)" : "var(--th-text-2)",
      border: "1px solid var(--th-border)",
      fontSize: "0.625rem", fontWeight: 600, padding: "2px 6px", borderRadius: 999, whiteSpace: "nowrap",
    }}>
      {active ? "In Progress" : "To Do"}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
