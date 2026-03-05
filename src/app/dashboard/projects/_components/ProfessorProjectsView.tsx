"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  courseCode: string | null;
  courseId: string | null;
  members: { user: { id: string; name: string; role: string } }[];
  tasks: { status: string }[];
};

type Course = { id: string; name: string; code: string };

// ── Plus icon ──────────────────────────────────────────────────────────────────

function PlusIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="6" y1="1" x2="6" y2="11" />
      <line x1="1" y1="6" x2="11" y2="6" />
    </svg>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────

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

// ── Create Project modal ───────────────────────────────────────────────────────

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/courses").then((r) => r.ok ? r.json() : []).then((c) => setCourses(Array.isArray(c) ? c : []));
  }, []);

  async function submit() {
    if (!name.trim()) { setError("Project name is required."); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/professor/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, courseId: courseId || null }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong."); setSaving(false); return; }
    onCreated({ ...data, members: data.members ?? [], tasks: data.tasks ?? [] });
  }

  return (
    <Modal title="New Project" onClose={onClose}>
      {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 14 }}>{error}</p>}
      <Field label="Project Name *">
        <input style={inputStyle} placeholder="e.g. Team Alpha Capstone" value={name} onChange={(e) => setName(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--th-accent)")} onBlur={(e) => (e.target.style.borderColor = "var(--th-border)")} />
      </Field>
      <Field label="Link to Course" hint="Link to one of your courses, or leave blank and assign later.">
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--th-accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--th-border)")}
        >
          <option value="">— no course —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Description">
        <textarea style={{ ...inputStyle, resize: "none" }} rows={3} placeholder="What is this project about?" value={description} onChange={(e) => setDescription(e.target.value)}
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
          {saving ? "Creating…" : "Create Project"}
        </button>
      </div>
    </Modal>
  );
}

// ── Project card ───────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const done = project.tasks.filter((t) => t.status === "DONE").length;
  const total = project.tasks.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <Link
      href={`/dashboard/monitor/${project.id}`}
      style={{
        background: "var(--th-card)",
        border: "1px solid var(--th-border)",
        borderRadius: 16,
        padding: "20px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        textDecoration: "none",
        transition: "border-color 0.15s, transform 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
      className="nc-card-hover group"
    >
      {/* Top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--th-accent), transparent)", opacity: 0.35 }} />

      {/* Course badge */}
      {project.courseCode && (
        <p style={{ color: "var(--th-accent)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          {project.courseCode}
        </p>
      )}

      <h4 style={{ color: "var(--th-text)", fontSize: "0.9375rem", fontWeight: 600, lineHeight: 1.3, marginBottom: 16 }}>
        {project.name}
      </h4>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
        <div>
          <p style={{ color: "var(--th-text)", fontSize: "1.125rem", fontWeight: 700, lineHeight: 1 }}>{project.members.length}</p>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", marginTop: 2 }}>members</p>
        </div>
        <div>
          <p style={{ color: "var(--th-text)", fontSize: "1.125rem", fontWeight: 700, lineHeight: 1 }}>{total}</p>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", marginTop: 2 }}>tasks</p>
        </div>
        <div>
          <p style={{ color: "var(--th-accent)", fontSize: "1.125rem", fontWeight: 700, lineHeight: 1 }}>{progress}%</p>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", marginTop: 2 }}>done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: "var(--th-border)", width: "100%", height: 3, borderRadius: 999, marginBottom: 14 }}>
        <div style={{ background: "var(--th-accent)", width: `${progress}%`, height: 3, borderRadius: 999, transition: "width 0.4s" }} />
      </div>

      {/* Member chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {project.members.slice(0, 4).map((m) => (
          <span key={m.user.id} style={{ background: "var(--th-bg)", color: "var(--th-text-2)", fontSize: "0.6875rem", padding: "2px 8px", borderRadius: 999, border: "1px solid var(--th-border)" }}>
            {m.user.name}
          </span>
        ))}
        {project.members.length > 4 && (
          <span style={{ color: "var(--th-text-2)", fontSize: "0.6875rem", padding: "2px 4px" }}>+{project.members.length - 4} more</span>
        )}
      </div>

      {/* Hover CTA */}
      <p style={{ color: "var(--th-accent)", fontSize: "0.75rem", fontWeight: 600, marginTop: 14, opacity: 0 }} className="group-hover:opacity-100 transition-opacity">
        Monitor →
      </p>
    </Link>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function ProfessorProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    fetch("/api/professor/projects")
      .then((r) => r.ok ? r.json() : [])
      .then((p) => { setProjects(Array.isArray(p) ? p : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleProjectCreated(project: Project) {
    setProjects((prev) => [...prev, project]);
    setShowNewProject(false);
  }

  if (loading) return <p style={{ color: "var(--th-text-2)" }} className="text-sm p-8">Loading…</p>;

  const totalStudents = new Set(
    projects.flatMap((p) => p.members.filter((m) => m.user.role === "STUDENT").map((m) => m.user.id))
  ).size;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
        <div>
          <h2 className="nc-page-title">My Projects</h2>
          <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} · {totalStudents} student{totalStudents !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="nc-btn-3d text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-80 transition active:scale-95 cursor-pointer"
          style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none", flexShrink: 0 }}
        >
          + New Project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div style={{ textAlign: "center", padding: "96px 24px" }}>
          <p style={{ color: "var(--th-text)", fontWeight: 600, fontSize: "0.9375rem", marginBottom: 6 }}>No projects yet</p>
          <p style={{ color: "var(--th-text-2)", fontSize: "0.8125rem", marginBottom: 24 }}>
            Create a project or ask students to link theirs using a course code.
          </p>
          <button
            onClick={() => setShowNewProject(true)}
            className="nc-btn-3d text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-80 transition active:scale-95 cursor-pointer"
            style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none" }}
          >
            + Create your first project
          </button>
        </div>
      )}

      {/* Project grid */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showNewProject && (
        <CreateProjectModal onClose={() => setShowNewProject(false)} onCreated={handleProjectCreated} />
      )}
    </div>
  );
}
