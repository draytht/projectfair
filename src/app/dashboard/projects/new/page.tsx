"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DeadlinePicker } from "@/components/ui/deadline-picker";

type Course = { id: string; name: string; code: string };

type PlanData = { plan: "FREE" | "PRO"; limits: { projects: number }; usage: { projects: number } };

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.ok ? r.json() : []),
      fetch("/api/stripe/plan").then((r) => r.ok ? r.json() : null),
    ]).then(([c, plan]) => {
      setCourses(Array.isArray(c) ? c : []);
      if (plan) setPlanData(plan);
      setPlanLoading(false);
    });
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
      body: JSON.stringify({ name, description, courseId: courseId || null, deadline: deadline || null }),
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

  const atLimit = !planLoading && planData !== null && planData.usage.projects >= planData.limits.projects;

  if (atLimit) {
    return (
      <div className="max-w-lg mx-auto" style={{ paddingTop: 40, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: "var(--th-text)", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Project limit reached</h2>
        <p style={{ color: "var(--th-text-2)", fontSize: 13, marginBottom: 6 }}>
          You&apos;ve used {planData!.usage.projects} of {planData!.limits.projects} projects on the <strong>{planData!.plan === "FREE" ? "Free" : "Pro"}</strong> plan.
        </p>
        {planData!.plan === "FREE" && (
          <p style={{ color: "var(--th-text-2)", fontSize: 13, marginBottom: 28 }}>
            Upgrade to Pro for up to {20} projects.
          </p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Link
            href="/dashboard/projects"
            style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid var(--th-border)", color: "var(--th-text-2)", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
          >
            ← Back
          </Link>
          {planData!.plan === "FREE" && (
            <Link
              href="/dashboard/plan"
              style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "var(--th-accent)", color: "var(--th-accent-fg)", textDecoration: "none", fontSize: 13, fontWeight: 700 }}
            >
              Upgrade to Pro →
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/dashboard/projects"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            color: "var(--th-text-2)", textDecoration: "none",
            fontSize: 12, fontWeight: 600, letterSpacing: "0.03em",
            textTransform: "uppercase", padding: "7px 14px 7px 10px",
            borderRadius: 10, border: "1.5px solid var(--th-border)",
            background: "var(--th-card)", transition: "color 0.18s, border-color 0.18s, background 0.18s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--th-accent)";
            e.currentTarget.style.borderColor = "var(--th-accent)";
            e.currentTarget.style.background = "color-mix(in srgb, var(--th-accent) 8%, var(--th-card))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--th-text-2)";
            e.currentTarget.style.borderColor = "var(--th-border)";
            e.currentTarget.style.background = "var(--th-card)";
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
            <path d="M8.5 2L3.5 6.5L8.5 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          My Projects
        </Link>
      </div>

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

        <div>
          <label style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest block mb-1.5">
            Deadline <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <DeadlinePicker value={deadline} onChange={setDeadline} />
          <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
            Set a target deadline to track time remaining on your project dashboard.
          </p>
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
