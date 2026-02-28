"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type User = { id: string; name: string; preferredName?: string | null; avatarUrl?: string | null };

type MemberFullProfile = {
  id: string;
  name: string;
  preferredName: string | null;
  bio: string | null;
  school: string | null;
  major: string | null;
  avatarUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  personalLinks: unknown;
  status: string | null;
  statusExpiresAt: string | null;
  role: string;
};

function initials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0][0] ?? "?").toUpperCase();
}

function MemberAvatar({ user, size = 22 }: { user: User; size?: number }) {
  const display = user.preferredName || user.name;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--th-accent)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt={display} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ color: "#fff", fontSize: size * 0.36, fontWeight: 700, lineHeight: 1 }}>{initials(display)}</span>
      )}
    </div>
  );
}
type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  assignee: User | null;
  assigneeId?: string | null;
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
  TODO: "Start",
  IN_PROGRESS: "Complete",
  DONE: "Reopen",
};

function isOlderThan24hrs(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() > 24 * 60 * 60 * 1000;
}

type ProjectFile = {
  id: string;
  name: string;
  url: string;
  size: number | null;
  mimeType: string | null;
  createdAt: string;
  uploadedById: string;
  uploadedBy: { name: string; preferredName: string | null };
};

type ActivityItem = {
  id: string;
  actorName: string;
  actorAvatar: string | null;
  action: string;
  metadata: Record<string, string> | null;
  createdAt: string;
};

type Tab = "board" | "history" | "contributions" | "files" | "activity";

