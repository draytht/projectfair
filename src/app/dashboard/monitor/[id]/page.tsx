"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

type ReviewSummary = Record<string, {
  name: string;
  avgQuality: number;
  avgCommunication: number;
  avgTimeliness: number;
  avgInitiative: number;
  reviewCount: number;
}>;

type Summary = {
  project: { id: string; name: string; courseCode: string | null };
  members: number;
  taskStats: { total: number; done: number; overdue: number };
  contributions: ContributionScore[];
  reviewSummary: ReviewSummary;
  flags: { name: string; reason: string }[];
};

export default function MonitorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "contributions" | "reviews" | "flags" | "report">("overview");
  const [report, setReport] = useState<string>("");
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/professor/projects/${id}/summary`)
      .then((r) => r.json())
      .then((data) => {
        setSummary(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-gray-400 text-sm p-8">Loading...</div>;
  if (!summary) return <div className="text-red-500 text-sm p-8">Project not found.</div>;

  const completionRate = summary.taskStats.total === 0
    ? 0
    : Math.round((summary.taskStats.done / summary.taskStats.total) * 100);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{summary.project.name}</h2>
          {summary.project.courseCode && (
            <p className="text-sm text-blue-500">{summary.project.courseCode}</p>
          )}
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 my-6">
        {[
          { label: "Members", value: summary.members, color: "blue" },
          { label: "Total Tasks", value: summary.taskStats.total, color: "gray" },
          { label: "Completed", value: summary.taskStats.done, color: "green" },
          { label: "Overdue", value: summary.taskStats.overdue, color: "red" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border rounded-xl p-4 text-center">
            <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span className="font-semibold">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Flags alert */}
      {summary.flags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-700 mb-2">
            ⚠️ {summary.flags.length} flag{summary.flags.length > 1 ? "s" : ""} detected
          </p>
          {summary.flags.map((f, i) => (
            <p key={i} className="text-sm text-red-600">
              • <strong>{f.name}</strong>: {f.reason}
            </p>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {(["overview", "contributions", "reviews", "flags"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "flags" && summary.flags.length > 0
              ? `⚠️ Flags (${summary.flags.length})`
              : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}

        {/* ADD THIS */}
        <button
          onClick={() => setTab("report")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === "report"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          🤖 AI Report
        </button>
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-3">
          {summary.contributions.map((c, i) => (
            <div key={c.userId} className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-400">#{i + 1}</span>
                  <span className="font-semibold text-gray-900">{c.name}</span>
                </div>
                <span className="text-xl font-bold text-blue-600">{c.percentage}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${c.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contributions Tab */}
      {tab === "contributions" && (
        <div className="space-y-4">
          {summary.contributions.map((c, i) => (
            <div key={c.userId} className="bg-white border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-400">#{i + 1}</span>
                  <span className="font-semibold text-gray-900">{c.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{c.percentage}%</span>
                  <p className="text-xs text-gray-400">{c.points} pts</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${c.percentage}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Completed", value: c.breakdown.tasksCompleted },
                  { label: "In Progress", value: c.breakdown.tasksInProgress },
                  { label: "Created", value: c.breakdown.tasksCreated },
                  { label: "Other", value: c.breakdown.otherActions },
                ].map((b) => (
                  <div key={b.label} className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-800">{b.value}</p>
                    <p className="text-xs text-gray-400">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === "reviews" && (
        <div className="space-y-4">
          {Object.keys(summary.reviewSummary).length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p>No peer reviews submitted yet.</p>
            </div>
          ) : (
            Object.entries(summary.reviewSummary).map(([userId, r]) => (
              <div key={userId} className="bg-white border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-gray-900">{r.name}</span>
                  <span className="text-xs text-gray-400">{r.reviewCount} review{r.reviewCount > 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: "Quality", value: r.avgQuality },
                    { label: "Communication", value: r.avgCommunication },
                    { label: "Timeliness", value: r.avgTimeliness },
                    { label: "Initiative", value: r.avgInitiative },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xl font-bold text-yellow-500">{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                      <div className="flex justify-center mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${star <= s.value ? "text-yellow-400" : "text-gray-200"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "report" && (
        <div>
          {!report && (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">
                Generate an AI-powered contribution report for this project.
              </p>
              <button
                onClick={async () => {
                  setReportLoading(true);
                  const res = await fetch(`/api/projects/${id}/report`, {
                    method: "POST",
                  });
                  const data = await res.json();
                  setReport(data.report);
                  setReportLoading(false);
                }}
                disabled={reportLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {reportLoading ? "Generating..." : "🤖 Generate Report"}
              </button>
            </div>
          )}

          {report && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">AI Contribution Report</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const blob = new Blob([report], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${summary.project.name}-report.txt`;
                      a.click();
                    }}
                    className="text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    ⬇ Download
                  </button>
                  <button
                    onClick={() => {
                      setReport("");
                    }}
                    className="text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    🔄 Regenerate
                  </button>
                </div>
              </div>
              <div className="bg-white border rounded-xl p-6">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {report}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flags Tab */}
      {tab === "flags" && (
        <div className="space-y-3">
          {summary.flags.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p>✅ No flags detected.</p>
              <p className="text-sm mt-1">All team members appear to be contributing fairly.</p>
            </div>
          ) : (
            summary.flags.map((f, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-800">{f.name}</p>
                <p className="text-sm text-red-600 mt-1">{f.reason}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}