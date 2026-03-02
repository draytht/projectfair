"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PersonalLink = { label: string; url: string };

type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  preferredName: string | null;
  bio: string | null;
  school: string | null;
  major: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  personalLinks: PersonalLink[] | null;
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0][0] ?? "?";
  return <>{initials.toUpperCase()}</>;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [preferredName, setPreferredName] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [personalLinks, setPersonalLinks] = useState<PersonalLink[]>([]);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setPreferredName(data.preferredName ?? "");
        setName(data.name ?? "");
        setBio(data.bio ?? "");
        setSchool(data.school ?? "");
        setMajor(data.major ?? "");
        setGithubUrl(data.githubUrl ?? "");
        setLinkedinUrl(data.linkedinUrl ?? "");
        setPersonalLinks(Array.isArray(data.personalLinks) ? data.personalLinks : []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setUploadingAvatar(true);
    setError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });
      if (!res.ok) throw new Error("Failed to save avatar URL");

      const updated: UserProfile = await res.json();
      setProfile(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Avatar upload failed");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  }

  function addLink() {
    if (personalLinks.length >= 5) return;
    setPersonalLinks([...personalLinks, { label: "", url: "" }]);
  }

  function removeLink(idx: number) {
    setPersonalLinks(personalLinks.filter((_, i) => i !== idx));
  }

  function updateLink(idx: number, field: keyof PersonalLink, value: string) {
    setPersonalLinks(personalLinks.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredName: preferredName || null,
          name,
          bio,
          school,
          major,
          githubUrl,
          linkedinUrl,
          personalLinks,
        }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.error ?? "Save failed");
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 12 }} className="p-6 flex gap-5 items-start">
          <div className="nc-skeleton" style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--th-border)", flexShrink: 0 }} />
          <div className="space-y-2 flex-1">
            <div className="nc-skeleton" style={{ width: "55%", height: 18, borderRadius: 6, background: "var(--th-border)" }} />
            <div className="nc-skeleton" style={{ width: "35%", height: 12, borderRadius: 6, background: "var(--th-border)" }} />
            <div className="nc-skeleton" style={{ width: "80%", height: 12, borderRadius: 6, background: "var(--th-border)" }} />
          </div>
        </div>
        <div style={{ background: "var(--th-card)", border: "1px solid var(--th-border)", borderRadius: 12 }} className="p-6 space-y-4">
          {[100, 60, 80, 60, 60, 80, 80].map((w, i) => (
            <div key={i} className="nc-skeleton" style={{ width: `${w}%`, height: 36, borderRadius: 8, background: "var(--th-border)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ color: "var(--th-text-2)" }} className="text-sm p-4">
        Could not load profile.
      </div>
    );
  }

  const displayName = profile.preferredName || profile.name;
  const currentAvatar = avatarPreview || profile.avatarUrl;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="nc-page-title nc-u-in">
        Profile
      </h1>

      {/* Hero card */}
      <div
        style={{
          background: "var(--th-card)",
          border: "1px solid var(--th-border)",
          borderRadius: 12,
          animationDelay: "0.06s",
        }}
        className="nc-u-in p-4 md:p-6 flex gap-4 md:gap-5 items-start"
      >
        {/* Avatar with breathing ring */}
        <div
          className="nc-avatar-ring"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "var(--th-accent)",
              color: "#fff",
              fontSize: 28,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              cursor: "pointer",
              position: "relative",
            }}
            onClick={() => fileInputRef.current?.click()}
            title="Change avatar"
          >
            {currentAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentAvatar}
                alt={displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Initials name={displayName} />
            )}
            {/* Hover overlay */}
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "50%", opacity: 0, transition: "opacity 0.18s ease",
              fontSize: 11, color: "#fff", fontWeight: 600,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              {uploadingAvatar ? "…" : "Edit"}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Info */}
        <div className="space-y-1 min-w-0">
          <p style={{ color: "var(--th-text)" }} className="text-lg font-semibold leading-tight">
            {displayName}
          </p>
          <p style={{ color: "var(--th-text-2)" }} className="text-xs capitalize">
            {[profile.role.toLowerCase(), profile.school, profile.major].filter(Boolean).join(" · ")}
          </p>
          {profile.bio && (
            <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
              {profile.bio}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--th-accent)", border: "1px solid color-mix(in srgb,var(--th-border) 80%,transparent)", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}
                className="hover:opacity-70 transition"
              >
                GitHub
              </a>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--th-accent)", border: "1px solid color-mix(in srgb,var(--th-border) 80%,transparent)", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}
                className="hover:opacity-70 transition"
              >
                LinkedIn
              </a>
            )}
            {Array.isArray(profile.personalLinks) &&
              profile.personalLinks.map((link, i) =>
                link.url ? (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--th-accent)", border: "1px solid color-mix(in srgb,var(--th-border) 80%,transparent)", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}
                    className="hover:opacity-70 transition"
                  >
                    {link.label || link.url}
                  </a>
                ) : null
              )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div
        style={{
          background: "var(--th-card)",
          border: "1px solid var(--th-border)",
          borderRadius: 12,
          animationDelay: "0.12s",
        }}
        className="nc-u-in p-6"
      >
        <h2 style={{ color: "var(--th-text)" }} className="text-base font-semibold mb-5">
          Edit Profile
        </h2>

        {error && (
          <p style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }} className="text-xs mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar upload (hidden, triggered by avatar click above) */}
          <div>
            <label style={{ color: "var(--th-text-2)" }} className="text-xs block mb-1">
              Avatar
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                style={{
                  background: "var(--th-bg)",
                  border: "1px solid var(--th-border)",
                  color: "var(--th-text)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: uploadingAvatar ? "not-allowed" : "pointer",
                  transition: "opacity 0.15s",
                  opacity: uploadingAvatar ? 0.6 : 1,
                }}
              >
                {uploadingAvatar ? "Uploading…" : "Choose image"}
              </button>
              <span style={{ color: "var(--th-text-2)" }} className="text-xs">
                {currentAvatar ? "Avatar set" : "No avatar"}
              </span>
            </div>
            <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1 opacity-60">
              Requires the &quot;avatars&quot; bucket to exist in Supabase Storage (public, max 5 MB).
            </p>
          </div>

          {/* Display Name */}
          <Field
            label="Display Name"
            hint="Leave blank to use your account name"
            value={preferredName}
            onChange={setPreferredName}
          />

          {/* Full Name */}
          <Field label="Full Name" value={name} onChange={setName} />

          {/* Bio */}
          <div>
            <label style={{ color: "var(--th-text-2)" }} className="text-xs block mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                background: "var(--th-bg)",
                border: "1px solid var(--th-border)",
                color: "var(--th-text)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                resize: "vertical",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--th-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--th-border)")}
            />
          </div>

          {/* School */}
          <Field label="School" value={school} onChange={setSchool} />

          {/* Major */}
          <Field label="Major" value={major} onChange={setMajor} />

          {/* GitHub URL */}
          <Field
            label="GitHub URL"
            hint="https://github.com/username"
            value={githubUrl}
            onChange={setGithubUrl}
            type="url"
          />

          {/* LinkedIn URL */}
          <Field
            label="LinkedIn URL"
            value={linkedinUrl}
            onChange={setLinkedinUrl}
            type="url"
          />

          {/* Personal links */}
          <div>
            <label style={{ color: "var(--th-text-2)" }} className="text-xs block mb-2">
              Personal Links
            </label>
            <div className="space-y-2">
              {personalLinks.map((link, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) => updateLink(idx, "label", e.target.value)}
                    style={{
                      flex: "0 0 90px",
                      minWidth: 0,
                      background: "var(--th-bg)",
                      border: "1px solid var(--th-border)",
                      color: "var(--th-text)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 13,
                      outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--th-accent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--th-border)")}
                  />
                  <input
                    placeholder="https://…"
                    value={link.url}
                    onChange={(e) => updateLink(idx, "url", e.target.value)}
                    type="url"
                    style={{
                      flex: 1,
                      background: "var(--th-bg)",
                      border: "1px solid var(--th-border)",
                      color: "var(--th-text)",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12,
                      outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--th-accent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--th-border)")}
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    style={{ color: "var(--th-text-2)", cursor: "pointer", fontSize: 18, lineHeight: 1, transition: "color 0.14s", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, flexShrink: 0 }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--th-text-2)")}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {personalLinks.length < 5 && (
              <button
                type="button"
                onClick={addLink}
                style={{ color: "var(--th-accent)", fontSize: 12, cursor: "pointer", marginTop: 8, transition: "opacity 0.14s" }}
                className="hover:opacity-70"
              >
                + Add link
              </button>
            )}
          </div>

          {/* Save button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saved ? "color-mix(in srgb,var(--th-accent) 80%,#22c55e)" : "var(--th-accent)",
                color: "var(--th-accent-fg)",
                border: "none",
                borderRadius: 8,
                padding: "8px 24px",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                transition: "background 0.3s, opacity 0.15s, transform 0.12s cubic-bezier(0.16,1,0.3,1)",
                transform: saving ? "scale(0.97)" : "scale(1)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {saved ? (
                <span style={{ animation: "nc-saved-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) both", display: "inline-block" }}>
                  ✓ Saved
                </span>
              ) : saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label style={{ color: "var(--th-text-2)" }} className="text-xs block mb-1">
        {label}
        {hint && (
          <span className="ml-2 opacity-60">{hint}</span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "var(--th-bg)",
          border: "1px solid var(--th-border)",
          color: "var(--th-text)",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 13,
        }}
      />
    </div>
  );
}
