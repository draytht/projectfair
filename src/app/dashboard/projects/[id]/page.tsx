"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type User = { id: string; name: string };
type Task = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  assignee: User | null;
  dueDate: string | null;
  completedAt: string | null;
};
type Member = { id: string; role: string; user: User };
type Project = {
  id: string;
  name: string;
  courseCode: string | null;
  description: string | null;
  members: Member[];
  tasks: Task[];
};
type ContributionScore = {
  userId: string;
  name: string;
  points: number;
  percentage: number;
  breakdown: {
    tasksCompleted: number;
    tasksInProgress: number;
    tasksCreated: number;
    otherActions: number;
  };
};

const NEXT_STATUS: Record<Task["status"], Task["status"]> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

const STATUS_LABEL: Record<Task["status"], string> = {
  TODO: "→ Start",
  IN_PROGRESS: "→ Complete",
  DONE: "→ Reopen",
};

function isOlderThan24hrs(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const completed = new Date(dateStr).getTime();
  const now = Date.now();
  return now - completed > 24 * 60 * 60 * 1000;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<"board" | "history">("board");
  const [contributions, setContributions] = useState<ContributionScore[]>([]);

  useEffect(() => {
    fetch(`/api/projects/${id}/contributions`)
      .then((r) => r.json())
      .then(setContributions);
  }, [id]);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data);
        setLoading(false);
      });
  }, [id]);

  async function moveTask(task: Task) {
    if (!project) return;
    const newStatus = NEXT_STATUS[task.status];
    setUpdating(task.id);

    setProject((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: newStatus,
                    completedAt: newStatus === "DONE" ? new Date().toISOString() : null,
                  }
                : t
            ),
          }
        : prev
    );

    await fetch(`/api/projects/${id}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    setUpdating(null);
  }

  if (loading) return <div className="text-gray-400 text-sm p-8">Loading...</div>;
  if (!project) return <div className="text-red-500 text-sm p-8">Project not found.</div>;

  const todo = project.tasks.filter((t) => t.status === "TODO");
  const inProgress = project.tasks.filter((t) => t.status === "IN_PROGRESS");

  // Done column: completed but less than 24hrs ago
  const doneVisible = project.tasks.filter(
    (t) => t.status === "DONE" && !isOlderThan24hrs(t.completedAt)
  );

  // History: completed more than 24hrs ago
  const history = project.tasks.filter(
    (t) => t.status === "DONE" && isOlderThan24hrs(t.completedAt)
  );

  const COLUMNS = [
    { label: "📋 To Do", status: "TODO" as const, tasks: todo },
    { label: "🔄 In Progress", status: "IN_PROGRESS" as const, tasks: inProgress },
    { label: "✅ Done", status: "DONE" as const, tasks: doneVisible },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          {project.courseCode && (
            <p className="text-sm text-blue-500">{project.courseCode}</p>
          )}
        </div>
        <Link
          href={`/dashboard/projects/${id}/tasks/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Task
        </Link>

        <Link
          href={`/dashboard/projects/${id}/review`}
          className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50"
        >
          ⭐ Peer Review
        </Link>
      </div>

      {project.description && (
        <p className="text-sm text-gray-500 mb-4">{project.description}</p>
      )}

      {/* Members */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {project.members.map((m) => (
          <div key={m.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
            <span className="text-xs text-gray-700">{m.user.name}</span>
            <span className="text-xs text-gray-400">
              · {m.role.toLowerCase().replace("_", " ")}
            </span>
          </div>
        ))}
        <Link
          href={`/dashboard/projects/${id}/invite`}
          className="text-xs text-blue-600 border border-blue-300 rounded-full px-3 py-1 hover:bg-blue-50"
        >
          + Invite
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setTab("board")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === "board"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Board
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          History {history.length > 0 && (
            <span className="ml-1 bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </button>

          <button
            onClick={() => setTab("contributions")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === "contributions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📊 Contributions
          </button>


      </div>

      {/* Board Tab */}
      {tab === "board" && (
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.status} className="bg-gray-100 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                {col.label} ({col.tasks.length})
              </h3>
              <div className="space-y-2">
                {col.tasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm font-medium text-gray-800">{task.title}</p>
                    {task.assignee && (
                      <p className="text-xs text-gray-400 mt-1">👤 {task.assignee.name}</p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-gray-400">
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {task.status === "DONE" && task.completedAt && (
                      <p className="text-xs text-green-500">
                        ✓ Completed {new Date(task.completedAt).toLocaleTimeString()}
                      </p>
                    )}
                    <button
                      onClick={() => moveTask(task)}
                      disabled={updating === task.id}
                      className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-40"
                    >
                      {updating === task.id ? "Updating..." : STATUS_LABEL[task.status]}
                    </button>
                  </div>
                ))}
                {col.tasks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "contributions" && (
        <div className="space-y-4">
          {contributions.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p>No contributions yet.</p>
              <p className="text-sm mt-1">Start completing tasks to see scores.</p>
            </div>
          ) : (
            contributions.map((s, i) => (
              <div key={s.userId} className="bg-white border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-400">#{i + 1}</span>
                    <span className="font-semibold text-gray-900">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">{s.percentage}%</span>
                    <p className="text-xs text-gray-400">{s.points} pts</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-800">{s.breakdown.tasksCompleted}</p>
                    <p className="text-xs text-gray-400">Completed</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-800">{s.breakdown.tasksInProgress}</p>
                    <p className="text-xs text-gray-400">In Progress</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-800">{s.breakdown.tasksCreated}</p>
                    <p className="text-xs text-gray-400">Created</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-800">{s.breakdown.otherActions}</p>
                    <p className="text-xs text-gray-400">Other</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div>
          {history.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p>No history yet.</p>
              <p className="text-sm mt-1">Completed tasks older than 24hrs will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history
                .sort((a, b) =>
                  new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
                )
                .map((task) => (
                  <div
                    key={task.id}
                    className="bg-white border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-through">{task.title}</p>
                      <div className="flex gap-3 mt-1">
                        {task.assignee && (
                          <p className="text-xs text-gray-400">👤 {task.assignee.name}</p>
                        )}
                        {task.completedAt && (
                          <p className="text-xs text-gray-400">
                            ✓ {new Date(task.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Completed
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}