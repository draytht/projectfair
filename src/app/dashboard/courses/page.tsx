"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type ProjectStub = {
  id: string;
  name: string;
  courseCode: string | null;
  members: { user: { id: string; name: string } }[];
  tasks: { status: string }[];
};

type Course = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
  projects: ProjectStub[];
};

// ── Shared Modal shell ────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 18, padding: "28px 28px 24px", width: "100%", maxWidth: 460, boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ color: "var(--th-text)", fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--th-text-2)", fontSize: 20, lineHeight: 1, padding: "2px 6px", borderRadius: 6 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: "var(--th-text-2)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <p style={{ color: "var(--th-text-2)", fontSize: 11, marginTop: 4, opacity: 0.75 }}>{hint}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "var(--th-bg)", border: "1.5px solid var(--th-border)",
  color: "var(--th-text)", borderRadius: 10, padding: "9px 12px",
  fontSize: 14, outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

// ── Create Course modal ────────────────────────────────────────────────────────

function CreateCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Course) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) { setError("Course name is required."); return; }
    if (!code.trim()) { setError("Course code is required."); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, description }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong."); setSaving(false); return; }
    onCreated({ ...data, projects: data.projects ?? [] });
  }

  return (
    <Modal title="Create Course" onClose={onClose}>
      {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 14 }}>{error}</p>}
      <Field label="Course Name *">
        <input style={inputStyle} placeholder="e.g. Software Engineering" value={name} onChange={(e) => setName(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--th-accent)")} onBlur={(e) => (e.target.style.borderColor = "var(--th-border)")} />
      </Field>
      <Field label="Course Code *" hint="Students use this code to link their projects to your course.">
        <input style={inputStyle} placeholder="e.g. CS401" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
          onFocus={(e) => (e.target.style.borderColor = "var(--th-accent)")} onBlur={(e) => (e.target.style.borderColor = "var(--th-border)")} />
      </Field>
      <Field label="Description">
        <textarea style={{ ...inputStyle, resize: "none" }} rows={3} placeholder="What is this course about?" value={description} onChange={(e) => setDescription(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--th-accent)")} onBlur={(e) => (e.target.style.borderColor = "var(--th-border)")} />
      </Field>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={onClose}
          className="text-sm py-2 rounded-lg hover:opacity-70 transition cursor-pointer"
          style={{ flex: 1, border: "1px solid var(--th-border)", color: "var(--th-text-2)", background: "none" }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="nc-btn-3d text-sm py-2 rounded-lg font-semibold hover:opacity-80 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ flex: 2, background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none" }}
        >
          {saving ? "Creating…" : "Create Course"}
        </button>
      </div>
    </Modal>
  );
}

// ── Link project modal ────────────────────────────────────────────────────────

function LinkProjectModal({
  courseId,
  courseName,
  unlinkedProjects,
  onClose,
  onLinked,
}: {
  courseId: string;
  courseName: string;
  unlinkedProjects: ProjectStub[];
  onClose: () => void;
  onLinked: (projectId: string, courseId: string) => void;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!selectedProjectId) { setError("Please select a project."); return; }
    setSaving(true); setError("");
    const res = await fetch(`/api/projects/${selectedProjectId}/course`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to link project."); setSaving(false); return; }
    onLinked(selectedProjectId, courseId);
  }

  return (
    <Modal title={`Link project to ${courseName}`} onClose={onClose}>
      {unlinkedProjects.length === 0 ? (
        <p style={{ color: "var(--th-text-2)", fontSize: 13, marginBottom: 20 }}>
          All your projects are already linked to a course.
        </p>
      ) : (
        <>
          {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 14 }}>{error}</p>}
          <Field label="Select a project">
            <select
              style={selectStyle}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "var(--th-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--th-border)")}
            >
              <option value="">— choose a project —</option>
              {unlinkedProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
        </>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={onClose}
          className="text-sm py-2 rounded-lg hover:opacity-70 transition cursor-pointer"
          style={{ flex: 1, border: "1px solid var(--th-border)", color: "var(--th-text-2)", background: "none" }}
        >
          Cancel
        </button>
        {unlinkedProjects.length > 0 && (
          <button
            onClick={submit}
            disabled={saving}
            className="nc-btn-3d text-sm py-2 rounded-lg font-semibold hover:opacity-80 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ flex: 2, background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none" }}
          >
            {saving ? "Linking…" : "Link Project"}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ── Move to course modal ──────────────────────────────────────────────────────

function MoveProjectModal({
  project,
  courses,
  onClose,
  onMoved,
}: {
  project: ProjectStub;
  courses: Course[];
  onClose: () => void;
  onMoved: (projectId: string, targetCourseId: string | null) => void;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true); setError("");
    const targetCourseId = selectedCourseId || null;
    const res = await fetch(`/api/projects/${project.id}/course`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: targetCourseId }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Failed."); setSaving(false); return; }
    onMoved(project.id, targetCourseId);
  }

  return (
    <Modal title={`Move "${project.name}"`} onClose={onClose}>
      {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 14 }}>{error}</p>}
      <Field label="Move to course" hint="Leave blank to unlink from all courses.">
        <select
          style={selectStyle}
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--th-accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--th-border)")}
        >
          <option value="">— unlink (no course) —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
          ))}
        </select>
      </Field>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={onClose}
          className="text-sm py-2 rounded-lg hover:opacity-70 transition cursor-pointer"
          style={{ flex: 1, border: "1px solid var(--th-border)", color: "var(--th-text-2)", background: "none" }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="nc-btn-3d text-sm py-2 rounded-lg font-semibold hover:opacity-80 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ flex: 2, background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none" }}
        >
          {saving ? "Moving…" : "Confirm"}
        </button>
      </div>
    </Modal>
  );
}

