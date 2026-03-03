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

function initials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0][0] ?? "?").toUpperCase();
}

function Avatar({ user, size = 28 }: { user: Sender; size?: number }) {
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
  // No regular alphanumeric or punctuation characters
  return !/[a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>?/\\`~]/.test(text);
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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
      // network error — silently ignore, user can refresh
    }
  }, [projectId]);

  useEffect(() => {
    fetchMessages().finally(() => setLoading(false));
  }, [fetchMessages]);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Supabase Realtime subscription
  // NOTE: Requires the ChatMessage table to be added to Supabase realtime publication
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchMessages]);

  // Close pickers on outside click
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

  async function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    setSendError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      // Reuse the existing project-files bucket under a chat/ prefix
      const path = `chat/${projectId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("project-files")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("project-files").getPublicUrl(path);
      await sendMessage("", data.publicUrl);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

async function openCamera() {
    setCapturedPhoto(null);
    setCameraError(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "Camera access denied");
    }
  }

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
    // Pause stream while previewing
    streamRef.current?.getTracks().forEach((t) => t.enabled = false);
  }

  function retakePhoto() {
    setCapturedPhoto(null);
    streamRef.current?.getTracks().forEach((t) => t.enabled = true);
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  return (
    <div className="nc-tab-panel" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 280px)", minHeight: 400, maxHeight: 680, position: "relative" }}>
      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 0",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 16px" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--th-border)" }} className="animate-pulse" />
                <div style={{ flex: 1 }}>
                  <div style={{ width: 80, height: 10, borderRadius: 4, background: "var(--th-border)", marginBottom: 6 }} className="animate-pulse" />
                  <div style={{ width: `${60 + i * 20}%`, height: 14, borderRadius: 4, background: "var(--th-border)" }} className="animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              <p style={{ color: "var(--th-text-2)", fontSize: 14 }}>No messages yet. Say hi!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender.id === currentUserId;
            const prevMsg = messages[i - 1];
            const sameGroup = prevMsg?.sender.id === msg.sender.id &&
              new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000;
            const displayName = msg.sender.preferredName || msg.sender.name;

            const emojiOnly = !msg.imageUrl && isEmojiOnly(msg.text);

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: isMine ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "2px 12px",
                  marginTop: sameGroup ? 2 : 10,
                }}
              >
                {/* Avatar chip — aligned to top with first message in group */}
                <div style={{ width: 32, flexShrink: 0 }}>
                  {!sameGroup ? (
                    <div title={displayName}>
                      <Avatar user={msg.sender} size={32} />
                    </div>
                  ) : (
                    <div style={{ width: 32 }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                  {/* Sender label — first in group only */}
                  {!sameGroup && (
                    <span style={{ fontSize: 11, color: "var(--th-text-2)", marginBottom: 3, paddingLeft: isMine ? 0 : 2, paddingRight: isMine ? 2 : 0 }}>
                      {isMine ? "You" : displayName}
                    </span>
                  )}

                  {/* Bubble — or bare emoji */}
                  {emojiOnly ? (
                    <span style={{ fontSize: 36, lineHeight: 1.2, userSelect: "none" }}>{msg.text}</span>
                  ) : (
                    <div
                      style={{
                        background: isMine ? "var(--th-accent)" : "var(--th-card)",
                        color: isMine ? "var(--th-accent-fg)" : "var(--th-text)",
                        border: isMine ? "none" : "1px solid var(--th-border)",
                        borderRadius: isMine
                          ? (sameGroup ? "16px 4px 4px 16px" : "16px 4px 16px 16px")
                          : (sameGroup ? "4px 16px 16px 4px" : "4px 16px 16px 16px"),
                        padding: msg.imageUrl && !msg.text ? "4px" : "8px 12px",
                        fontSize: 14,
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                      }}
                    >
                      {msg.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.imageUrl}
                          alt="shared image"
                          style={{ maxWidth: 240, maxHeight: 280, borderRadius: 10, display: "block", cursor: "pointer" }}
                          onClick={() => window.open(msg.imageUrl!, "_blank")}
                        />
                      )}
                      {msg.text && <span>{msg.text}</span>}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span style={{ fontSize: 10, color: "var(--th-text-2)", marginTop: 3, paddingLeft: isMine ? 0 : 2, paddingRight: isMine ? 2 : 0 }}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Emoji picker popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          style={{
            position: "absolute",
            bottom: 70,
            left: 12,
            background: "var(--th-card)",
            border: "1px solid var(--th-border)",
            borderRadius: 12,
            padding: 10,
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: 2,
            zIndex: 20,
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          }}
        >
          {COMMON_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => insertEmoji(e)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: "2px 4px", borderRadius: 6, lineHeight: 1.2, transition: "background 0.1s" }}
              onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--th-border)")}
              onMouseLeave={(ev) => (ev.currentTarget.style.background = "none")}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Reaction customizer popover */}
      {showReactionCustomizer && (
        <div
          ref={reactionPickerRef}
          style={{
            position: "absolute",
            bottom: 70,
            left: 12,
            background: "var(--th-card)",
            border: "1px solid var(--th-border)",
            borderRadius: 12,
            padding: 10,
            zIndex: 20,
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            minWidth: 260,
          }}
        >
          <p style={{ fontSize: 11, color: "var(--th-text-2)", marginBottom: 8 }}>Choose your reaction icon</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 2 }}>
            {COMMON_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => saveReactionEmoji(e)}
                style={{
                  background: myEmoji === e ? "color-mix(in srgb, var(--th-accent) 20%, transparent)" : "none",
                  border: myEmoji === e ? "1px solid var(--th-accent)" : "1px solid transparent",
                  cursor: "pointer",
                  fontSize: 20,
                  padding: "2px 4px",
                  borderRadius: 6,
                  lineHeight: 1.2,
                  transition: "background 0.1s",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Send error */}
      {sendError && (
        <div style={{ padding: "6px 12px", fontSize: 12, color: "#e53e3e", background: "rgba(229,62,62,0.08)", borderTop: "1px solid rgba(229,62,62,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{sendError}</span>
          <button onClick={() => setSendError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", fontSize: 14, padding: "0 2px" }}>×</button>
        </div>
      )}

      {/* Input bar */}
      <div
        style={{
          borderTop: "1px solid var(--th-border)",
          padding: "10px 12px",
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        {/* Emoji picker toggle */}
        <button
          onClick={() => { setShowEmojiPicker((v) => !v); setShowReactionCustomizer(false); }}
          title="Insert emoji"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: "4px", borderRadius: 8, lineHeight: 1, flexShrink: 0, color: "var(--th-text-2)", transition: "color 0.15s" }}
        >
          😊
        </button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          rows={1}
          style={{
            flex: 1,
            background: "var(--th-bg)",
            border: "1px solid var(--th-border)",
            color: "var(--th-text)",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 14,
            resize: "none",
            outline: "none",
            lineHeight: 1.4,
            overflowY: "hidden",
            transition: "border-color 0.15s",
            minHeight: 38,
            maxHeight: 120,
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--th-accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--th-border)")}
        />

        {/* Image upload */}
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
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "4px 6px", borderRadius: 8, lineHeight: 1, flexShrink: 0, color: "var(--th-text-2)", opacity: uploading ? 0.4 : 1, transition: "color 0.15s" }}
        >
          📎
        </button>

        {/* Camera capture */}
        <button
          onClick={openCamera}
          title="Take photo"
          disabled={uploading}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "4px 6px", borderRadius: 8, lineHeight: 1, flexShrink: 0, color: "var(--th-text-2)", opacity: uploading ? 0.4 : 1, transition: "color 0.15s" }}
        >
          📷
        </button>

        {/* Like button — sends emoji as a message */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <button
            onClick={() => sendMessage(myEmoji)}
            disabled={sending}
            title={`Send ${myEmoji}`}
            style={{
              background: "color-mix(in srgb, var(--th-accent) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--th-accent) 30%, transparent)",
              cursor: "pointer",
              fontSize: 22,
              padding: "4px 8px",
              borderRadius: 10,
              lineHeight: 1,
              transition: "background 0.15s, transform 0.1s",
              opacity: sending ? 0.4 : 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--th-accent) 22%, transparent)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--th-accent) 12%, transparent)")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.88)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {myEmoji}
          </button>
          <button
            onClick={() => { setShowReactionCustomizer((v) => !v); setShowEmojiPicker(false); }}
            title="Change like icon"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, color: "var(--th-text-2)", padding: "1px 2px", lineHeight: 1 }}
          >
            change
          </button>
        </div>

        {/* Send */}
        <button
          onClick={() => sendMessage()}
          disabled={sending || (!text.trim() && !uploading)}
          title="Send message"
          style={{
            background: "var(--th-accent)",
            color: "var(--th-accent-fg)",
            border: "none",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            flexShrink: 0,
            opacity: sending || !text.trim() ? 0.45 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {sending ? "…" : "Send"}
        </button>
      </div>

      {/* Camera modal */}
      {showCamera && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {cameraError ? (
            <div style={{ textAlign: "center", color: "#fff" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📵</p>
              <p style={{ marginBottom: 4 }}>Camera unavailable</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>{cameraError}</p>
              <button onClick={closeCamera} style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 600 }}>Close</button>
            </div>
          ) : capturedPhoto ? (
            /* Preview captured photo */
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedPhoto} alt="captured" style={{ maxWidth: "90vw", maxHeight: "65vh", borderRadius: 12, objectFit: "contain" }} />
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={retakePhoto}
                  style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                >
                  Retake
                </button>
                <button
                  onClick={sendCapturedPhoto}
                  disabled={uploading}
                  style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 600, fontSize: 14, opacity: uploading ? 0.5 : 1 }}
                >
                  {uploading ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          ) : (
            /* Live viewfinder */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ maxWidth: "90vw", maxHeight: "65vh", borderRadius: 12, background: "#000", objectFit: "cover" }}
              />
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <button
                  onClick={closeCamera}
                  style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14 }}
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  style={{
                    width: 60, height: 60,
                    borderRadius: "50%",
                    background: "#fff",
                    border: "4px solid rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    flexShrink: 0,
                    boxShadow: "0 0 0 3px rgba(255,255,255,0.2)",
                  }}
                  aria-label="Capture photo"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
