"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sounds } from "@/lib/sounds";
import ProjectChat from "./_components/ProjectChat";
import { DeadlinePicker } from "@/components/ui/deadline-picker";
import { useConfirm } from "@/components/ConfirmDialog";

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
  outputType: string | null;
  outputFileUrl: string | null;
  outputFileName: string | null;
  outputUploadedAt: string | null;
};

const OUTPUT_CONFIG: Record<string, { label: string; accept: string; color: string; exts: string[] }> = {
  PDF:  { label: "PDF",  accept: ".pdf",  color: "#ef4444", exts: [".pdf"] },
  PPTX: { label: "PPTX", accept: ".pptx", color: "#f97316", exts: [".pptx"] },
  DOCX: { label: "DOCX", accept: ".docx", color: "#3b82f6", exts: [".docx"] },
  TXT:  { label: "TXT",  accept: ".txt",  color: "#6b7280", exts: [".txt"] },
  CODE: {
    label: "Code",
    accept: ".js,.ts,.py,.java,.c,.cpp,.h,.cs,.php,.rb,.go,.rs,.swift,.kt,.jsx,.tsx,.html,.css,.json,.xml,.yaml,.yml,.sql,.sh",
    color: "#a855f7",
    exts: [".js",".ts",".py",".java",".c",".cpp",".h",".cs",".php",".rb",".go",".rs",".swift",".kt",".jsx",".tsx",".html",".css",".json",".xml",".yaml",".yml",".sql",".sh"],
  },
};

