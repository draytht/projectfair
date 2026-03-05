"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Course = { id: string; name: string; code: string };

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/courses").then((r) => r.ok ? r.json() : []).then((c) => setCourses(Array.isArray(c) ? c : []));
  }, []);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, courseId: courseId || null }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/projects/${data.id}`);
  }

  const inputCls: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "var(--th-bg)", border: "1.5px solid var(--th-border)",
    color: "var(--th-text)", borderRadius: 10, padding: "9px 12px",
    fontSize: 14, outline: "none",
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 style={{ color: "var(--th-text)" }} className="text-lg font-semibold mb-6">
        Create New Project
      </h2>

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      <div
        style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
        className="rounded-xl p-6 space-y-4"
      >
        <div>
          <label style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest block mb-1.5">
            Project Name *
          </label>
          <input
            style={inputCls}
            placeholder="e.g. Capstone Project Group 3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "var(--th-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--th-border)")}
          />
        </div>

        <div>
          <label style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest block mb-1.5">
            Link to Course
          </label>
          <select
            style={{ ...inputCls, cursor: "pointer" }}
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
          <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
            Link to one of your courses, or leave blank and assign later.
          </p>
        </div>

        <div>
          <label style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest block mb-1.5">
            Description
          </label>
          <textarea
            style={{ ...inputCls, resize: "none" }}
            placeholder="What is this project about?"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "var(--th-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--th-border)")}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="text-sm py-2 rounded-lg hover:opacity-70 transition cursor-pointer"
            style={{ flex: 1, border: "1px solid var(--th-border)", color: "var(--th-text-2)", background: "none" }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="nc-btn-3d text-sm py-2 rounded-lg font-semibold hover:opacity-80 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ flex: 2, background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none" }}
          >
            {loading ? "Creating…" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
