import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AnimatedCounter } from "@/components/AnimatedCounter";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect("/login");

  const displayName = dbUser.preferredName || dbUser.name;

  // ── Student dashboard data ────────────────────────────────────────────────
  if (dbUser.role === "STUDENT" || dbUser.role === "TEAM_LEADER") {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.id },
      include: {
        project: {
          include: { tasks: true, members: true },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const projects = memberships.map((m) => m.project);

    const assignedTasks = await prisma.task.findMany({
      where: { assigneeId: user.id, status: { not: "DONE" } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const totalTasks = await prisma.task.count({ where: { assigneeId: user.id } });
    const doneTasks = await prisma.task.count({ where: { assigneeId: user.id, status: "DONE" } });
    const overdueTasks = await prisma.task.count({
      where: {
        assigneeId: user.id,
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
      },
    });

    const recentProjects = projects.slice(0, 5);

    const stats = [
      { label: "Projects", value: projects.length },
      { label: "Assigned", value: totalTasks },
      { label: "Completed", value: doneTasks },
      { label: "Overdue", value: overdueTasks, warn: overdueTasks > 0 },
    ];

    return <StudentDashboard
      name={displayName}
      role={dbUser.role}
      stats={stats}
      assignedTasks={assignedTasks}
      recentProjects={recentProjects}
    />;
  }

  // ── Professor dashboard data ───────────────────────────────────────────────
  if (dbUser.role === "PROFESSOR") {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.id },
      include: {
        project: { include: { tasks: true, members: { include: { user: true } } } },
      },
    });

    const projects = memberships.map((m) => m.project);
    const totalStudents = new Set(
      projects.flatMap((p) => p.members.map((m) => m.userId))
    ).size;

    const totalTasks = projects.reduce((s, p) => s + p.tasks.length, 0);
    const doneTasks = projects.reduce((s, p) => s + p.tasks.filter((t) => t.status === "DONE").length, 0);
    const avgCompletion = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    const overdueCounts = projects.map((p) => ({
      id: p.id,
      name: p.name,
      courseCode: p.courseCode,
      overdue: p.tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
      ).length,
      total: p.tasks.length,
      done: p.tasks.filter((t) => t.status === "DONE").length,
      members: p.members.length,
    }));

    const flagged = overdueCounts.filter((p) => p.overdue > 0);
    const recentProjects = overdueCounts.slice(0, 6);

    const stats = [
      { label: "Projects", value: projects.length },
      { label: "Students", value: totalStudents },
      { label: "Avg. Done", value: `${avgCompletion}%` },
      { label: "Overdue", value: flagged.length, warn: flagged.length > 0 },
    ];

    return <ProfessorDashboard
      name={displayName}
      stats={stats}
      flagged={flagged}
      recentProjects={recentProjects}
    />;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Student dashboard
// ─────────────────────────────────────────────────────────────────────────────

type StatItem = { label: string; value: number | string; warn?: boolean };

type AssignedTask = {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  project: { id: string; name: string };
};

type ProjectSummary = {
  id: string;
  name: string;
  courseCode: string | null;
  tasks: { status: string; dueDate: Date | null }[];
  members: unknown[];
};

function StudentDashboard({
  name,
  role,
  stats,
  assignedTasks,
  recentProjects,
}: {
  name: string;
  role: string;
  stats: StatItem[];
  assignedTasks: AssignedTask[];
  recentProjects: ProjectSummary[];
}) {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <div
        style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
        className="nc-hero-shine-wrap nc-u-in rounded-2xl px-5 py-6 md:px-8 md:py-7 flex items-center justify-between"
      >
        <div>
          <p className="nc-label mb-2">Welcome back</p>
          <h1 className="nc-page-title">{name}</h1>
          <span
            style={{ background: "color-mix(in srgb, var(--th-accent) 15%, transparent)", color: "var(--th-accent)", border: "1px solid color-mix(in srgb, var(--th-accent) 30%, transparent)" }}
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mt-3 capitalize"
          >
            {role.toLowerCase().replace("_", " ")}
          </span>
        </div>
        <div className="hidden md:flex gap-3">
          <Link
            href="/dashboard/projects"
            style={{ border: "1px solid var(--th-border)", color: "var(--th-text-2)" }}
            className="text-sm px-4 py-2 rounded-lg hover:opacity-70 transition"
          >
            My Projects
          </Link>
          <Link
            href="/dashboard/projects/new"
            style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
            className="nc-btn-3d text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-80 transition"
          >
            + New Project
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              background: "var(--th-card)",
              border: `1px solid ${s.warn ? "#ef444455" : "var(--th-border)"}`,
              animationDelay: `${0.06 + i * 0.07}s`,
            }}
            className={`nc-u-in nc-card-lift rounded-xl p-5 text-center ${s.warn ? "nc-warn-card" : ""}`}
          >
            <p
              style={{ color: s.warn ? "#ef4444" : "var(--th-accent)", animationDelay: `${0.12 + i * 0.07}s` }}
              className="nc-stat-num text-4xl font-black leading-none"
            >
              {typeof s.value === "number"
                ? <AnimatedCounter to={s.value} />
                : s.value}
            </p>
            <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active tasks */}
        <div
          style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", animationDelay: "0.18s" }}
          className="nc-u-in rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="nc-section-title">Your Active Tasks</h2>
            <span style={{ color: "var(--th-text-2)" }} className="text-xs">{assignedTasks.length} remaining</span>
          </div>

          {assignedTasks.length === 0 ? (
            <div className="text-center py-10">
              <p style={{ color: "var(--th-accent)" }} className="text-2xl mb-2">✓</p>
              <p style={{ color: "var(--th-text-2)" }} className="text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedTasks.slice(0, 6).map((task, i) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                return (
                  <Link
                    key={task.id}
                    href={`/dashboard/projects/${task.project.id}`}
                    style={{
                      background: "var(--th-bg)",
                      border: `1px solid ${isOverdue ? "rgba(239,68,68,0.25)" : "var(--th-border)"}`,
                      animationDelay: `${0.22 + i * 0.05}s`,
                    }}
                    className="nc-u-in nc-row-slide flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 transition block"
                  >
                    <div className="min-w-0">
                      <p style={{ color: "var(--th-text)" }} className="text-sm font-medium truncate">{task.title}</p>
                      <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-0.5 truncate">{task.project.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        style={{
                          background: task.status === "IN_PROGRESS"
                            ? "color-mix(in srgb, var(--th-accent) 15%, transparent)"
                            : "var(--th-bg)",
                          color: task.status === "IN_PROGRESS" ? "var(--th-accent)" : "var(--th-text-2)",
                          border: "1px solid var(--th-border)",
                        }}
                        className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                      >
                        {task.status === "IN_PROGRESS" ? "In Progress" : "To Do"}
                      </span>
                      {task.dueDate && (
                        <span style={{ color: isOverdue ? "#ef4444" : "var(--th-text-2)" }} className="text-xs">
                          {isOverdue ? "Overdue" : new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
              {assignedTasks.length > 6 && (
                <p style={{ color: "var(--th-text-2)" }} className="text-xs text-center pt-1">
                  +{assignedTasks.length - 6} more tasks
                </p>
              )}
            </div>
          )}
        </div>

        {/* Recent projects */}
        <div
          style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", animationDelay: "0.22s" }}
          className="nc-u-in rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="nc-section-title">Recent Projects</h2>
            <Link href="/dashboard/projects" style={{ color: "var(--th-accent)" }} className="text-xs hover:opacity-70 transition">
              View all →
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="text-center py-10">
              <p style={{ color: "var(--th-text-2)" }} className="text-sm mb-3">No projects yet.</p>
              <Link
                href="/dashboard/projects/new"
                style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
                className="text-xs px-4 py-2 rounded-lg font-semibold hover:opacity-80 transition inline-block"
              >
                Create your first
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((p, i) => {
                const total = p.tasks.length;
                const done = p.tasks.filter((t) => t.status === "DONE").length;
                const pct = total === 0 ? 0 : Math.round((done / total) * 100);
                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/projects/${p.id}`}
                    style={{
                      background: "var(--th-bg)",
                      border: "1px solid var(--th-border)",
                      animationDelay: `${0.26 + i * 0.06}s`,
                    }}
                    className="nc-u-in nc-card-lift block rounded-lg px-3 py-3 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0">
                        {p.courseCode && (
                          <p style={{ color: "var(--th-accent)" }} className="text-xs font-medium uppercase tracking-widest leading-none mb-1">{p.courseCode}</p>
                        )}
                        <p style={{ color: "var(--th-text)" }} className="text-sm font-medium truncate">{p.name}</p>
                      </div>
                      <span style={{ color: "var(--th-accent)" }} className="text-sm font-bold shrink-0 ml-3">{pct}%</span>
                    </div>
                    <div style={{ background: "var(--th-border)" }} className="w-full h-1.5 rounded-full overflow-hidden">
                      <div style={{ background: "var(--th-accent)", width: `${pct}%` }} className="nc-bar-anim h-1.5 rounded-full" />
                    </div>
                    <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1.5">{done}/{total} tasks · {p.members.length} members</p>
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
// Professor dashboard
// ─────────────────────────────────────────────────────────────────────────────

type ProjOverview = {
  id: string;
  name: string;
  courseCode: string | null;
  overdue: number;
  total: number;
  done: number;
  members: number;
};

function ProfessorDashboard({
  name,
  stats,
  flagged,
  recentProjects,
}: {
  name: string;
  stats: StatItem[];
  flagged: ProjOverview[];
  recentProjects: ProjOverview[];
}) {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <div
        style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
        className="nc-hero-shine-wrap nc-u-in rounded-2xl px-5 py-6 md:px-8 md:py-7 flex items-center justify-between"
      >
        <div>
          <p className="nc-label mb-2">Welcome back</p>
          <h1 className="nc-page-title">{name}</h1>
          <span
            style={{ background: "color-mix(in srgb, var(--th-accent) 15%, transparent)", color: "var(--th-accent)", border: "1px solid color-mix(in srgb, var(--th-accent) 30%, transparent)" }}
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mt-3"
          >
            Professor
          </span>
        </div>
        <Link
          href="/dashboard/courses"
          style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
          className="nc-btn-3d hidden md:block text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-80 transition"
        >
          My Courses →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              background: "var(--th-card)",
              border: `1px solid ${s.warn ? "#ef444455" : "var(--th-border)"}`,
              animationDelay: `${0.06 + i * 0.07}s`,
            }}
            className={`nc-u-in nc-card-lift rounded-xl p-5 text-center ${s.warn ? "nc-warn-card" : ""}`}
          >
            <p
              style={{ color: s.warn ? "#ef4444" : "var(--th-accent)", animationDelay: `${0.12 + i * 0.07}s` }}
              className="nc-stat-num text-4xl font-black leading-none"
            >
              {typeof s.value === "number"
                ? <AnimatedCounter to={s.value} />
                : s.value}
            </p>
            <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Flagged projects */}
        <div
          style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", animationDelay: "0.18s" }}
          className="nc-u-in rounded-xl p-5"
        >
          <h2 className="nc-section-title mb-4">
            Needs Attention
          </h2>
          {flagged.length === 0 ? (
            <div className="text-center py-10">
              <p style={{ color: "var(--th-accent)" }} className="text-2xl mb-2">✓</p>
              <p style={{ color: "var(--th-text-2)" }} className="text-sm">All projects on track</p>
            </div>
          ) : (
            <div className="space-y-2">
              {flagged.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/dashboard/monitor/${p.id}`}
                  className="nc-warn-card nc-row-slide flex items-center justify-between rounded-lg px-3 py-2.5 transition block"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    animationDelay: `${0.22 + i * 0.05}s`,
                  }}
                >
                  <div className="min-w-0">
                    {p.courseCode && <p style={{ color: "#ef4444" }} className="text-xs font-medium uppercase tracking-widest leading-none mb-0.5">{p.courseCode}</p>}
                    <p style={{ color: "var(--th-text)" }} className="text-sm font-medium truncate">{p.name}</p>
                  </div>
                  <span className="text-xs text-red-400 font-semibold shrink-0 ml-3 whitespace-nowrap">
                    {p.overdue} overdue
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* All projects progress */}
        <div
          style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", animationDelay: "0.22s" }}
          className="nc-u-in rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="nc-section-title">Project Progress</h2>
            <Link href="/dashboard/courses" style={{ color: "var(--th-accent)" }} className="text-xs hover:opacity-70 transition">
              View all →
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <p style={{ color: "var(--th-text-2)" }} className="text-sm text-center py-10">No projects yet.</p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((p, i) => {
                const pct = p.total === 0 ? 0 : Math.round((p.done / p.total) * 100);
                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/monitor/${p.id}`}
                    style={{
                      background: "var(--th-bg)",
                      border: "1px solid var(--th-border)",
                      animationDelay: `${0.26 + i * 0.06}s`,
                    }}
                    className="nc-u-in nc-card-lift block rounded-lg px-3 py-3 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="min-w-0">
                        {p.courseCode && (
                          <p style={{ color: "var(--th-accent)" }} className="text-xs font-medium uppercase tracking-widest leading-none mb-0.5">{p.courseCode}</p>
                        )}
                        <p style={{ color: "var(--th-text)" }} className="text-sm font-medium truncate">{p.name}</p>
                      </div>
                      <span style={{ color: "var(--th-accent)" }} className="text-sm font-bold shrink-0 ml-3">{pct}%</span>
                    </div>
                    <div style={{ background: "var(--th-border)" }} className="w-full h-1.5 rounded-full overflow-hidden">
                      <div style={{ background: "var(--th-accent)", width: `${pct}%` }} className="nc-bar-anim h-1.5 rounded-full" />
                    </div>
                    <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1.5">{p.done}/{p.total} tasks · {p.members} members</p>
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
