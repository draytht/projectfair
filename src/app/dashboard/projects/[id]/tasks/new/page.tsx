"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DeadlinePicker } from "@/components/ui/deadline-picker";

type Member = { user: { id: string; name: string } };

const OUTPUT_OPTIONS = [
  { type: "PDF",  label: "PDF",  desc: "Portable Document",   color: "#ef4444" },
  { type: "PPTX", label: "PPTX", desc: "Presentation",        color: "#f97316" },
  { type: "DOCX", label: "DOCX", desc: "Word Document",       color: "#3b82f6" },
  { type: "TXT",  label: "TXT",  desc: "Plain Text",          color: "#6b7280" },
  { type: "CODE", label: "Code", desc: "Source Code File",    color: "#a855f7" },
];

export default function NewTaskPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [outputType, setOutputType] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${id}/members`)
      .then((r) => r.json())
      .then(setMembers);
  }, [id]);

  async function handleCreate() {
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/projects/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, dueDate, assigneeId, outputType: outputType || null }),
    });

    let data: { error?: string } = {};
    try { data = await res.json(); } catch { /* empty body */ }

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/projects/${id}`);
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 style={{ color: "var(--th-text)" }} className="text-lg font-semibold mb-6">
        Add Task
      </h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div
        style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
        className="rounded-xl p-6 space-y-4"
      >
        <div>
          <label style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest">
            Task Title *
          </label>
          <input
            className="nc-input"
            placeholder="e.g. Write introduction section"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest">
            Description
          </label>
          <textarea
            className="nc-input resize-none"
            placeholder="What needs to be done?"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest">
            Assign To
          </label>
          <select
            className="nc-select"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest block mb-1">
            Due Date
          </label>
          <DeadlinePicker value={dueDate} onChange={setDueDate} placeholder="Pick a due date…" />
        </div>

        {/* Output Type */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest">
              Required Output
            </label>
            <span style={{ color: "var(--th-text-2)", fontSize: 10, background: "var(--th-bg)", border: "1px solid var(--th-border)", borderRadius: 4, padding: "1px 6px" }}>
              Optional
            </span>
          </div>
          <p style={{ color: "var(--th-text-2)", fontSize: 12, marginBottom: 10 }}>
            If set, the assignee must upload this file type before marking the task done.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {OUTPUT_OPTIONS.map((opt) => {
              const selected = outputType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setOutputType(selected ? "" : opt.type)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: selected
                      ? `1.5px solid ${opt.color}`
                      : "1.5px solid var(--th-border)",
                    background: selected
                      ? `color-mix(in srgb, ${opt.color} 12%, transparent)`
                      : "var(--th-bg)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    minWidth: 60,
                  }}
                >
                  <span style={{ color: selected ? opt.color : "var(--th-text)", fontSize: 13, fontWeight: 700 }}>
                    {opt.label}
                  </span>
                  <span style={{ color: selected ? opt.color : "var(--th-text-2)", fontSize: 10, opacity: 0.8 }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
          {outputType && (
            <p style={{ color: "var(--th-text-2)", fontSize: 11, marginTop: 8 }}>
              Assignee must upload a{" "}
              <span style={{ color: OUTPUT_OPTIONS.find(o => o.type === outputType)?.color, fontWeight: 600 }}>
                {OUTPUT_OPTIONS.find(o => o.type === outputType)?.label}
              </span>{" "}
              file before the task can be marked as done.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="nc-btn-secondary">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={loading} className="nc-btn-primary">
            {loading ? "Creating..." : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
