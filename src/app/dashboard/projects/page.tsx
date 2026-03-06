"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectDeadlineBadge } from "./_components/ProjectDeadlineBadge";

type Member = { userId: string; role: string; user: { id: string; name: string } };
type Project = {
  id: string;
  name: string;
  description: string | null;
  courseCode: string | null;
  deadline: string | null;
  members: Member[];
  tasks: { status: string }[];
};

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="4" x2="13" y2="4" />
      <path d="M5.5 4V2.8h4V4" />
      <path d="M3.5 4l.7 8.5a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L11.5 4" />
      <line x1="6" y1="7" x2="6" y2="10.5" />
      <line x1="9" y1="7" x2="9" y2="10.5" />
    </svg>
  );
}

function ProjectCard({
  project,
  isLeader,
  onDeleted,
}: {
  project: Project;
  isLeader: boolean;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Move "${project.name}" to Trash? You can restore it later.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(project.id);
    else setDeleting(false);
  }

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/dashboard/projects/${project.id}`}
        style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
        className="block p-6 rounded-xl nc-card-hover group"
      >
        {project.courseCode && (
          <p style={{ color: "var(--th-accent)" }} className="text-xs font-medium uppercase tracking-widest mb-1">
            {project.courseCode}
          </p>
        )}
        {project.deadline && (
          <ProjectDeadlineBadge deadline={project.deadline} />
        )}
        <h3 style={{ color: "var(--th-text)" }} className="text-base font-semibold leading-snug mb-1 mt-2">
          {project.name}
        </h3>
        {project.description && (
          <p style={{ color: "var(--th-text-2)" }} className="text-sm mt-2 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-4">
          <p style={{ color: "var(--th-text-2)" }} className="text-xs">
            {project.members.length} member{project.members.length !== 1 ? "s" : ""} · {project.tasks.length} task{project.tasks.length !== 1 ? "s" : ""}
          </p>
          <p
            style={{ color: "var(--th-accent)" }}
            className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Open →
          </p>
        </div>
      </Link>

      {/* Delete button — shows on card hover, leader only */}
      {isLeader && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Move to Trash"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--th-card)",
            border: "1px solid var(--th-border)",
            borderRadius: 7,
            cursor: deleting ? "not-allowed" : "pointer",
            color: "var(--th-text-2)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s, color 0.14s, border-color 0.14s, background 0.14s",
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--th-text-2)";
            e.currentTarget.style.borderColor = "var(--th-border)";
            e.currentTarget.style.background = "var(--th-card)";
          }}
        >
          {deleting ? (
            <span style={{ fontSize: 10, fontWeight: 700 }}>…</span>
          ) : (
            <TrashIcon />
          )}
        </button>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([proj, me]) => {
      if (Array.isArray(proj)) setProjects(proj);
      if (me?.id) setCurrentUserId(me.id);
    }).finally(() => setLoading(false));
  }, []);

  function handleDeleted(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="nc-skeleton" style={{ width: 140, height: 28, borderRadius: 8, background: "var(--th-border)", marginBottom: 6 }} />
            <div className="nc-skeleton" style={{ width: 80, height: 14, borderRadius: 6, background: "var(--th-border)" }} />
          </div>
          <div className="nc-skeleton" style={{ width: 110, height: 36, borderRadius: 8, background: "var(--th-border)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="nc-skeleton" style={{ height: 140, borderRadius: 12, background: "var(--th-border)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="nc-page-title">My Projects</h2>
          <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
            {projects.length} active project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="nc-btn-3d text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-80 transition active:scale-95"
          style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", textDecoration: "none", flexShrink: 0 }}
        >
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24">
          <p style={{ color: "var(--th-text)" }} className="text-base font-semibold mb-1">No projects yet</p>
          <p style={{ color: "var(--th-text-2)" }} className="text-sm">Create one or ask your team leader to invite you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const myMembership = project.members.find((m) => m.userId === currentUserId);
            const isLeader = myMembership?.role === "TEAM_LEADER";
            return (
              <ProjectCard
                key={project.id}
                project={project}
                isLeader={isLeader ?? false}
                onDeleted={handleDeleted}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
