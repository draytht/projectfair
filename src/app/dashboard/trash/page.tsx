"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sounds } from "@/lib/sounds";
import { useConfirm } from "@/components/ConfirmDialog";

type TrashedProject = {
  id: string;
  name: string;
  description: string | null;
  courseCode: string | null;
  deletedAt: string | null;
  members: { user: { id: string; name: string } }[];
  tasks: { status: string }[];
};

type TrashedCourse = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  deletedAt: string | null;
  projects: { id: string; name: string }[];
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div style={{ fontSize: 48, margin: "0 auto 12px", opacity: 0.25 }}>🗑️</div>
      <p style={{ color: "var(--th-text-2)", fontSize: 14 }}>Trash is empty.</p>
      <p style={{ color: "var(--th-text-2)", fontSize: 12, marginTop: 4, opacity: 0.6 }}>Deleted projects and courses appear here.</p>
    </div>
  );
}

export default function TrashPage() {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [projects, setProjects] = useState<TrashedProject[]>([]);
  const [courses, setCourses] = useState<TrashedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trash")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.projects)) setProjects(d.projects);
        if (Array.isArray(d.courses)) setCourses(d.courses);
      })
      .finally(() => setLoading(false));
  }, []);

  async function restoreProject(id: string) {
    setWorking(id);
    const res = await fetch(`/api/trash/projects/${id}`, { method: "PATCH" });
    if (res.ok) { sounds.restore(); setProjects((prev) => prev.filter((p) => p.id !== id)); }
    setWorking(null);
  }

  async function permanentDeleteProject(id: string) {
    const name = projects.find((p) => p.id === id)?.name;
    const ok = await confirm({ title: "Permanently delete project?", message: "This cannot be undone. The project will be gone forever.", variant: "delete", confirmLabel: "Delete Forever", confirmText: name });
    if (!ok) return;
    setWorking(id);
    const res = await fetch(`/api/trash/projects/${id}`, { method: "DELETE" });
    if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== id));
    setWorking(null);
  }

  async function restoreCourse(id: string) {
    setWorking(id);
    const res = await fetch(`/api/trash/courses/${id}`, { method: "PATCH" });
    if (res.ok) { sounds.restore(); setCourses((prev) => prev.filter((c) => c.id !== id)); }
    setWorking(null);
  }

  async function permanentDeleteCourse(id: string) {
    const name = courses.find((c) => c.id === id)?.name;
    const ok = await confirm({ title: "Permanently delete course?", message: "This cannot be undone. The course and its data will be gone forever.", variant: "delete", confirmLabel: "Delete Forever", confirmText: name });
    if (!ok) return;
    setWorking(id);
    const res = await fetch(`/api/trash/courses/${id}`, { method: "DELETE" });
    if (res.ok) setCourses((prev) => prev.filter((c) => c.id !== id));
    setWorking(null);
  }

  const isEmpty = projects.length === 0 && courses.length === 0;

  return (
    <div className="max-w-3xl mx-auto">
      {dialog}
      {/* Back */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            color: "var(--th-text-2)", fontSize: 12, fontWeight: 600,
            letterSpacing: "0.03em", textTransform: "uppercase",
            padding: "7px 14px 7px 10px", borderRadius: 10,
            border: "1.5px solid var(--th-border)", background: "var(--th-card)",
            cursor: "pointer", transition: "color 0.18s, border-color 0.18s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--th-accent)"; e.currentTarget.style.borderColor = "var(--th-accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--th-text-2)"; e.currentTarget.style.borderColor = "var(--th-border)"; }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 2L3.5 6.5L8.5 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back
        </button>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
        <h2 className="nc-page-title" style={{ margin: 0 }}>Trash</h2>
      </div>
      <p style={{ color: "var(--th-text-2)", fontSize: 13, marginBottom: 28 }}>
        Deleted projects and courses. Restore them or permanently remove them.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 12, padding: 20, height: 80 }} className="nc-skeleton" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <p style={{ color: "var(--th-text-2)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                Projects ({projects.length})
              </p>
              <div className="space-y-3">
                {projects.map((p) => (
                  <TrashCard
                    key={p.id}
                    icon="project"
                    title={p.name}
                    subtitle={p.courseCode ?? undefined}
                    description={p.description ?? undefined}
                    meta={`${p.members.length} members · ${p.tasks.length} tasks`}
                    deletedAt={p.deletedAt ?? ""}
                    working={working === p.id}
                    onRestore={() => restoreProject(p.id)}
                    onDelete={() => permanentDeleteProject(p.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          {courses.length > 0 && (
            <div>
              <p style={{ color: "var(--th-text-2)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                Courses ({courses.length})
              </p>
              <div className="space-y-3">
                {courses.map((c) => (
                  <TrashCard
                    key={c.id}
                    icon="course"
                    title={c.name}
                    subtitle={c.code}
                    description={c.description ?? undefined}
                    meta={`${c.projects.length} linked project${c.projects.length !== 1 ? "s" : ""}`}
                    deletedAt={c.deletedAt ?? ""}
                    working={working === c.id}
                    onRestore={() => restoreCourse(c.id)}
                    onDelete={() => permanentDeleteCourse(c.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrashCard({
  icon, title, subtitle, description, meta, deletedAt,
  working, onRestore, onDelete,
}: {
  icon: "project" | "course";
  title: string;
  subtitle?: string;
  description?: string;
  meta: string;
  deletedAt: string;
  working: boolean;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 14, padding: "16px 20px" }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex gap-3 items-start">
          <div style={{ marginTop: 2, flexShrink: 0, opacity: 0.4 }}>
            {icon === "project" ? (
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="var(--th-text)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4.5A1.5 1.5 0 0 1 2.5 3H5l1.5 1.5H12.5A1.5 1.5 0 0 1 14 6v5.5A1.5 1.5 0 0 1 12.5 13h-10A1.5 1.5 0 0 1 1 11.5z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="var(--th-text)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.5 4C6 2.5 2 2.5 1 3v8.5c1-.5 5-.5 6.5 1 1.5-1.5 5.5-1.5 6.5-1V3c-1-.5-5-.5-6.5 1z" />
                <line x1="7.5" y1="4" x2="7.5" y2="12.5" />
              </svg>
            )}
          </div>
          <div>
            {subtitle && (
              <p style={{ color: "var(--th-accent)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
                {subtitle}
              </p>
            )}
            <h3 style={{ color: "var(--th-text)", fontSize: 14, fontWeight: 600, margin: 0 }}>{title}</h3>
            {description && (
              <p style={{ color: "var(--th-text-2)", fontSize: 12, marginTop: 3 }} className="line-clamp-1">{description}</p>
            )}
            <div className="flex gap-3 mt-2 flex-wrap">
              <span style={{ color: "var(--th-text-2)", fontSize: 11 }}>{meta}</span>
              {deletedAt && (
                <span style={{ color: "var(--th-text-2)", fontSize: 11, opacity: 0.6 }}>Deleted {timeAgo(deletedAt)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onRestore}
            disabled={working}
            style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: working ? "not-allowed" : "pointer", opacity: working ? 0.6 : 1 }}
          >
            ↩ Restore
          </button>
          <button
            onClick={onDelete}
            disabled={working}
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: working ? "not-allowed" : "pointer", opacity: working ? 0.6 : 1, transition: "background 0.14s" }}
            onMouseEnter={(e) => { if (!working) e.currentTarget.style.background = "rgba(239,68,68,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
          >
            Delete forever
          </button>
        </div>
      </div>
    </div>
  );
}
