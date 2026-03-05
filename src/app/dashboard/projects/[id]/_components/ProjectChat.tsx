"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Sender = { id: string; name: string; preferredName: string | null; avatarUrl: string | null };
type Reaction = { userId: string; emoji: string };
type Message = {
  id: string;
  text: string | null;
  imageUrl: string | null;
  createdAt: string;
  sender: Sender;
  reactions: Reaction[];
};

const COMMON_EMOJIS = [
  "😀","😂","😍","🤔","😭","😊","🥺","😎","🤯","🥳",
  "👍","👎","👏","🙌","🤝","🙏","💪","✌️","👀","🫡",
  "❤️","🔥","✅","💯","🎉","⭐","🚀","💡","🎯","💎",
  "😅","😴","🤗","😤","😬","🥲","😇","🤩","😏","🫠",
];

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

function initials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0][0] ?? "?").toUpperCase();
}

function Avatar({ user, size = 32 }: { user: Sender; size?: number }) {
  const display = user.preferredName || user.name;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--th-accent)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt={display} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ color: "var(--th-accent-fg)", fontSize: size * 0.38, fontWeight: 700, lineHeight: 1 }}>{initials(display)}</span>
      )}
    </div>
  );
}

function isEmojiOnly(text: string | null): boolean {
  if (!text || !text.trim()) return false;
  return !/[a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>?/\\`~]/.test(text);
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" }) + ` ${time}`;
  if (diffDays < 365) return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ` · ${time}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) + ` · ${time}`;
}

function isSameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function DateSeparator({ dateStr }: { dateStr: string }) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  const label = diffDays === 0 ? "Today"
    : diffDays === 1 ? "Yesterday"
    : diffDays < 7 ? d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
    : d.toLocaleDateString([], { month: "long", day: "numeric", year: diffDays >= 365 ? "numeric" : undefined });
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "16px 16px 8px" }}>
      <span style={{
        fontSize: 11,
        color: "var(--th-text-2)",
        fontWeight: 500,
        background: "color-mix(in srgb, var(--th-border) 80%, transparent)",
        padding: "4px 14px",
        borderRadius: 999,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
    </div>
  );
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────

function IconSend() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconHeart({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconEmoji() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="9" cy="10" r="1.2" fill="currentColor"/>
      <circle cx="15" cy="10" r="1.2" fill="currentColor"/>
    </svg>
  );
}

function IconGallery() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProjectChat({
  projectId,
  currentUserId,
}: {
  projectId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [myEmoji, setMyEmoji] = useState("👍");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionCustomizer, setShowReactionCustomizer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) setMessages(data.messages);
      if (data.myReactionEmoji) setMyEmoji(data.myReactionEmoji);
    } catch {
      // network error — silently ignore
    }
  }, [projectId]);

  useEffect(() => {
    fetchMessages().finally(() => setLoading(false));
  }, [fetchMessages]);

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase.channel(`chat-${projectId}`) as any)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ChatMessage",
        filter: `projectId=eq.${projectId}`,
      }, () => { fetchMessages(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchMessages]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target as Node)) {
        setShowReactionCustomizer(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function sendMessage(textOverride?: string, imageUrl?: string) {
    const content = textOverride !== undefined ? textOverride : text.trim();
    if (!content && !imageUrl) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content || null, imageUrl: imageUrl || null }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setText("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      } else {
        const data = await res.json().catch(() => ({}));
        setSendError(data?.error ?? `Failed to send (${res.status})`);
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSending(false);
    }
  }

  async function toggleReaction(messageId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const { reactions } = await res.json();
        setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions } : m));
      }
    } catch { /* ignore */ }
  }

  async function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    setSendError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `chat/${projectId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("project-files").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("project-files").getPublicUrl(path);
      await sendMessage("", data.publicUrl);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  function openCamera() {
    setCapturedPhoto(null);
    setCameraError(null);
    setShowCamera(true);
    // Stream is started in useEffect after the video element mounts
  }

  // Start camera stream once after modal mounts — no capturedPhoto dependency
  // to avoid re-requesting the stream on retake (which causes "permission denied")
  useEffect(() => {
    if (!showCamera) return;
    let cancelled = false;

    async function startStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        if (!cancelled) {
          const isDenied = err instanceof Error && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
          setCameraError(isDenied
            ? "Camera access was denied. Click the camera icon in your browser's address bar and allow access, then try again."
            : err instanceof Error ? err.message : "Camera unavailable");
        }
      }
    }

    startStream();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCamera]); // intentionally excludes capturedPhoto — stream is requested once per session

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setShowCamera(false);
    setCapturedPhoto(null);
    setCameraError(null);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.92));
    video.pause(); // pause playback — keeps stream alive, avoids re-requesting
  }

  function retakePhoto() {
    setCapturedPhoto(null);
    videoRef.current?.play(); // resume existing stream
  }

  async function sendCapturedPhoto() {
    if (!capturedPhoto) return;
    closeCamera();
    setUploading(true);
    setSendError(null);
    try {
      const res = await fetch(capturedPhoto);
      const blob = await res.blob();
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      await handleImageFile(file);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send photo");
      setUploading(false);
    }
  }

  async function saveReactionEmoji(emoji: string) {
    setMyEmoji(emoji);
    setShowReactionCustomizer(false);
    await fetch(`/api/projects/${projectId}/chat/reaction-preference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
  }

  function insertEmoji(emoji: string) {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter (without Shift) or ⌘+Enter / Ctrl+Enter → send
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  const hasText = text.trim().length > 0;

  return (
    <div
      className="nc-tab-panel"
      style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 280px)", minHeight: 400, maxHeight: 680, position: "relative" }}
    >
      {/* ── Message list ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0 4px", display: "flex", flexDirection: "column" }}>
        {loading ? (
          /* Skeleton */
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "12px 16px" }}>
            {[72, 48, 88].map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexDirection: i % 2 === 0 ? "row" : "row-reverse" }}>
                {i % 2 === 0 && <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--th-border)" }} className="animate-pulse" />}
                <div style={{ width: `${w}%`, maxWidth: 260, height: 38, borderRadius: 18, background: "var(--th-border)" }} className="animate-pulse" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          /* Empty state */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "color-mix(in srgb, var(--th-accent) 12%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
              💬
            </div>
            <p style={{ color: "var(--th-text-2)", fontSize: 14, fontWeight: 500 }}>No messages yet</p>
            <p style={{ color: "var(--th-text-2)", fontSize: 12, opacity: 0.7 }}>Say hi to your team!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender.id === currentUserId;
            const prevMsg = messages[i - 1];
            const nextMsg = messages[i + 1];
            const sameGroupPrev = prevMsg?.sender.id === msg.sender.id &&
              new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000;
            const sameGroupNext = nextMsg?.sender.id === msg.sender.id &&
              new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() < 5 * 60 * 1000;
            const showDaySep = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);
            const displayName = msg.sender.preferredName || msg.sender.name;
            const emojiOnly = !msg.imageUrl && isEmojiOnly(msg.text);
            const isHovered = hoveredMsgId === msg.id;

            // Reaction groups
            const reactionGroups: Record<string, number> = {};
            for (const r of msg.reactions) reactionGroups[r.emoji] = (reactionGroups[r.emoji] || 0) + 1;
            const reactionEntries = Object.entries(reactionGroups);
            const myReaction = msg.reactions.find((r) => r.userId === currentUserId)?.emoji;

            // Instagram-style bubble radius
            const getRadius = () => {
              const r = 20;
              const small = 5;
              if (isMine) {
                // Own: rounded left, connected on right
                const tl = r, tr = sameGroupPrev ? small : r;
                const bl = r, br = sameGroupNext ? small : r;
                return `${tl}px ${tr}px ${br}px ${bl}px`;
              } else {
                // Others: connected on left
                const tl = sameGroupPrev ? small : r, tr = r;
                const bl = sameGroupNext ? small : r, br = r;
                return `${tl}px ${tr}px ${br}px ${bl}px`;
              }
            };

            return (
              <div key={msg.id}>
                {showDaySep && <DateSeparator dateStr={msg.createdAt} />}

                <div
                  style={{
                    display: "flex",
                    flexDirection: isMine ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: 8,
                    padding: `${sameGroupPrev ? 1 : 6}px 12px ${sameGroupNext ? 1 : 6}px`,
                  }}
                  onMouseEnter={() => setHoveredMsgId(msg.id)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  {/* Avatar — only for others, only for last in group */}
                  <div style={{ width: 32, flexShrink: 0 }}>
                    {!isMine && !sameGroupNext ? (
                      <div title={displayName}>
                        <Avatar user={msg.sender} size={32} />
                      </div>
                    ) : (
                      <div style={{ width: 32 }} />
                    )}
                  </div>

                  {/* Bubble + meta */}
                  <div style={{ maxWidth: "66%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: 3 }}>

                    {/* Sender name — first in group only, for others */}
                    {!isMine && !sameGroupPrev && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--th-text-2)", paddingLeft: 4, letterSpacing: "0.01em" }}>
                        {displayName}
                      </span>
                    )}

                    {/* Row: quick-react button + bubble */}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: isMine ? "row" : "row-reverse" }}>

                      {/* Quick heart reaction on hover */}
                      <button
                        onClick={() => toggleReaction(msg.id)}
                        title={`React with ${myEmoji}`}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "2px 4px",
                          borderRadius: 8,
                          fontSize: 16,
                          opacity: isHovered ? 1 : 0,
                          transition: "opacity 0.15s, transform 0.1s",
                          transform: isHovered ? "scale(1)" : "scale(0.7)",
                          color: myReaction ? "var(--th-accent)" : "var(--th-text-2)",
                          flexShrink: 0,
                        }}
                        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.85)")}
                        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <IconHeart filled={!!myReaction} />
                      </button>

                      {/* Bubble */}
                      {emojiOnly ? (
                        <span
                          style={{ fontSize: 38, lineHeight: 1.2, userSelect: "none", padding: "2px 0" }}
                          title={formatTime(msg.createdAt)}
                        >
                          {msg.text}
                        </span>
                      ) : (
                        <div
                          style={{
                            background: isMine ? "var(--th-accent)" : "var(--th-card)",
                            color: isMine ? "var(--th-accent-fg)" : "var(--th-text)",
                            border: isMine ? "none" : "1px solid var(--th-border)",
                            borderRadius: getRadius(),
                            padding: msg.imageUrl && !msg.text ? "3px" : "10px 14px",
                            fontSize: 14,
                            lineHeight: 1.45,
                            wordBreak: "break-word",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                          }}
                        >
                          {msg.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={msg.imageUrl}
                              alt="shared image"
                              style={{ maxWidth: 240, maxHeight: 280, borderRadius: 16, display: "block", cursor: "pointer" }}
                              onClick={() => window.open(msg.imageUrl!, "_blank")}
                            />
                          )}
                          {msg.text && <span>{msg.text}</span>}
                        </div>
                      )}
                    </div>

                    {/* Reactions pill row */}
                    {reactionEntries.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: isMine ? 0 : 4, paddingRight: isMine ? 4 : 0 }}>
                        {reactionEntries.map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              background: myReaction === emoji
                                ? "color-mix(in srgb, var(--th-accent) 18%, transparent)"
                                : "var(--th-card)",
                              border: myReaction === emoji
                                ? "1px solid color-mix(in srgb, var(--th-accent) 40%, transparent)"
                                : "1px solid var(--th-border)",
                              borderRadius: 999,
                              padding: "2px 8px",
                              fontSize: 12,
                              cursor: "pointer",
                              lineHeight: 1.6,
                              transition: "background 0.15s",
                            }}
                          >
                            <span style={{ fontSize: 13 }}>{emoji}</span>
                            {count > 1 && <span style={{ color: "var(--th-text-2)", fontWeight: 500, fontSize: 11 }}>{count}</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp — always at end of group, fade-in on hover for mid-group */}
                    {(!sameGroupNext || isHovered) && (
                      <span style={{
                        fontSize: 10,
                        color: "var(--th-text-2)",
                        paddingLeft: isMine ? 0 : 4,
                        paddingRight: isMine ? 4 : 0,
                        letterSpacing: "0.01em",
                        opacity: !sameGroupNext ? 0.7 : 1,
                        transition: "opacity 0.15s",
                      }}>
                        {formatTime(msg.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Emoji picker popover ───────────────────────────────────────── */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          style={{
            position: "absolute",
            bottom: 72,
            left: 12,
            background: "var(--th-card)",
            border: "1px solid var(--th-border)",
            borderRadius: 16,
            padding: 12,
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: 2,
            zIndex: 20,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}
        >
          {COMMON_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => insertEmoji(e)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: "3px 4px", borderRadius: 8, lineHeight: 1.2, transition: "background 0.1s" }}
              onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--th-border)")}
              onMouseLeave={(ev) => (ev.currentTarget.style.background = "none")}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* ── Reaction customizer popover ───────────────────────────────── */}
      {showReactionCustomizer && (
        <div
          ref={reactionPickerRef}
          style={{
            position: "absolute",
            bottom: 72,
            right: 12,
            background: "var(--th-card)",
            border: "1px solid var(--th-border)",
            borderRadius: 16,
            padding: 12,
            zIndex: 20,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            minWidth: 270,
          }}
        >
          <p style={{ fontSize: 11, color: "var(--th-text-2)", marginBottom: 10, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Quick reaction
          </p>
          {/* Quick row */}
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => saveReactionEmoji(e)}
                style={{
                  flex: 1,
                  background: myEmoji === e ? "color-mix(in srgb, var(--th-accent) 18%, transparent)" : "var(--th-bg)",
                  border: myEmoji === e ? "1px solid var(--th-accent)" : "1px solid var(--th-border)",
                  cursor: "pointer", fontSize: 22, padding: "6px 4px", borderRadius: 10, lineHeight: 1.2, transition: "background 0.1s",
                }}
              >
                {e}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--th-text-2)", marginBottom: 8, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>All emojis</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 2 }}>
            {COMMON_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => saveReactionEmoji(e)}
                style={{
                  background: myEmoji === e ? "color-mix(in srgb, var(--th-accent) 20%, transparent)" : "none",
                  border: myEmoji === e ? "1px solid var(--th-accent)" : "1px solid transparent",
                  cursor: "pointer", fontSize: 18, padding: "2px 3px", borderRadius: 6, lineHeight: 1.2, transition: "background 0.1s",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Send error ────────────────────────────────────────────────── */}
      {sendError && (
        <div style={{ padding: "6px 14px", fontSize: 12, color: "#e53e3e", background: "rgba(229,62,62,0.07)", borderTop: "1px solid rgba(229,62,62,0.18)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{sendError}</span>
          <button onClick={() => setSendError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", fontSize: 16, padding: "0 2px", lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Input bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid var(--th-border)",
          padding: "10px 12px",
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        {/* Left icons */}
        <button
          onClick={() => { setShowEmojiPicker((v) => !v); setShowReactionCustomizer(false); }}
          title="Insert emoji"
          style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: 10, lineHeight: 0, flexShrink: 0, color: "var(--th-text-2)", transition: "color 0.15s, background 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--th-border)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <IconEmoji />
        </button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }}
        />
        <button
          onClick={() => imageInputRef.current?.click()}
          title="Upload image"
          disabled={uploading}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: 10, lineHeight: 0, flexShrink: 0, color: "var(--th-text-2)", opacity: uploading ? 0.4 : 1, transition: "color 0.15s, background 0.15s" }}
          onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.background = "var(--th-border)"; }}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <IconGallery />
        </button>

        <button
          onClick={openCamera}
          title="Take photo"
          disabled={uploading}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: 10, lineHeight: 0, flexShrink: 0, color: "var(--th-text-2)", opacity: uploading ? 0.4 : 1, transition: "color 0.15s, background 0.15s" }}
          onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.background = "var(--th-border)"; }}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <IconCamera />
        </button>

        {/* Pill text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          style={{
            flex: 1,
            background: "var(--th-bg)",
            border: "1.5px solid var(--th-border)",
            color: "var(--th-text)",
            borderRadius: 999,
            padding: "9px 16px",
            fontSize: 14,
            resize: "none",
            outline: "none",
            lineHeight: 1.4,
            overflowY: "hidden",
            transition: "border-color 0.15s",
            minHeight: 40,
            maxHeight: 120,
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--th-accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--th-border)")}
        />

        {/* Right: send arrow when typing, heart+customizer when idle */}
        {hasText ? (
          <button
            onClick={() => sendMessage()}
            disabled={sending}
            title="Send message"
            style={{
              background: "var(--th-accent)",
              color: "var(--th-accent-fg)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              cursor: "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: sending ? 0.5 : 1,
              transition: "opacity 0.15s, transform 0.1s",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {sending ? (
              <span style={{ fontSize: 18, lineHeight: 1 }}>…</span>
            ) : (
              <IconSend />
            )}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0 }}>
            <button
              onClick={() => sendMessage(myEmoji)}
              disabled={sending}
              title={`Send ${myEmoji}`}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--th-accent)",
                opacity: sending ? 0.4 : 1,
                transition: "background 0.15s, transform 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--th-accent) 12%, transparent)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.85)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{myEmoji}</span>
            </button>
            <button
              onClick={() => { setShowReactionCustomizer((v) => !v); setShowEmojiPicker(false); }}
              title="Change reaction"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, color: "var(--th-text-2)", padding: "0 2px", lineHeight: 1, letterSpacing: "0.02em" }}
            >
              change
            </button>
          </div>
        )}
      </div>

      {/* ── Camera modal ──────────────────────────────────────────────── */}
      {showCamera && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.88)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {cameraError ? (
            <div style={{ textAlign: "center", color: "#fff", maxWidth: 320, padding: "0 24px" }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>📵</p>
              <p style={{ fontSize: 16, marginBottom: 8, fontWeight: 600 }}>Camera unavailable</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 24, lineHeight: 1.6 }}>{cameraError}</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  onClick={() => { setCameraError(null); setShowCamera(false); setTimeout(() => setShowCamera(true), 50); }}
                  style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 12, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                >
                  Try again
                </button>
                <button onClick={closeCamera} style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none", borderRadius: 12, padding: "10px 24px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                  Close
                </button>
              </div>
            </div>
          ) : capturedPhoto ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedPhoto} alt="captured" style={{ maxWidth: "90vw", maxHeight: "65vh", borderRadius: 16, objectFit: "contain" }} />
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={retakePhoto} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 12, padding: "11px 28px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                  Retake
                </button>
                <button onClick={sendCapturedPhoto} disabled={uploading} style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none", borderRadius: 12, padding: "11px 28px", cursor: "pointer", fontWeight: 600, fontSize: 14, opacity: uploading ? 0.5 : 1 }}>
                  {uploading ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted style={{ maxWidth: "90vw", maxHeight: "65vh", borderRadius: 16, background: "#000", objectFit: "cover" }} />
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <button onClick={closeCamera} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 12, padding: "11px 24px", cursor: "pointer", fontSize: 14 }}>
                  Cancel
                </button>
                {/* Shutter button */}
                <button
                  onClick={capturePhoto}
                  aria-label="Capture photo"
                  style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "#fff",
                    border: "5px solid rgba(255,255,255,0.35)",
                    cursor: "pointer",
                    boxShadow: "0 0 0 3px rgba(255,255,255,0.18)",
                    transition: "transform 0.1s",
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
