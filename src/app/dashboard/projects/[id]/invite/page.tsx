"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function InvitePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/projects/${id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    setSuccess(`${data.name} has been added to the project!`);
    setEmail("");
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite Team Member</h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Member Email</label>
          <input
            className="w-full border rounded-lg px-4 py-2 text-sm mt-1"
            placeholder="teammate@university.edu"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            They must already have a ProjectFair account.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="flex-1 border text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Inviting..." : "Invite Member"}
          </button>
        </div>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => router.push(`/dashboard/projects/${id}`)}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to project
        </button>
      </div>
    </div>
  );
}