"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

type Member = { user: { id: string; name: string } };

export default function NewTaskPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
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
      body: JSON.stringify({ title, description, dueDate, assigneeId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/projects/${id}`);
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Task</h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Task Title *</label>
          <input
            className="w-full border rounded-lg px-4 py-2 text-sm mt-1"
            placeholder="e.g. Write introduction section"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            className="w-full border rounded-lg px-4 py-2 text-sm mt-1 resize-none"
            placeholder="What needs to be done?"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Assign To</label>
          <select
            className="w-full border rounded-lg px-4 py-2 text-sm mt-1"
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
          <label className="text-sm font-medium text-gray-700">Due Date</label>
          <input
            className="w-full border rounded-lg px-4 py-2 text-sm mt-1"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="flex-1 border text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}