type EditState = {
  task: Task;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  saving: boolean;
};

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("board");
  const [contributions, setContributions] = useState<ContributionScore[]>([]);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserGlobalRole, setCurrentUserGlobalRole] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [viewingMember, setViewingMember] = useState<{ member: Member; profile: MemberFullProfile | null; loading: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${id}/contributions`)
      .then((r) => r.json())
      .then(setContributions);
    fetch(`/api/projects/${id}/files`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setFiles(data); });
    fetch(`/api/projects/${id}/activity`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setActivity(data); });
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((u) => {
        if (u?.id) setCurrentUserId(u.id);
        if (u?.role) setCurrentUserGlobalRole(u.role);
      });
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setFileError(null);
    try {
      const supabase = createClient();
      const path = `${id}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("project-files")
        .upload(path, file, { upsert: false });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);

      const res = await fetch(`/api/projects/${id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          mimeType: file.type,
        }),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved?.error ?? "Failed to save file");
      setFiles((prev) => [saved, ...prev]);
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleFileDelete(fileId: string) {
    const res = await fetch(`/api/projects/${id}/files/${fileId}`, { method: "DELETE" });
    if (res.ok) setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  async function kickMember(memberId: string) {
    if (!confirm("Remove this member from the project?")) return;
    const res = await fetch(`/api/projects/${id}/members/${memberId}`, { method: "DELETE" });
    if (res.ok) {
      setProject((prev) =>
        prev ? { ...prev, members: prev.members.filter((m) => m.id !== memberId) } : prev
      );
    }
  }

  async function leaveProject(memberId: string) {
    if (!confirm("Leave this project? You will lose access.")) return;
    const res = await fetch(`/api/projects/${id}/members/${memberId}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/projects");
  }

  function openEdit(task: Task) {
    setEditState({
      task,
      title: task.title,
      description: task.description ?? "",
      assigneeId: task.assigneeId ?? "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      saving: false,
    });
  }

  async function saveEdit() {
    if (!editState || !project) return;
    setEditState((s) => s && { ...s, saving: true });

    const res = await fetch(`/api/projects/${id}/tasks/${editState.task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editState.title,
        description: editState.description,
        assigneeId: editState.assigneeId || null,
        dueDate: editState.dueDate || null,
      }),
    });

    if (res.ok) {
      const updated: Task = await res.json();
      setProject((prev) =>
        prev
          ? { ...prev, tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)) }
          : prev
      );
      setEditState(null);
    } else {
      setEditState((s) => s && { ...s, saving: false });
    }
  }

  async function openMemberProfile(member: Member) {
    setViewingMember({ member, profile: null, loading: true });
    const res = await fetch(`/api/users/${member.user.id}`);
    if (res.ok) {
      const profile: MemberFullProfile = await res.json();
      setViewingMember({ member, profile, loading: false });
    } else {
      setViewingMember({ member, profile: null, loading: false });
    }
  }

  if (loading)
    return <p style={{ color: "var(--th-text-2)" }} className="text-sm p-8">Loading...</p>;
  if (!project)
    return <p className="text-red-500 text-sm p-8">Project not found.</p>;

  const todo = project.tasks.filter((t) => t.status === "TODO");
  const inProgress = project.tasks.filter((t) => t.status === "IN_PROGRESS");
  const doneVisible = project.tasks.filter(
    (t) => t.status === "DONE" && !isOlderThan24hrs(t.completedAt)
  );
  const history = project.tasks.filter(
    (t) => t.status === "DONE" && isOlderThan24hrs(t.completedAt)
  );

  const COLUMNS = [
    { label: "To Do", status: "TODO" as const, tasks: todo },
    { label: "In Progress", status: "IN_PROGRESS" as const, tasks: inProgress },
    { label: "Done", status: "DONE" as const, tasks: doneVisible },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: "board", label: "Board" },
    { key: "history", label: history.length > 0 ? `History (${history.length})` : "History" },
    { key: "contributions", label: "Contributions" },
    { key: "files", label: files.length > 0 ? `Files (${files.length})` : "Files" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <h2 className="nc-page-title">
            {project.name}
          </h2>
          {project.courseCode && (
            <p style={{ color: "var(--th-accent)" }} className="text-xs font-medium uppercase tracking-widest mt-1">
              {project.courseCode}
            </p>
          )}
          {project.description && (
            <p style={{ color: "var(--th-text-2)" }} className="text-sm mt-1">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {currentUserGlobalRole === "PROFESSOR" && (
            <Link
              href={`/dashboard/monitor/${id}`}
              style={{ border: "1px solid var(--th-accent)", color: "var(--th-accent)" }}
              className="text-sm px-3 py-1.5 rounded-md hover:opacity-70 transition"
            >
              Monitor View
            </Link>
          )}
          <Link
            href={`/dashboard/projects/${id}/review`}
            style={{ border: "1px solid var(--th-border)", color: "var(--th-text-2)" }}
            className="text-sm px-3 py-1.5 rounded-md hover:opacity-70 transition"
          >
            Peer Review
          </Link>
          <Link
            href={`/dashboard/projects/${id}/tasks/new`}
            style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
            className="text-sm px-3 py-1.5 rounded-md font-medium hover:opacity-80 transition"
          >
            + Task
          </Link>
        </div>
      </div>

      {/* Members */}
      {(() => {
        const myMember = project.members.find((m) => m.user.id === currentUserId);
        const isPrivileged = myMember?.role === "TEAM_LEADER" || myMember?.role === "PROFESSOR";
        return (
          <div className="flex gap-2 mb-6 flex-wrap items-center">
            {project.members.map((m) => {
              const isSelf = m.user.id === currentUserId;
              const canKick = isPrivileged && !isSelf && m.role !== "TEAM_LEADER";
              return (
                <div
                  key={m.id}
                  style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1"
                >
                  <button
                    onClick={() => openMemberProfile(m)}
                    title={`View ${m.user.preferredName || m.user.name}'s profile`}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                    style={{ background: "none", border: "none", padding: 0 }}
                  >
                    <MemberAvatar user={m.user} size={22} />
                    <span style={{ color: "var(--th-text)" }} className="text-xs">{m.user.preferredName || m.user.name}</span>
                    <span style={{ color: "var(--th-text-2)" }} className="text-xs">· {m.role.toLowerCase().replace("_", " ")}</span>
                  </button>
                  {canKick && (
                    <button
                      onClick={() => kickMember(m.id)}
                      title="Remove member"
                      style={{ color: "var(--th-text-2)", cursor: "pointer", lineHeight: 1, fontSize: 14, marginLeft: 2 }}
                      className="hover:opacity-70 transition"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            {isPrivileged && (
              <Link
                href={`/dashboard/projects/${id}/invite`}
                style={{ border: "1px solid var(--th-border)", color: "var(--th-text-2)" }}
                className="text-xs rounded-full px-3 py-1 hover:opacity-70 transition"
              >
                + Invite
              </Link>
            )}
            {myMember && myMember.role !== "TEAM_LEADER" && (
              <button
                onClick={() => leaveProject(myMember.id)}
                style={{ color: "#ef4444", fontSize: 11, cursor: "pointer" }}
                className="hover:opacity-70 transition ml-1"
              >
                Leave project
              </button>
            )}
          </div>
        );
      })()}

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--th-border)" }} className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              borderBottom: tab === t.key
                ? `2px solid var(--th-accent)`
                : "2px solid transparent",
              color: tab === t.key ? "var(--th-accent)" : "var(--th-text-2)",
              marginBottom: "-1px",
            }}
            className="px-4 py-2 text-sm font-medium transition cursor-pointer whitespace-nowrap shrink-0"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Board Tab */}
      {tab === "board" && (() => {
        const myMember = project.members.find((m) => m.user.id === currentUserId);
        const isPrivileged = myMember?.role === "TEAM_LEADER" || myMember?.role === "PROFESSOR";
        return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <div
              key={col.status}
              style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
              className="rounded-xl p-4"
            >
              <h3 style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest mb-3">
                {col.label} ({col.tasks.length})
              </h3>
              <div className="space-y-2">
                {col.tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{ background: "var(--th-bg)", border: "1px solid var(--th-border)" }}
                    className="rounded-lg p-3"
                  >
                    <p style={{ color: "var(--th-text)" }} className="text-sm font-semibold">
                      {task.title}
                    </p>
                    {task.assignee && (
                      <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
                        {task.assignee.preferredName || task.assignee.name}
                      </p>
                    )}
                    {task.dueDate && (
                      <p style={{ color: "var(--th-text-2)" }} className="text-xs">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {task.status === "DONE" && task.completedAt && (
                      <p style={{ color: "var(--th-accent)" }} className="text-xs">
                        Done {new Date(task.completedAt).toLocaleTimeString()}
                      </p>
                    )}
                    {(() => {
                      const isAssignee = task.assigneeId === currentUserId;
                      const canAction = isAssignee;
                      const canEdit = isAssignee || isPrivileged;
                      if (!canAction && !canEdit) return null;
                      return (
                        <div className="flex items-center gap-3 mt-2">
                          {canAction && (
                            <button
                              onClick={() => moveTask(task)}
                              disabled={updating === task.id}
                              style={{ color: "var(--th-accent)" }}
                              className="text-xs hover:opacity-70 transition disabled:opacity-30 cursor-pointer"
                            >
                              {updating === task.id ? "Updating..." : `→ ${STATUS_LABEL[task.status]}`}
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => openEdit(task)}
                              style={{ color: "var(--th-text-2)" }}
                              className="text-xs hover:opacity-70 transition cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
                {col.tasks.length === 0 && (
                  <p style={{ color: "var(--th-text-2)" }} className="text-xs text-center py-4">
                    Empty
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        );
      })()}

      {/* Contributions Tab */}
      {tab === "contributions" && (
        <div className="space-y-4">
          {contributions.length === 0 ? (
            <div className="text-center py-24">
              <p style={{ color: "var(--th-text-2)" }} className="text-sm">No contributions yet.</p>
              <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
                Complete tasks to see scores.
              </p>
            </div>
          ) : (
            contributions.map((s, i) => (
              <div
                key={s.userId}
                style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
                className="rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--th-text-2)" }} className="text-sm font-bold">
                      #{i + 1}
                    </span>
                    <span style={{ color: "var(--th-text)" }} className="font-semibold text-base">
                      {s.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span style={{ color: "var(--th-accent)" }} className="text-3xl font-black">
                      {s.percentage}%
                    </span>
                    <p style={{ color: "var(--th-text-2)" }} className="text-xs">{s.points} pts</p>
                  </div>
                </div>

                <div style={{ background: "var(--th-border)" }} className="w-full h-1.5 rounded-full mb-4">
                  <div
                    style={{ background: "var(--th-accent)", width: `${s.percentage}%` }}
                    className="h-1.5 rounded-full transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Completed", value: s.breakdown.tasksCompleted },
                    { label: "In Progress", value: s.breakdown.tasksInProgress },
                    { label: "Created", value: s.breakdown.tasksCreated },
                    { label: "Other", value: s.breakdown.otherActions },
                  ].map((b) => (
                    <div
                      key={b.label}
                      style={{ background: "var(--th-bg)", border: "1px solid var(--th-border)" }}
                      className="rounded-lg p-2"
                    >
                      <p style={{ color: "var(--th-text)" }} className="text-xl font-bold">{b.value}</p>
                      <p style={{ color: "var(--th-text-2)" }} className="text-xs">{b.label}</p>
                    </div>
                  ))}
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
            <div className="text-center py-24">
              <p style={{ color: "var(--th-text-2)" }} className="text-sm">No history yet.</p>
              <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
                Completed tasks older than 24hrs appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history
                .sort(
                  (a, b) =>
                    new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
                )
                .map((task) => (
                  <div
                    key={task.id}
                    style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
                    className="rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p
                        style={{ color: "var(--th-text-2)" }}
                        className="text-sm font-medium line-through"
                      >
                        {task.title}
                      </p>
                      <div className="flex gap-3 mt-1">
                        {task.assignee && (
                          <p style={{ color: "var(--th-text-2)" }} className="text-xs">
                            {task.assignee.preferredName || task.assignee.name}
                          </p>
                        )}
                        {task.completedAt && (
                          <p style={{ color: "var(--th-text-2)" }} className="text-xs">
                            {new Date(task.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      style={{ color: "var(--th-accent)", border: "1px solid var(--th-accent)" }}
                      className="text-xs px-2 py-1 rounded-full"
                    >
                      Done
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Files Tab */}
      {tab === "files" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p style={{ color: "var(--th-text-2)" }} className="text-xs">
              Upload documents, designs, or any files for this project.
            </p>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                style={{ background: "var(--th-accent)", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: uploadingFile ? 0.6 : 1 }}
              >
                {uploadingFile ? "Uploading…" : "+ Upload File"}
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>

          {fileError && (
            <p style={{ color: "#ef4444" }} className="text-xs mb-3">{fileError}</p>
          )}

          {files.length === 0 ? (
            <div className="text-center py-24">
              <p style={{ color: "var(--th-text-2)" }} className="text-sm">No files yet.</p>
              <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">Upload files to share with your team.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
                  className="rounded-lg px-4 py-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--th-accent)" }}
                      className="text-sm font-medium hover:opacity-70 transition truncate block"
                    >
                      {file.name}
                    </a>
                    <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-0.5">
                      {file.uploadedBy.preferredName || file.uploadedBy.name}
                      {file.size ? ` · ${(file.size / 1024).toFixed(0)} KB` : ""}
                      {" · "}{new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {currentUserId === file.uploadedById && (
                    <button
                      onClick={() => handleFileDelete(file.id)}
                      style={{ color: "var(--th-text-2)", cursor: "pointer", fontSize: 12 }}
                      className="hover:opacity-70 transition shrink-0"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {tab === "activity" && (
        <div className="max-w-xl">
          {activity.length === 0 ? (
            <div className="text-center py-24">
              <p style={{ color: "var(--th-text-2)" }} className="text-sm">No activity yet.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {activity.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-3"
                  style={{ borderBottom: i < activity.length - 1 ? "1px solid var(--th-border)" : "none" }}
                >
                  {/* Actor avatar */}
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--th-accent)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {item.actorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.actorAvatar} alt={item.actorName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>
                        {item.actorName.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "var(--th-text)" }} className="text-sm leading-snug">
                      <span className="font-medium">{item.actorName}</span>
                      {" "}<span style={{ color: "var(--th-text-2)" }}>{item.action}</span>
                      {item.metadata?.taskTitle && (
                        <span style={{ color: "var(--th-text-2)" }}>{" — "}<span style={{ color: "var(--th-text)" }}>{item.metadata.taskTitle}</span></span>
                      )}
                      {item.metadata?.fileName && (
                        <span style={{ color: "var(--th-text-2)" }}>{" — "}<span style={{ color: "var(--th-text)" }}>{item.metadata.fileName}</span></span>
                      )}
                    </p>
                    <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-0.5">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Member Profile Modal */}
      {viewingMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setViewingMember(null)}
        >
          <div
            className="nc-member-card w-full"
            style={{
              maxWidth: 360,
              borderRadius: 20,
              padding: "28px 24px",
              background: "color-mix(in srgb, var(--th-card) 72%, transparent)",
              border: "1px solid color-mix(in srgb, var(--th-border) 60%, transparent)",
              backdropFilter: "blur(24px) saturate(180%)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.28), 0 1px 0 color-mix(in srgb, var(--th-accent) 12%, transparent) inset",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {viewingMember.loading ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--th-border)" }} className="animate-pulse" />
                <div style={{ width: 120, height: 12, borderRadius: 6, background: "var(--th-border)" }} className="animate-pulse" />
                <div style={{ width: 80, height: 10, borderRadius: 6, background: "var(--th-border)" }} className="animate-pulse" />
              </div>
            ) : viewingMember.profile ? (() => {
              const p = viewingMember.profile!;
              const displayName = p.preferredName || p.name;
              const links = Array.isArray(p.personalLinks) ? p.personalLinks as { label: string; url: string }[] : [];
              const statusValid = p.status && (!p.statusExpiresAt || new Date(p.statusExpiresAt) > new Date());
              return (
                <div className="flex flex-col items-center gap-4">
                  {/* Avatar */}
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--th-accent)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 0 3px color-mix(in srgb, var(--th-accent) 20%, transparent)" }}>
                    {p.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ color: "var(--th-accent-fg)", fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                        {initials(displayName)}
                      </span>
                    )}
                  </div>

                  {/* Name + role */}
                  <div className="text-center">
                    <p style={{ color: "var(--th-text)" }} className="text-lg font-bold leading-tight">{displayName}</p>
                    {p.preferredName && p.name !== p.preferredName && (
                      <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-0.5">{p.name}</p>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                      <span
                        style={{ background: "color-mix(in srgb, var(--th-accent) 14%, transparent)", color: "var(--th-accent)", border: "1px solid color-mix(in srgb, var(--th-accent) 30%, transparent)" }}
                        className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      >
                        {viewingMember.member.role.toLowerCase().replace("_", " ")}
                      </span>
                      {statusValid && (
                        <span style={{ color: "var(--th-text-2)" }} className="text-xs">· {p.status}</span>
                      )}
                    </div>
                  </div>

                  {/* Info rows */}
                  {(p.bio || p.school || p.major) && (
                    <div style={{ borderTop: "1px solid color-mix(in srgb, var(--th-border) 50%, transparent)", width: "100%", paddingTop: 16 }} className="space-y-2">
                      {p.bio && (
                        <p style={{ color: "var(--th-text-2)" }} className="text-xs leading-relaxed text-center">{p.bio}</p>
                      )}
                      {(p.school || p.major) && (
                        <p style={{ color: "var(--th-text-2)" }} className="text-xs text-center">
                          {[p.major, p.school].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  {(p.githubUrl || p.linkedinUrl || links.length > 0) && (
                    <div style={{ borderTop: "1px solid color-mix(in srgb, var(--th-border) 50%, transparent)", width: "100%", paddingTop: 14 }} className="flex flex-wrap gap-2 justify-center">
                      {p.githubUrl && (
                        <a
                          href={p.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--th-accent)", border: "1px solid color-mix(in srgb, var(--th-border) 70%, transparent)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 500, textDecoration: "none" }}
                          className="hover:opacity-70 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          GitHub
                        </a>
                      )}
                      {p.linkedinUrl && (
                        <a
                          href={p.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--th-accent)", border: "1px solid color-mix(in srgb, var(--th-border) 70%, transparent)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 500, textDecoration: "none" }}
                          className="hover:opacity-70 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          LinkedIn
                        </a>
                      )}
                      {links.map((l, i) => (
                        <a
                          key={i}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--th-accent)", border: "1px solid color-mix(in srgb, var(--th-border) 70%, transparent)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 500, textDecoration: "none" }}
                          className="hover:opacity-70 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })() : (
              <p style={{ color: "var(--th-text-2)" }} className="text-sm text-center py-6">Could not load profile.</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditState(null); }}
        >
          <div
            style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", width: "100%", maxWidth: 480, borderRadius: 14 }}
            className="p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 style={{ color: "var(--th-text)" }} className="font-semibold text-base">Edit Task</h3>
              <button onClick={() => setEditState(null)} style={{ color: "var(--th-text-2)", cursor: "pointer" }} className="text-lg">×</button>
            </div>

            <div>
              <label style={{ color: "var(--th-text-2)" }} className="text-xs block mb-1">Title</label>
              <input
                value={editState.title}
                onChange={(e) => setEditState((s) => s && { ...s, title: e.target.value })}
                className="nc-input"
              />
            </div>

            <div>
              <label style={{ color: "var(--th-text-2)" }} className="text-xs block mb-1">Description</label>
              <textarea
                value={editState.description}
                onChange={(e) => setEditState((s) => s && { ...s, description: e.target.value })}
                rows={3}
                className="nc-input resize-none"
              />
            </div>

            <div>
              <label style={{ color: "var(--th-text-2)" }} className="text-xs block mb-1">Assign To</label>
              <select
                value={editState.assigneeId}
                onChange={(e) => setEditState((s) => s && { ...s, assigneeId: e.target.value })}
                className="nc-select"
              >
                <option value="">Unassigned</option>
                {project?.members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.preferredName || m.user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ color: "var(--th-text-2)" }} className="text-xs block mb-1">Due Date</label>
              <input
                type="date"
                value={editState.dueDate}
                onChange={(e) => setEditState((s) => s && { ...s, dueDate: e.target.value })}
                className="nc-input"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditState(null)} className="nc-btn-secondary">Cancel</button>
              <button onClick={saveEdit} disabled={editState.saving} className="nc-btn-primary">
                {editState.saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