// ── Mini project card (inside course) ────────────────────────────────────────

function MiniProjectCard({ project, isProfessor }: { project: ProjectStub; isProfessor?: boolean }) {
  const done = project.tasks.filter((t) => t.status === "DONE").length;
  const total = project.tasks.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const href = isProfessor ? `/dashboard/monitor/${project.id}` : `/dashboard/projects/${project.id}`;

  return (
    <Link
      href={href}
      style={{
        background: "var(--th-bg)",
        border: "1px solid var(--th-border)",
        borderRadius: 12,
        padding: "14px 14px 12px",
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        minHeight: 110,
        transition: "border-color 0.15s, transform 0.15s",
      }}
      className="nc-card-hover group"
    >
      <p style={{ color: "var(--th-text)", fontSize: "0.8125rem", fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>
        {project.name}
      </p>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <span style={{ color: "var(--th-text-2)", fontSize: "0.6875rem" }}>{project.members.length} members</span>
        <span style={{ color: "var(--th-accent)", fontSize: "0.6875rem", fontWeight: 600 }}>{progress}% done</span>
      </div>
      <div style={{ background: "var(--th-border)", width: "100%", height: 2, borderRadius: 999 }}>
        <div style={{ background: "var(--th-accent)", width: `${progress}%`, height: 2, borderRadius: 999, transition: "width 0.4s" }} />
      </div>
      <p style={{ color: "var(--th-accent)", fontSize: "0.6875rem", fontWeight: 600, marginTop: 8, opacity: 0 }} className="group-hover:opacity-100 transition-opacity">
        Open →
      </p>
    </Link>
  );
}

// ── Unlinked project card ─────────────────────────────────────────────────────

function UnlinkedCard({ project, onMove }: { project: ProjectStub; onMove: (p: ProjectStub) => void }) {
  const [hovered, setHovered] = useState(false);
  const done = project.tasks.filter((t) => t.status === "DONE").length;
  const total = project.tasks.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--th-card)",
        border: `1px solid ${hovered ? "color-mix(in srgb, var(--th-accent) 30%, var(--th-border))" : "var(--th-border)"}`,
        borderRadius: 14,
        padding: "16px 16px 14px",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "border-color 0.15s, transform 0.18s cubic-bezier(0.16,1,0.3,1)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        minHeight: 140,
      }}
    >
      <p style={{ color: "var(--th-text-2)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
        Unlinked
      </p>
      <p style={{ color: "var(--th-text)", fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>
        {project.name}
      </p>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <span style={{ color: "var(--th-text-2)", fontSize: "0.6875rem" }}>{project.members.length} members</span>
        <span style={{ color: "var(--th-accent)", fontSize: "0.6875rem", fontWeight: 600 }}>{progress}%</span>
      </div>
      <div style={{ background: "var(--th-border)", width: "100%", height: 2, borderRadius: 999, marginBottom: 10 }}>
        <div style={{ background: "var(--th-accent)", width: `${progress}%`, height: 2, borderRadius: 999 }} />
      </div>
      <button
        onClick={() => onMove(project)}
        style={{
          background: "none",
          border: "1px solid var(--th-border)",
          color: "var(--th-accent)",
          fontSize: "0.6875rem",
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: 999,
          cursor: "pointer",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(4px)",
          transition: "opacity 0.15s, transform 0.18s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        Move to course →
      </button>
    </div>
  );
}

// ── Course accordion ──────────────────────────────────────────────────────────

function CourseAccordion({
  course,
  unlinkedProjects,
  isProfessor,
  onLinkProject,
  onDelete,
}: {
  course: Course;
  unlinkedProjects: ProjectStub[];
  isProfessor: boolean;
  onLinkProject: (courseId: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete course "${course.name}"? It will be moved to Trash and can be restored.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
    if (res.ok) onDelete(course.id);
    else setDeleting(false);
  }

  return (
    <div
      style={{
        background: "var(--th-card)",
        border: "1px solid var(--th-border)",
        borderRadius: 16,
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          textAlign: "left",
        }}
      >
        {/* Top accent strip */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--th-accent), transparent)", opacity: 0.35, pointerEvents: "none" }} />

        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 12 12"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: "var(--th-text-2)", flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          <polyline points="4 2 8 6 4 10" />
        </svg>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "var(--th-text)", fontSize: "0.9375rem", fontWeight: 700 }}>{course.name}</span>
            <span style={{
              color: "var(--th-accent)", fontSize: "0.6875rem", fontWeight: 700,
              background: "color-mix(in srgb, var(--th-accent) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--th-accent) 22%, transparent)",
              padding: "2px 8px", borderRadius: 999, letterSpacing: "0.06em",
            }}>{course.code}</span>
          </div>
          {course.description && (
            <p style={{ color: "var(--th-text-2)", fontSize: "0.75rem", marginTop: 2, lineHeight: 1.4 }}>{course.description}</p>
          )}
        </div>

        <span style={{ color: "var(--th-text-2)", fontSize: "0.75rem", flexShrink: 0, marginLeft: "auto" }}>
          {course.projects.length} project{course.projects.length !== 1 ? "s" : ""}
        </span>
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--th-border)" }}>
          {course.projects.length === 0 ? (
            <div style={{ padding: "24px 0 8px", textAlign: "center" }}>
              <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", marginBottom: 12 }}>No projects linked to this course yet.</p>
              <button
                onClick={() => onLinkProject(course.id)}
                className="nc-btn-3d text-xs px-3 py-1.5 rounded-lg font-semibold hover:opacity-80 transition cursor-pointer"
                style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none" }}
              >
                + Link a project
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" style={{ marginTop: 16, alignItems: "stretch" }}>
                {course.projects.map((p) => (
                  <MiniProjectCard key={p.id} project={p} isProfessor={isProfessor} />
                ))}
              </div>
              {unlinkedProjects.length > 0 && (
                <button
                  onClick={() => onLinkProject(course.id)}
                  style={{
                    marginTop: 12, background: "none",
                    border: "1px dashed var(--th-border)", color: "var(--th-text-2)",
                    fontSize: "0.75rem", fontWeight: 600, padding: "7px 14px",
                    borderRadius: 10, cursor: "pointer", display: "block",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.borderColor = "var(--th-accent)"; (e.target as HTMLButtonElement).style.color = "var(--th-accent)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.borderColor = "var(--th-border)"; (e.target as HTMLButtonElement).style.color = "var(--th-text-2)"; }}
                >
                  + Link another project
                </button>
              )}
            </>
          )}

          {/* Delete course */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--th-border)", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                background: "none",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444",
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 8,
                cursor: deleting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: deleting ? 0.5 : 1,
                transition: "background 0.14s, border-color 0.14s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="2" y1="4" x2="13" y2="4" /><path d="M5.5 4V2.8h4V4" /><path d="M3.5 4l.7 8.5a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L11.5 4" />
              </svg>
              {deleting ? "Moving to Trash…" : "Move to Trash"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type PlanData = { plan: "FREE" | "PRO"; limits: { courses: number }; usage: { courses: number } };

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allUserProjects, setAllUserProjects] = useState<ProjectStub[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfessor, setIsProfessor] = useState(false);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [linkingCourseId, setLinkingCourseId] = useState<string | null>(null);
  const [movingProject, setMovingProject] = useState<ProjectStub | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.ok ? r.json() : []),
      fetch("/api/projects").then((r) => r.ok ? r.json() : []),
      fetch("/api/auth/me").then((r) => r.ok ? r.json() : null),
      fetch("/api/stripe/plan").then((r) => r.ok ? r.json() : null),
    ]).then(([c, p, me, plan]) => {
      setCourses(Array.isArray(c) ? c : []);
      setAllUserProjects(Array.isArray(p) ? p : []);
      if (me?.role === "PROFESSOR") setIsProfessor(true);
      if (plan) setPlanData(plan);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handleCourseCreated(course: Course) {
    setCourses((prev) => [...prev, course]);
    setShowNewCourse(false);
  }

  function handleProjectLinked(projectId: string, targetCourseId: string) {
    const project = allUserProjects.find((p) => p.id === projectId);
    if (!project) return;

    // Remove from other courses (if it was in one)
    setCourses((prev) => prev.map((c) => ({
      ...c,
      projects: c.id === targetCourseId
        ? [...c.projects.filter((p) => p.id !== projectId), project]
        : c.projects.filter((p) => p.id !== projectId),
    })));
    setLinkingCourseId(null);
    setMovingProject(null);
  }

  function handleProjectMoved(projectId: string, targetCourseId: string | null) {
    const project = allUserProjects.find((p) => p.id === projectId)
      || courses.flatMap((c) => c.projects).find((p) => p.id === projectId);
    if (!project) return;

    setCourses((prev) => prev.map((c) => ({
      ...c,
      projects: c.id === targetCourseId
        ? [...c.projects.filter((p) => p.id !== projectId), project]
        : c.projects.filter((p) => p.id !== projectId),
    })));
    setMovingProject(null);
  }

  if (loading) return <p style={{ color: "var(--th-text-2)" }} className="text-sm p-8">Loading…</p>;

  // Projects not yet linked to any of the user's courses
  const linkedProjectIds = new Set(courses.flatMap((c) => c.projects.map((p) => p.id)));
  const unlinkedProjects = allUserProjects.filter((p) => !linkedProjectIds.has(p.id));

  const linkingCourse = courses.find((c) => c.id === linkingCourseId) ?? null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
        <div>
          <h2 className="nc-page-title">My Courses</h2>
          <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
            {courses.length} course{courses.length !== 1 ? "s" : ""} · {linkedProjectIds.size} linked project{linkedProjectIds.size !== 1 ? "s" : ""}
          </p>
        </div>
        {planData && planData.usage.courses >= planData.limits.courses ? (
          <Link
            href="/dashboard/plan"
            title={`${planData.plan === "FREE" ? "Upgrade to Pro" : "Plan limit reached"} — ${planData.usage.courses}/${planData.limits.courses} courses used`}
            className="text-sm px-4 py-2 rounded-lg font-semibold transition"
            style={{ background: "var(--th-border)", color: "var(--th-text-2)", textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            {planData.plan === "FREE" ? "Upgrade for more" : "Limit reached"}
          </Link>
        ) : (
          <button
            onClick={() => setShowNewCourse(true)}
            className="nc-btn-3d text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-80 transition active:scale-95 cursor-pointer"
            style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none", flexShrink: 0 }}
          >
            + New Course
          </button>
        )}
      </div>

      {/* Empty state */}
      {courses.length === 0 && (
        <div style={{ textAlign: "center", padding: "96px 24px" }}>
          <p style={{ color: "var(--th-text)", fontWeight: 600, fontSize: "0.9375rem", marginBottom: 6 }}>No courses yet</p>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", marginBottom: 24 }}>
            Create a course to organize your projects. Anyone can create and link projects to courses.
          </p>
          <button
            onClick={() => setShowNewCourse(true)}
            className="nc-btn-3d text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-80 transition active:scale-95 cursor-pointer"
            style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none" }}
          >
            + Create your first course
          </button>

        </div>
      )}

      {/* Course accordions */}
      {courses.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: unlinkedProjects.length > 0 ? 40 : 0 }}>
          {courses.map((course) => (
            <CourseAccordion
              key={course.id}
              course={course}
              unlinkedProjects={unlinkedProjects}
              isProfessor={isProfessor}
              onLinkProject={(id) => setLinkingCourseId(id)}
              onDelete={(id) => setCourses((prev) => prev.filter((c) => c.id !== id))}
            />
          ))}
        </div>
      )}

      {/* Unlinked projects section */}
      {unlinkedProjects.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "var(--th-border)" }} />
            <p style={{ color: "var(--th-text-2)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>
              Unlinked Projects
            </p>
            <div style={{ flex: 1, height: 1, background: "var(--th-border)" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ alignItems: "stretch" }}>
            {unlinkedProjects.map((p) => (
              <UnlinkedCard key={p.id} project={p} onMove={setMovingProject} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewCourse && (
        <CreateCourseModal onClose={() => setShowNewCourse(false)} onCreated={handleCourseCreated} />
      )}
      {linkingCourseId && linkingCourse && (
        <LinkProjectModal
          courseId={linkingCourseId}
          courseName={linkingCourse.name}
          unlinkedProjects={unlinkedProjects}
          onClose={() => setLinkingCourseId(null)}
          onLinked={handleProjectLinked}
        />
      )}
      {movingProject && (
        <MoveProjectModal
          project={movingProject}
          courses={courses}
          onClose={() => setMovingProject(null)}
          onMoved={handleProjectMoved}
        />
      )}
    </div>
  );
}
