"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Member = { user: { id: string; name: string } };
type Review = { receiverId: string; quality: number; communication: number; timeliness: number; initiative: number; comment: string };

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700 w-36">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className={`text-xl transition ${
              star <= value ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [existingReviews, setExistingReviews] = useState<Review[]>([]);

  const [quality, setQuality] = useState(3);
  const [communication, setCommunication] = useState(3);
  const [timeliness, setTimeliness] = useState(3);
  const [initiative, setInitiative] = useState(3);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Get current user
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data.id));

    // Get members
    fetch(`/api/projects/${id}/members`)
      .then((r) => r.json())
      .then(setMembers);

    // Get existing reviews
    fetch(`/api/projects/${id}/reviews`)
      .then((r) => r.json())
      .then(setExistingReviews);
  }, [id]);

  // When selecting a member, prefill if review exists
  useEffect(() => {
    if (!selectedMemberId) return;
    const existing = existingReviews.find((r) => r.receiverId === selectedMemberId);
    if (existing) {
      setQuality(existing.quality);
      setCommunication(existing.communication);
      setTimeliness(existing.timeliness);
      setInitiative(existing.initiative);
      setComment(existing.comment || "");
    } else {
      setQuality(3);
      setCommunication(3);
      setTimeliness(3);
      setInitiative(3);
      setComment("");
    }
  }, [selectedMemberId, existingReviews]);

  async function handleSubmit() {
    if (!selectedMemberId) {
      setError("Please select a team member to review.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/projects/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: selectedMemberId,
        quality,
        communication,
        timeliness,
        initiative,
        comment,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    setSuccess("Review submitted successfully!");
    setLoading(false);

    // Refresh existing reviews
    fetch(`/api/projects/${id}/reviews`)
      .then((r) => r.json())
      .then(setExistingReviews);
  }

  const reviewableMembers = members.filter((m) => m.user.id !== currentUserId);
  const reviewedIds = existingReviews.map((r) => r.receiverId);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Peer Review</h2>
        <button
          onClick={() => router.push(`/dashboard/projects/${id}`)}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to project
        </button>
      </div>

      {/* Review progress */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-700 font-medium">
          You have reviewed {reviewedIds.length} of {reviewableMembers.length} teammates
        </p>
        <div className="w-full bg-blue-100 rounded-full h-1.5 mt-2">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all"
            style={{
              width: reviewableMembers.length === 0
                ? "0%"
                : `${(reviewedIds.length / reviewableMembers.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

      <div className="bg-white border rounded-xl p-6 space-y-5">
        {/* Member selector */}
        <div>
          <label className="text-sm font-medium text-gray-700">Select Teammate</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {reviewableMembers.map((m) => {
              const reviewed = reviewedIds.includes(m.user.id);
              return (
                <button
                  key={m.user.id}
                  onClick={() => setSelectedMemberId(m.user.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    selectedMemberId === m.user.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : reviewed
                      ? "bg-green-50 text-green-700 border-green-300"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {m.user.name} {reviewed && "✓"}
                </button>
              );
            })}
          </div>
        </div>

        {selectedMemberId && (
          <>
            <div className="border-t pt-4 space-y-3">
              <StarRating label="Work Quality" value={quality} onChange={setQuality} />
              <StarRating label="Communication" value={communication} onChange={setCommunication} />
              <StarRating label="Timeliness" value={timeliness} onChange={setTimeliness} />
              <StarRating label="Initiative" value={initiative} onChange={setInitiative} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Comment (optional)</label>
              <textarea
                className="w-full border rounded-lg px-4 py-2 text-sm mt-1 resize-none"
                placeholder="Any additional feedback..."
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Submitting..."
                : reviewedIds.includes(selectedMemberId)
                ? "Update Review"
                : "Submit Review"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}