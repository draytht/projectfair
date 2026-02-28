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
      <div style={{ color: "var(--th-text-2)" }} className="text-sm p-4">
        Loading…
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
      <h1 className="nc-page-title">
        Profile
      </h1>

      {/* Hero card */}
      <div
        style={{
          background: "var(--th-card)",
          border: "1px solid var(--th-border)",
          borderRadius: 12,
        }}
        className="p-6 flex gap-5 items-start"
      >
        {/* Avatar */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "var(--th-accent)",
            color: "#fff",
            fontSize: 28,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
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
                style={{ color: "var(--th-accent)" }}
                className="text-xs hover:opacity-70 transition"
              >
                GitHub
              </a>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--th-accent)" }}
                className="text-xs hover:opacity-70 transition"
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
                    style={{ color: "var(--th-accent)" }}
                    className="text-xs hover:opacity-70 transition"
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
        }}
        className="p-6"
      >
        <h2 style={{ color: "var(--th-text)" }} className="text-base font-semibold mb-5">
          Edit Profile
        </h2>

        {error && (
          <p style={{ color: "#ef4444" }} className="text-xs mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar upload */}
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
                  cursor: "pointer",
                }}
              >
                {uploadingAvatar ? "Uploading…" : "Choose image"}
              </button>
              <span style={{ color: "var(--th-text-2)" }} className="text-xs">
                {currentAvatar ? "Avatar set" : "No avatar"}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
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
              }}
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
                      flex: "0 0 120px",
                      background: "var(--th-bg)",
                      border: "1px solid var(--th-border)",
                      color: "var(--th-text)",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12,
                    }}
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
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    style={{ color: "var(--th-text-2)", cursor: "pointer", fontSize: 14 }}
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
                style={{ color: "var(--th-accent)", fontSize: 12, cursor: "pointer", marginTop: 8 }}
              >
                + Add link
              </button>
            )}
          </div>

          {/* Save button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              style={{
                background: "var(--th-accent)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
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
