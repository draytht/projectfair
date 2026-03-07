"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sounds } from "@/lib/sounds";

type ArchivedProject = {
  id: string;
  name: string;
  description: string | null;
  courseCode: string | null;
  deadline: string | null;
  archivedAt: string | null;
  archivedReason: string | null;
  members: { user: { id: string; name: string } }[];
  tasks: { status: string }[];
  files: { id: string }[];
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function ArchivePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/archive")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setProjects(d); })
      .finally(() => setLoading(false));
  }, []);

  async function restore(id: string) {
    setRestoring(id);
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    if (res.ok) {
      sounds.restore();
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
    setRestoring(null);
  }

  return (
    <div className="max-w-3xl mx-auto">
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--th-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
        </svg>
        <h2 className="nc-page-title" style={{ margin: 0 }}>Archive</h2>
      </div>
      <p style={{ color: "var(--th-text-2)", fontSize: 13, marginBottom: 28 }}>
        Completed projects and projects whose deadline has passed. You can restore any of them.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 12, padding: 20, height: 90 }} className="nc-skeleton" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--th-text-2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", opacity: 0.4 }}>
            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          <p style={{ color: "var(--th-text-2)", fontSize: 14 }}>No archived projects yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const done = p.tasks.filter((t) => t.status === "DONE").length;
            const total = p.tasks.length;
            const reason = p.archivedReason === "DEADLINE_PASSED" ? "Deadline passed" : "Marked complete";
            return (
              <div
                key={p.id}
                style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 14, padding: "18px 20px" }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    {p.courseCode && (
                      <p style={{ color: "var(--th-accent)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                        {p.courseCode}
                      </p>
                    )}
                    <h3 style={{ color: "var(--th-text)", fontSize: 15, fontWeight: 600, margin: 0 }}>{p.name}</h3>
                    {p.description && (
                      <p style={{ color: "var(--th-text-2)", fontSize: 12, marginTop: 4 }} className="line-clamp-1">{p.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span style={{ background: "color-mix(in srgb,var(--th-accent) 10%,transparent)", color: "var(--th-accent)", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em" }}>
                        {reason}
                      </span>
                      {p.archivedAt && (
                        <span style={{ color: "var(--th-text-2)", fontSize: 11 }}>{timeAgo(p.archivedAt)}</span>
                      )}
                      <span style={{ color: "var(--th-text-2)", fontSize: 11 }}>
                        {done}/{total} tasks done · {p.members.length} members · {p.files.length} files
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      style={{ border: "1px solid var(--th-border)", color: "var(--th-text-2)", background: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", transition: "border-color 0.14s, color 0.14s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--th-text)"; e.currentTarget.style.borderColor = "var(--th-text)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--th-text-2)"; e.currentTarget.style.borderColor = "var(--th-border)"; }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => restore(p.id)}
                      disabled={restoring === p.id}
                      style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: restoring === p.id ? "not-allowed" : "pointer", opacity: restoring === p.id ? 0.6 : 1 }}
                    >
                      {restoring === p.id ? "Restoring…" : "↩ Restore"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