function isValidOutputFile(fileName: string, outputType: string): boolean {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return OUTPUT_CONFIG[outputType]?.exts.includes(ext) ?? true;
}
type Member = { id: string; role: string; user: User };
type Project = {
  id: string;
  name: string;
  courseCode: string | null;
  description: string | null;
  deadline: string | null;
  ownerId: string;
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

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(deadline).getTime();
  const diff = target - now;
  const overdue = diff <= 0;

  const totalSecs = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  // Color based on urgency
  const color = overdue
    ? "#ef4444"
    : days < 1
    ? "#f97316"
    : days < 3
    ? "#eab308"
    : "var(--th-accent)";

  const urgencyBg = overdue
    ? "rgba(239,68,68,0.08)"
    : days < 1
    ? "rgba(249,115,22,0.08)"
    : days < 3
    ? "rgba(234,179,8,0.08)"
    : "color-mix(in srgb, var(--th-accent) 8%, transparent)";

  const urgencyBorder = overdue
    ? "rgba(239,68,68,0.25)"
    : days < 1
    ? "rgba(249,115,22,0.25)"
    : days < 3
    ? "rgba(234,179,8,0.25)"
    : "color-mix(in srgb, var(--th-accent) 20%, transparent)";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: urgencyBg,
        border: `1px solid ${urgencyBorder}`,
        borderRadius: 10,
        padding: "7px 14px",
        marginTop: 8,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      {overdue ? (
        <span style={{ color, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
          DEADLINE PASSED
        </span>
      ) : (
        <span style={{ color, fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {days > 0 && <>{days}d </>}{pad(hours)}h {pad(mins)}m {pad(secs)}s left
        </span>
      )}
      <span style={{ color: "var(--th-text-2)", fontSize: 11 }}>
        · {new Date(deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      </span>
    </div>
  );
}

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

type Tab = "board" | "history" | "contributions" | "files" | "activity" | "chat";

type EditState = {
  task: Task;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  outputType: string;
  saving: boolean;
};

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
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
  const taskOutputInputRef = useRef<HTMLInputElement>(null);
  const [uploadingOutputTaskId, setUploadingOutputTaskId] = useState<string | null>(null);
  const [outputFileError, setOutputFileError] = useState<{ taskId: string; outputType: string; uploadedName: string } | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [viewingMember, setViewingMember] = useState<{ member: Member; profile: MemberFullProfile | null; loading: boolean } | null>(null);
  const [boardSwipeIdx, setBoardSwipeIdx] = useState(0);
  const swipeRef = useRef<{ startX: number; startY: number } | null>(null);
  const [backHovered, setBackHovered] = useState(false);
  const [deadlineEditing, setDeadlineEditing] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState("");
  const [deadlineSaving, setDeadlineSaving] = useState(false);
  const [dangerWorking, setDangerWorking] = useState(false);

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
        setDeadlineValue(data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : "");
        setLoading(false);
      });
  }, [id]);

  // ⌘/Ctrl + 1-6 → switch tabs
  useEffect(() => {
    const TAB_KEYS: Tab[] = ["board", "history", "contributions", "files", "activity", "chat"];
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 6) {
        const el = document.activeElement;
        const inInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
        if (inInput) return;
        e.preventDefault();
        setTab(TAB_KEYS[n - 1]);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function moveTask(task: Task) {
    if (!project) return;
    const newStatus = NEXT_STATUS[task.status];

    // Block DONE if output is required but not submitted (button is hidden, this is a safety guard)
    if (newStatus === "DONE" && task.outputType && !task.outputFileUrl) return;

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

    if (newStatus === "DONE") sounds.complete();

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

  function openTaskOutputUpload(taskId: string, outputType: string) {
    const config = OUTPUT_CONFIG[outputType];
    if (!config || !taskOutputInputRef.current) return;
    // Block upload if deadline passed and no file yet
    const task = project?.tasks.find((t) => t.id === taskId);
    if (task?.dueDate && !task.outputFileUrl && new Date() > new Date(task.dueDate)) return;
    setUploadingOutputTaskId(taskId);
    taskOutputInputRef.current.accept = config.accept;
    taskOutputInputRef.current.click();
  }

  async function handleTaskOutputUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadingOutputTaskId) return;

    // Validate file type against the task's required output type
    const task = project?.tasks.find((t) => t.id === uploadingOutputTaskId);
    if (task?.outputType && !isValidOutputFile(file.name, task.outputType)) {
      setOutputFileError({ taskId: uploadingOutputTaskId, outputType: task.outputType, uploadedName: file.name });
      setUploadingOutputTaskId(null);
      if (taskOutputInputRef.current) taskOutputInputRef.current.value = "";
      return;
    }

    try {
      const supabase = createClient();
      // Reuse the existing project-files bucket
      const path = `${id}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("project-files")
        .upload(path, file, { upsert: false });
      if (uploadErr) throw new Error(uploadErr.message);
      const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // Save to project files so it shows in the Files tab
      const fileRes = await fetch(`/api/projects/${id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, url: publicUrl, size: file.size, mimeType: file.type }),
      });
      if (fileRes.ok) {
        const saved = await fileRes.json();
        setFiles((prev) => [saved, ...prev]);
      }

      // Link the file URL to the task
      const taskRes = await fetch(`/api/projects/${id}/tasks/${uploadingOutputTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputFileUrl: publicUrl, outputFileName: file.name }),
      });
      if (taskRes.ok) {
        const updated: Task = await taskRes.json();
        setProject((prev) =>
          prev ? { ...prev, tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)) } : prev
        );
      }
    } catch (err) {
      console.error("Task output upload failed:", err);
    } finally {
      setUploadingOutputTaskId(null);
      if (taskOutputInputRef.current) taskOutputInputRef.current.value = "";
    }
  }

  async function kickMember(memberId: string) {
    const ok = await confirm({ title: "Remove member?", message: "This member will lose access to the project.", variant: "delete", confirmLabel: "Remove" });
    if (!ok) return;
    const res = await fetch(`/api/projects/${id}/members/${memberId}`, { method: "DELETE" });
    if (res.ok) {
      setProject((prev) =>
        prev ? { ...prev, members: prev.members.filter((m) => m.id !== memberId) } : prev
      );
    }
  }

  async function leaveProject(memberId: string) {
    const ok = await confirm({ title: "Leave this project?", message: "You will lose access and cannot rejoin unless re-invited.", variant: "delete", confirmLabel: "Leave" });
    if (!ok) return;
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
      outputType: task.outputType ?? "",
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
        outputType: editState.outputType || null,
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

  async function handleSaveDeadline() {
    setDeadlineSaving(true);
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline: deadlineValue || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject((prev) => prev ? { ...prev, deadline: updated.deadline } : prev);
    }
    setDeadlineSaving(false);
    setDeadlineEditing(false);
  }

  async function markProjectDone() {
    const ok = await confirm({ title: "Mark as complete?", message: "This project will be archived. You can still view it in Archive.", variant: "update", confirmLabel: "Mark Complete" });
    if (!ok) return;
    sounds.complete();
    setDangerWorking(true);
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ARCHIVED", archivedReason: "COMPLETED" }),
    });
    if (res.ok) router.push("/dashboard/archive");
    else setDangerWorking(false);
  }

  async function deleteProject() {
    const ok = await confirm({ title: "Delete this project?", message: "It will be moved to Trash. You can restore it within 30 days.", variant: "delete", confirmText: project?.name });
    if (!ok) return;
    sounds.trash();
    setDangerWorking(true);
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/projects");
    else setDangerWorking(false);
  }

  async function terminateProject() {
    const ok = await confirm({
      title: "Terminate this project?",
      message: "This will permanently delete the project for you and all team members. This cannot be undone.",
      variant: "terminate",
      confirmText: project?.name,
    });
    if (!ok) return;
    sounds.trash();
    setDangerWorking(true);
    const res = await fetch(`/api/projects/${id}/terminate`, { method: "POST" });
    if (res.ok) router.push("/dashboard/projects");
    else setDangerWorking(false);
  }

  function onBoardTouchStart(e: React.TouchEvent) {
    swipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
  }

  function onBoardTouchEnd(e: React.TouchEvent) {
    if (!swipeRef.current) return;
    const dx = e.changedTouches[0].clientX - swipeRef.current.startX;
    const dy = e.changedTouches[0].clientY - swipeRef.current.startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
      if (dx < 0) setBoardSwipeIdx((i) => Math.min(i + 1, 2));
      else setBoardSwipeIdx((i) => Math.max(i - 1, 0));
    }
    swipeRef.current = null;
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
    { key: "chat", label: "Chat" },
  ];

  return (
    <div>
      {dialog}
      {/* Back button */}
      <div style={{ marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => router.back()}
          onMouseEnter={() => setBackHovered(true)}
          onMouseLeave={() => setBackHovered(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            color: backHovered ? "var(--th-accent)" : "var(--th-text-2)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            padding: "7px 14px 7px 10px",
            borderRadius: 10,
            border: `1.5px solid ${backHovered ? "var(--th-accent)" : "var(--th-border)"}`,
            background: backHovered
              ? "color-mix(in srgb, var(--th-accent) 8%, var(--th-card))"
              : "var(--th-card)",
            transition: "color 0.18s ease, border-color 0.18s ease, background 0.18s ease",
            userSelect: "none",
            cursor: "pointer",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            style={{
              transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
              transform: backHovered ? "translateX(-4px)" : "translateX(0)",
              flexShrink: 0,
            }}
          >
            <path
              d="M8.5 2L3.5 6.5L8.5 11"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      </div>

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
          {/* Deadline: countdown + inline edit for leaders */}
          {(() => {
            const myMember = project.members.find((m) => m.user.id === currentUserId);
            const isPrivileged = myMember?.role === "TEAM_LEADER" || myMember?.role === "PROFESSOR";
            return (
              <div className="mt-2">
                {deadlineEditing ? (
                  <div className="flex flex-col gap-2" style={{ maxWidth: 320 }}>
                    <DeadlinePicker value={deadlineValue} onChange={setDeadlineValue} />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveDeadline}
                        disabled={deadlineSaving}
                        style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none", borderRadius: 8, padding: "6px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: deadlineSaving ? 0.6 : 1 }}
                      >
                        {deadlineSaving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => { setDeadlineEditing(false); setDeadlineValue(project.deadline ? new Date(project.deadline).toISOString().slice(0, 16) : ""); }}
                        style={{ color: "var(--th-text-2)", background: "none", border: "1px solid var(--th-border)", borderRadius: 8, fontSize: 12, cursor: "pointer", padding: "6px 12px" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    {project.deadline ? (
                      <DeadlineCountdown deadline={project.deadline} />
                    ) : isPrivileged ? (
                      <span style={{ color: "var(--th-text-2)", fontSize: 12 }}>No deadline set.</span>
                    ) : null}
                    {isPrivileged && (
                      <button
                        onClick={() => setDeadlineEditing(true)}
                        style={{ color: "var(--th-text-2)", background: "none", border: "1px solid var(--th-border)", borderRadius: 7, padding: "4px 10px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "color 0.14s, border-color 0.14s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--th-accent)"; e.currentTarget.style.borderColor = "var(--th-accent)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--th-text-2)"; e.currentTarget.style.borderColor = "var(--th-border)"; }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        {project.deadline ? "Edit deadline" : "Set deadline"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        <div className="flex gap-2 flex-wrap shrink-0">
          {currentUserGlobalRole === "PROFESSOR" && (
            <Link
              href={`/dashboard/monitor/${id}`}
              style={{ border: "1px solid var(--th-accent)", color: "var(--th-accent)" }}
              className="text-sm px-3 py-2.5 rounded-md hover:opacity-70 transition min-h-[44px] flex items-center"
            >
              Monitor View
            </Link>
          )}
          <Link
            href={`/dashboard/projects/${id}/review`}
            style={{ border: "1px solid var(--th-border)", color: "var(--th-text-2)" }}
            className="text-sm px-3 py-2.5 rounded-md hover:opacity-70 transition min-h-[44px] flex items-center"
          >
            Peer Review
          </Link>
          <Link
            href={`/dashboard/projects/${id}/tasks/new`}
            style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
            className="text-sm px-3 py-2.5 rounded-md font-medium hover:opacity-80 transition min-h-[44px] flex items-center"
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
                  className="flex items-center gap-2 rounded-full pl-1.5 pr-2.5 py-1.5 min-h-[36px]"
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
                className="text-xs rounded-full px-3 py-2 hover:opacity-70 transition min-h-[36px] flex items-center"
              >
                + Invite
              </Link>
            )}
            {myMember && myMember.role !== "TEAM_LEADER" && (
              <button
                onClick={() => leaveProject(myMember.id)}
                style={{ color: "#ef4444", fontSize: 12, cursor: "pointer" }}
                className="hover:opacity-70 transition ml-1 px-2 py-1.5 min-h-[36px] flex items-center"
              >
                Leave project
              </button>
            )}
          </div>
        );
      })()}

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--th-border)" }} className="flex gap-0 mb-6 overflow-x-auto -mx-1 px-1">
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
              transition: "color 0.15s, border-color 0.15s",
            }}
            className="px-3 md:px-4 py-3 text-sm font-medium cursor-pointer whitespace-nowrap shrink-0 min-h-[44px] flex items-center"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Board Tab */}
      {tab === "board" && (() => {
        const myMember = project.members.find((m) => m.user.id === currentUserId);
        const isPrivileged = myMember?.role === "TEAM_LEADER" || myMember?.role === "PROFESSOR";
        const colClass: Record<string, string> = {
          TODO: "nc-col-todo",
          IN_PROGRESS: "nc-col-inprogress",
          DONE: "nc-col-done",
        };

        // Shared task card renderer used by both mobile + desktop
        function renderTaskCards(col: typeof COLUMNS[number]) {
          return (
            <div className="space-y-2">
              {col.tasks.map((task) => (
                <div
                  key={task.id}
                  style={{ background: "var(--th-bg)", border: "1px solid var(--th-border)" }}
                  className="nc-task-card rounded-lg p-3"
                >
                  <p style={{ color: "var(--th-text)" }} className="text-sm font-semibold">{task.title}</p>
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
                  {/* Output + actions — unified block */}
                  {(() => {
                    const isAssignee = task.assigneeId === currentUserId;
                    const canAction = isAssignee;
                    const canEdit = isAssignee || isPrivileged;
                    const cfg = task.outputType ? OUTPUT_CONFIG[task.outputType] : null;
                    const submitted = !!task.outputFileUrl;
                    const isOverdue = !submitted && !!task.dueDate && new Date() > new Date(task.dueDate);
                    const outputPending = !!task.outputType && !submitted;
                    const hideCompleteBtn = task.status === "IN_PROGRESS" && outputPending;

                    return (
                      <>
                        {/* Output section */}
                        {cfg && (
                          task.status === "IN_PROGRESS" && isAssignee ? (
                            submitted ? (
                              // ✅ Submitted
                              <div style={{ marginTop: 8, padding: "7px 10px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)", borderRadius: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700 }}>Output submitted — {cfg.label}</span>
                                </div>
                                <a href={task.outputFileUrl!} target="_blank" rel="noopener noreferrer"
                                  style={{ color: "#22c55e", fontSize: 10, opacity: 0.8, textDecoration: "underline", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                  title={task.outputFileName ?? ""}>{task.outputFileName}</a>
                              </div>
                            ) : isOverdue ? (
                              // 🔒 Deadline passed, locked
                              <div style={{ marginTop: 8, padding: "7px 10px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                  <span style={{ color: "#ef4444", fontSize: 11, fontWeight: 700 }}>Deadline passed — task locked</span>
                                </div>
                                <p style={{ color: "#ef4444", fontSize: 10, opacity: 0.75, marginTop: 2 }}>{cfg.label} was not submitted before the deadline.</p>
                              </div>
                            ) : (
                              // ⏳ Upload required
                              <div style={{ marginTop: 8, padding: "7px 10px", background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.22)", borderRadius: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    <span style={{ color: "#f97316", fontSize: 11, fontWeight: 700 }}>{cfg.label} required to complete</span>
                                  </div>
                                  <button
                                    onClick={() => openTaskOutputUpload(task.id, task.outputType!)}
                                    disabled={uploadingOutputTaskId === task.id}
                                    style={{ color: "#f97316", border: "1px solid rgba(249,115,22,0.4)", borderRadius: 6, background: "rgba(249,115,22,0.1)", fontSize: 10, fontWeight: 600, padding: "3px 9px", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
                                  >
                                    {uploadingOutputTaskId === task.id ? "…" : "Upload"}
                                  </button>
                                </div>
                                <p style={{ color: "var(--th-text-2)", fontSize: 10, marginTop: 3 }}>Also uploadable from the Files tab.</p>
                              </div>
                            )
                          ) : (
                            // Compact badge for non-assignee or other statuses
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                              <div style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                background: submitted ? "rgba(34,197,94,0.10)" : `color-mix(in srgb, ${cfg.color} 10%, transparent)`,
                                border: `1px solid ${submitted ? "rgba(34,197,94,0.3)" : `color-mix(in srgb, ${cfg.color} 30%, transparent)`}`,
                                borderRadius: 6, padding: "2px 7px",
                              }}>
                                {submitted
                                  ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                }
                                <span style={{ color: submitted ? "#22c55e" : cfg.color, fontSize: 9, fontWeight: 700 }}>
                                  {submitted ? `${cfg.label} submitted` : `${cfg.label} required`}
                                </span>
                              </div>
                              {submitted && task.outputFileName && (
                                <a href={task.outputFileUrl!} target="_blank" rel="noopener noreferrer"
                                  style={{ color: "var(--th-text-2)", fontSize: 9, textDecoration: "underline", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                  title={task.outputFileName}>{task.outputFileName}</a>
                              )}
                            </div>
                          )
                        )}
                        {/* Action buttons */}
                        {(canAction || canEdit) && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {canAction && !hideCompleteBtn && (
                              <button
                                onClick={() => moveTask(task)}
                                disabled={updating === task.id}
                                style={{ color: "var(--th-accent)", border: "1px solid color-mix(in srgb,var(--th-accent) 30%,transparent)", borderRadius: 6 }}
                                className="text-xs px-2.5 py-1.5 hover:opacity-70 transition disabled:opacity-30 cursor-pointer min-h-[32px] flex items-center"
                              >
                                {updating === task.id ? "…" : `→ ${STATUS_LABEL[task.status]}`}
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => openEdit(task)}
                                style={{ color: "var(--th-text-2)", border: "1px solid var(--th-border)", borderRadius: 6 }}
                                className="text-xs px-2.5 py-1.5 hover:opacity-70 transition cursor-pointer min-h-[32px] flex items-center"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ))}
              {col.tasks.length === 0 && (
                <p style={{ color: "var(--th-text-2)" }} className="text-xs text-center py-10 opacity-50">Empty</p>
              )}
            </div>
          );
        }

        return (
          <>
            {/* ── Mobile: Tinder-style swipe view ──────────────────── */}
            <div
              className="md:hidden nc-tab-panel"
              onTouchStart={onBoardTouchStart}
              onTouchEnd={onBoardTouchEnd}
              style={{ touchAction: "pan-y" }}
            >
              {/* Column selector pills */}
              <div className="flex gap-2 mb-4 justify-center">
                {COLUMNS.map((col, i) => (
                  <button
                    key={col.status}
                    onClick={() => setBoardSwipeIdx(i)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: boardSwipeIdx === i ? 600 : 400,
                      background: boardSwipeIdx === i ? "var(--th-accent)" : "var(--th-card)",
                      color: boardSwipeIdx === i ? "var(--th-accent-fg)" : "var(--th-text-2)",
                      border: boardSwipeIdx === i ? "1px solid var(--th-accent)" : "1px solid var(--th-border)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {col.label} · {col.tasks.length}
                  </button>
                ))}
              </div>

              {/* Sliding rail */}
              <div style={{ overflow: "hidden", borderRadius: 16 }}>
                <div
                  style={{
                    display: "flex",
                    transform: `translateX(${-boardSwipeIdx * 100}%)`,
                    transition: "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    willChange: "transform",
                  }}
                >
                  {COLUMNS.map((col) => (
                    <div
                      key={col.status}
                      style={{
                        minWidth: "100%",
                        flexShrink: 0,
                        background: "var(--th-card)",
                        border: "1px solid var(--th-border)",
                        borderRadius: 16,
                        padding: 16,
                      }}
                      className={colClass[col.status] ?? ""}
                    >
                      <h3 style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest mb-3">
                        {col.label} ({col.tasks.length})
                      </h3>
                      {renderTaskCards(col)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dot / progress indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {COLUMNS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBoardSwipeIdx(i)}
                    style={{
                      width: boardSwipeIdx === i ? 22 : 6,
                      height: 6,
                      borderRadius: 999,
                      background: boardSwipeIdx === i ? "var(--th-accent)" : "var(--th-border)",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ── Desktop: normal 3-column grid ────────────────────── */}
            <div className="hidden md:block nc-tab-panel">
              <div className="nc-kanban-scroll">
                {COLUMNS.map((col) => (
                  <div
                    key={col.status}
                    style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
                    className={`nc-kanban-col rounded-xl p-4 ${colClass[col.status] ?? ""}`}
                  >
                    <h3 style={{ color: "var(--th-text-2)" }} className="text-xs uppercase tracking-widest mb-3">
                      {col.label} ({col.tasks.length})
                    </h3>
                    {renderTaskCards(col)}
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      })()}

      {/* Contributions Tab */}
      {tab === "contributions" && (
        <div className="nc-tab-panel space-y-4">
          {contributions.length === 0 ? (
            <div className="text-center py-24">
              <p style={{ color: "var(--th-text-2)" }} className="text-sm">No contributions yet.</p>
              <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
                Complete tasks to see scores.
              </p>
            </div>
          ) : (
            contributions.map((s, i) => {
              const RANK_COLORS = [
                { bg: "rgba(255,200,50,0.12)", border: "rgba(255,200,50,0.35)", text: "#e8a020" },
                { bg: "rgba(180,190,200,0.12)", border: "rgba(180,190,200,0.35)", text: "#9aaab4" },
                { bg: "rgba(200,120,60,0.12)", border: "rgba(200,120,60,0.35)", text: "#c87840" },
              ];
              const rank = RANK_COLORS[i] ?? null;
              return (
              <div
                key={s.userId}
                style={{
                  background: "var(--th-card)",
                  border: `1px solid ${rank ? rank.border : "var(--th-border)"}`,
                  animationDelay: `${i * 0.07}s`,
                }}
                className="nc-u-in nc-card-lift rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {rank ? (
                      <span
                        className="nc-rank-badge"
                        style={{
                          background: rank.bg,
                          color: rank.text,
                          border: `1px solid ${rank.border}`,
                          borderRadius: 8,
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                          animationDelay: `${0.1 + i * 0.07}s`,
                        }}
                      >
                        #{i + 1}
                      </span>
                    ) : (
                      <span style={{ color: "var(--th-text-2)" }} className="text-sm font-bold">
                        #{i + 1}
                      </span>
                    )}
                    <span style={{ color: "var(--th-text)" }} className="font-semibold text-base">
                      {s.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span style={{ color: rank ? rank.text : "var(--th-accent)" }} className="text-3xl font-black">
                      {s.percentage}%
                    </span>
                    <p style={{ color: "var(--th-text-2)" }} className="text-xs">{s.points} pts</p>
                  </div>
                </div>

                <div style={{ background: "var(--th-border)" }} className="w-full h-1.5 rounded-full mb-4 overflow-hidden">
                  <div
                    style={{ background: rank ? rank.text : "var(--th-accent)", width: `${s.percentage}%` }}
                    className="nc-bar-anim h-1.5 rounded-full"
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
              );
            })
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="nc-tab-panel">
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
                .map((task, i) => (
                  <div
                    key={task.id}
                    style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", animationDelay: `${i * 0.04}s` }}
                    className="nc-u-in nc-row-slide rounded-lg p-4 flex items-center justify-between"
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
                      style={{ color: "var(--th-accent)", border: "1px solid color-mix(in srgb,var(--th-accent) 40%,transparent)", background: "color-mix(in srgb,var(--th-accent) 10%,transparent)" }}
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
        <div className="nc-tab-panel">
          {/* Pending Task Outputs for current user */}
          {(() => {
            const pending = project?.tasks.filter(
              (t) => t.assigneeId === currentUserId && t.outputType && !t.outputFileUrl && t.status === "IN_PROGRESS"
            ) ?? [];
            if (pending.length === 0) return null;
            return (
              <div style={{ marginBottom: 24 }}>
                <p style={{ color: "var(--th-text-2)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                  Pending Task Outputs
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pending.map((task) => {
                    const cfg = task.outputType ? OUTPUT_CONFIG[task.outputType] : null;
                    if (!cfg) return null;
                    const isOverdue = !!task.dueDate && new Date() > new Date(task.dueDate);
                    return (
                      <div key={task.id} style={{
                        background: isOverdue ? "rgba(239,68,68,0.05)" : `color-mix(in srgb, ${cfg.color} 6%, var(--th-card))`,
                        border: `1px solid ${isOverdue ? "rgba(239,68,68,0.2)" : `color-mix(in srgb, ${cfg.color} 25%, var(--th-border))`}`,
                        borderRadius: 10, padding: "10px 14px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ color: "var(--th-text)", fontSize: 13, fontWeight: 600 }}>{task.title}</p>
                          <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                            <span style={{ color: isOverdue ? "#ef4444" : cfg.color, fontSize: 11, fontWeight: 600 }}>
                              {cfg.label} required
                            </span>
                            {task.dueDate && (
                              <span style={{ color: isOverdue ? "#ef4444" : "var(--th-text-2)", fontSize: 11 }}>
                                · due {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {isOverdue ? (
                          <span style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            Locked
                          </span>
                        ) : (
                          <button
                            onClick={() => openTaskOutputUpload(task.id, task.outputType!)}
                            disabled={uploadingOutputTaskId === task.id}
                            style={{
                              color: cfg.color,
                              border: `1px solid color-mix(in srgb, ${cfg.color} 40%, transparent)`,
                              background: `color-mix(in srgb, ${cfg.color} 10%, transparent)`,
                              borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 600,
                              cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                            }}
                          >
                            {uploadingOutputTaskId === task.id ? "Uploading…" : `Upload ${cfg.label}`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
        <div className="nc-tab-panel max-w-xl">
          {activity.length === 0 ? (
            <div className="text-center py-24">
              <p style={{ color: "var(--th-text-2)" }} className="text-sm">No activity yet.</p>
            </div>
          ) : (
            <div className="nc-activity-feed space-y-0">
              {activity.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-3"
                  style={{ borderBottom: i < activity.length - 1 ? "1px solid var(--th-border)" : "none" }}
                >
                  {/* Actor avatar — acts as timeline node */}
                  <div
                    className={i === 0 ? "nc-activity-dot" : ""}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--th-accent)",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
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

      {/* Chat Tab */}
      {tab === "chat" && currentUserId && (
        <ProjectChat projectId={id} currentUserId={currentUserId} />
      )}

      {/* Danger Zone — team leaders only */}
      {(() => {
        const myMember = project.members.find((m) => m.user.id === currentUserId);
        if (myMember?.role !== "TEAM_LEADER") return null;
        const isOwner = project.ownerId === currentUserId;
        return (
          <div style={{ marginTop: 40, border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "20px 24px", background: "rgba(239,68,68,0.03)" }}>
            <p style={{ color: "#ef4444", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              Danger Zone
            </p>
            <p style={{ color: "var(--th-text-2)", fontSize: 12, marginBottom: 16 }}>
              These actions affect the entire project and all its members.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={markProjectDone}
                disabled={dangerWorking}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1px solid var(--th-border)", background: "var(--th-bg)", color: "var(--th-text)", fontSize: 12, fontWeight: 600, cursor: dangerWorking ? "not-allowed" : "pointer", opacity: dangerWorking ? 0.6 : 1, transition: "border-color 0.14s" }}
                onMouseEnter={(e) => { if (!dangerWorking) e.currentTarget.style.borderColor = "var(--th-accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--th-border)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--th-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Mark as Complete
              </button>
              <button
                onClick={deleteProject}
                disabled={dangerWorking}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.07)", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: dangerWorking ? "not-allowed" : "pointer", opacity: dangerWorking ? 0.6 : 1, transition: "background 0.14s" }}
                onMouseEnter={(e) => { if (!dangerWorking) e.currentTarget.style.background = "rgba(239,68,68,0.14)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,4 13,4"/><path d="M5.5 4V2.5h4V4"/><path d="M3.5 4l.7 8.5a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L11.5 4"/>
                </svg>
                Move to Trash
              </button>

              {/* Terminate — owner only */}
              {isOwner && (
                <button
                  onClick={terminateProject}
                  disabled={dangerWorking}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1.5px solid #ef4444", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: dangerWorking ? "not-allowed" : "pointer", opacity: dangerWorking ? 0.6 : 1, transition: "filter 0.14s", letterSpacing: "0.02em" }}
                  onMouseEnter={(e) => { if (!dangerWorking) e.currentTarget.style.filter = "brightness(1.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
                  title="Permanently deletes the project for all members. Owner only."
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3"/>
                  </svg>
                  Terminate Project
                </button>
              )}
            </div>
          </div>
        );
      })()}

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
              <DeadlinePicker
                value={editState.dueDate}
                onChange={(v) => setEditState((s) => s && { ...s, dueDate: v })}
                placeholder="Pick a due date…"
              />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <label style={{ color: "var(--th-text-2)" }} className="text-xs block">Required Output</label>
                <span style={{ color: "var(--th-text-2)", fontSize: 10, background: "var(--th-bg)", border: "1px solid var(--th-border)", borderRadius: 4, padding: "1px 6px" }}>Optional</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(OUTPUT_CONFIG).map(([type, cfg]) => {
                  const selected = editState.outputType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditState((s) => s && { ...s, outputType: selected ? "" : type })}
                      style={{
                        padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                        border: selected ? `1.5px solid ${cfg.color}` : "1.5px solid var(--th-border)",
                        background: selected ? `color-mix(in srgb, ${cfg.color} 12%, transparent)` : "var(--th-bg)",
                        color: selected ? cfg.color : "var(--th-text-2)",
                        fontSize: 12, fontWeight: selected ? 700 : 500,
                        transition: "all 0.15s",
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
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

      {/* Wrong file type error dialog */}
      {outputFileError && (() => {
        const cfg = OUTPUT_CONFIG[outputFileError.outputType];
        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
            onClick={() => setOutputFileError(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 18, padding: "28px 28px 24px", width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}
            >
              {/* Icon */}
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>

              <h3 style={{ color: "var(--th-text)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Wrong file type</h3>
              <p style={{ color: "var(--th-text-2)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                You uploaded{" "}
                <span style={{ color: "var(--th-text)", fontWeight: 600, wordBreak: "break-all" }}>
                  {outputFileError.uploadedName}
                </span>
                , but this task requires a{" "}
                <span style={{ color: cfg?.color ?? "var(--th-accent)", fontWeight: 700 }}>
                  {cfg?.label ?? outputFileError.outputType}
                </span>{" "}
                file.
              </p>

              {/* Expected types */}
              <div style={{ background: "var(--th-bg)", border: "1px solid var(--th-border)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
                <p style={{ color: "var(--th-text-2)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                  Accepted formats
                </p>
                <p style={{ color: cfg?.color ?? "var(--th-accent)", fontSize: 12, fontWeight: 600 }}>
                  {cfg?.exts.join(", ") ?? ""}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setOutputFileError(null)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid var(--th-border)", background: "none", color: "var(--th-text-2)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const { taskId, outputType } = outputFileError;
                    setOutputFileError(null);
                    // Re-open the file picker with the correct filter
                    setTimeout(() => openTaskOutputUpload(taskId, outputType), 50);
                  }}
                  style={{ flex: 2, padding: "9px 0", borderRadius: 10, border: "none", background: cfg?.color ?? "var(--th-accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Always-mounted hidden input for task output uploads (works from any tab) */}
      <input ref={taskOutputInputRef} type="file" className="hidden" onChange={handleTaskOutputUpload} />
    </div>
  );
}
