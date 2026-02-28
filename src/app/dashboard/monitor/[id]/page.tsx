"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

type Tab = "overview" | "contributions" | "reviews" | "flags" | "report";

export default function MonitorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
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

  if (loading)
    return <p style={{ color: "var(--th-text-2)" }} className="text-sm p-8">Loading...</p>;
  if (!summary)
    return <p className="text-red-500 text-sm p-8">Project not found.</p>;

  const completionRate =
    summary.taskStats.total === 0
      ? 0
      : Math.round((summary.taskStats.done / summary.taskStats.total) * 100);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "contributions", label: "Contributions" },
    { key: "reviews", label: "Reviews" },
    {
      key: "flags",
      label: summary.flags.length > 0 ? `Flags (${summary.flags.length})` : "Flags",
    },
    { key: "report", label: "AI Report" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="nc-page-title">
            {summary.project.name}
          </h2>
          {summary.project.courseCode && (
            <p style={{ color: "var(--th-accent)" }} className="text-xs font-medium uppercase tracking-widest mt-1">
              {summary.project.courseCode}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/projects/${id}`}
            style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
            className="text-sm px-3 py-1.5 rounded-md font-medium hover:opacity-80 transition"
          >
            Project Board
          </Link>
          <button
            onClick={() => router.back()}
            style={{ color: "var(--th-text-2)" }}
            className="text-sm hover:opacity-70 transition cursor-pointer"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Members", value: summary.members },
          { label: "Total Tasks", value: summary.taskStats.total },
          { label: "Completed", value: summary.taskStats.done },
          { label: "Overdue", value: summary.taskStats.overdue },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
            className="rounded-xl p-4 text-center"
          >
            <p style={{ color: "var(--th-accent)" }} className="text-4xl font-black leading-none">
              {stat.value}
            </p>
            <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-2">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      <div
        style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
        className="rounded-xl p-4 mb-6"
      >
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: "var(--th-text-2)" }}>Overall Progress</span>
          <span style={{ color: "var(--th-accent)" }} className="text-xl font-bold">
            {completionRate}%
          </span>
        </div>
        <div style={{ background: "var(--th-border)" }} className="w-full h-1.5 rounded-full">
          <div
            style={{ background: "var(--th-accent)", width: `${completionRate}%` }}
            className="h-1.5 rounded-full transition-all"
          />
        </div>
      </div>

      {/* Flags alert */}
      {summary.flags.length > 0 && (
        <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-400 mb-2">
            {summary.flags.length} flag{summary.flags.length > 1 ? "s" : ""} detected
          </p>
          {summary.flags.map((f, i) => (
            <p key={i} className="text-sm text-red-400">
              · <strong>{f.name}</strong>: {f.reason}
            </p>
          ))}
        </div>
      )}

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
            className="px-4 py-2 text-sm font-medium transition cursor-pointer capitalize whitespace-nowrap shrink-0"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-3">
          {summary.contributions.map((c, i) => (
            <div
              key={c.userId}
              style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
              className="rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--th-text-2)" }} className="text-xs font-bold">
                    #{i + 1}
                  </span>
                  <span style={{ color: "var(--th-text)" }} className="font-semibold text-base">
                    {c.name}
                  </span>
                </div>
                <span style={{ color: "var(--th-accent)" }} className="text-3xl font-black">
                  {c.percentage}%
                </span>
              </div>
              <div style={{ background: "var(--th-border)" }} className="w-full h-1 rounded-full">
                <div
                  style={{ background: "var(--th-accent)", width: `${c.percentage}%` }}
                  className="h-1 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contributions */}
      {tab === "contributions" && (
        <div className="space-y-4">
          {summary.contributions.map((c, i) => (
            <div
              key={c.userId}
              style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
              className="rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--th-text-2)" }} className="text-sm font-bold">#{i + 1}</span>
                  <span style={{ color: "var(--th-text)" }} className="font-semibold text-base">{c.name}</span>
                </div>
                <div className="text-right">
                  <span style={{ color: "var(--th-accent)" }} className="text-3xl font-black">{c.percentage}%</span>
                  <p style={{ color: "var(--th-text-2)" }} className="text-xs">{c.points} pts</p>
                </div>
              </div>
              <div style={{ background: "var(--th-border)" }} className="w-full h-1.5 rounded-full mb-4">
                <div
                  style={{ background: "var(--th-accent)", width: `${c.percentage}%` }}
                  className="h-1.5 rounded-full"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                {[
                  { label: "Completed", value: c.breakdown.tasksCompleted },
                  { label: "In Progress", value: c.breakdown.tasksInProgress },
                  { label: "Created", value: c.breakdown.tasksCreated },
                  { label: "Other", value: c.breakdown.otherActions },
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
          ))}
        </div>
      )}

      {/* Reviews */}
      {tab === "reviews" && (
        <div className="space-y-4">
          {Object.keys(summary.reviewSummary).length === 0 ? (
            <div className="text-center py-24">
              <p style={{ color: "var(--th-text-2)" }} className="text-sm">No peer reviews yet.</p>
            </div>
          ) : (
            Object.entries(summary.reviewSummary).map(([userId, r]) => (
              <div
                key={userId}
                style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
                className="rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <span style={{ color: "var(--th-text)" }} className="font-semibold text-base">
                    {r.name}
                  </span>
                  <span style={{ color: "var(--th-text-2)" }} className="text-xs">
                    {r.reviewCount} review{r.reviewCount > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  {[
                    { label: "Quality", value: r.avgQuality },
                    { label: "Communication", value: r.avgCommunication },
                    { label: "Timeliness", value: r.avgTimeliness },
                    { label: "Initiative", value: r.avgInitiative },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{ background: "var(--th-bg)", border: "1px solid var(--th-border)" }}
                      className="rounded-lg p-3"
                    >
                      <p style={{ color: "var(--th-accent)" }} className="text-2xl font-bold">
                        {s.value}
                      </p>
                      <p style={{ color: "var(--th-text-2)" }} className="text-xs">{s.label}</p>
                      <div className="flex justify-center mt-1 gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            style={{ color: star <= s.value ? "var(--th-accent)" : "var(--th-border)" }}
                            className="text-xs"
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

      {/* Flags */}
      {tab === "flags" && (
        <div className="space-y-3">
          {summary.flags.length === 0 ? (
            <div className="text-center py-24">
              <p style={{ color: "var(--th-text-2)" }} className="text-sm">No flags detected.</p>
              <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
                All team members appear to be contributing fairly.
              </p>
            </div>
          ) : (
            summary.flags.map((f, i) => (
              <div
                key={i}
                className="bg-red-950/40 border border-red-800/50 rounded-xl p-4"
              >
                <p className="font-semibold text-red-400 text-sm">{f.name}</p>
                <p className="text-sm text-red-400/80 mt-1">{f.reason}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* AI Report */}
      {tab === "report" && (
        <div>
          {!report && (
            <div className="text-center py-20">
              <p style={{ color: "var(--th-text-2)" }} className="text-sm mb-6">
                Generate an AI-powered contribution report for this project.
              </p>
              <button
                onClick={async () => {
                  setReportLoading(true);
                  const res = await fetch(`/api/projects/${id}/report`, { method: "POST" });
                  const data = await res.json();
                  setReport(data.report);
                  setReportLoading(false);
                }}
                disabled={reportLoading}
                style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)" }}
                className="text-sm px-6 py-2 rounded-md font-medium hover:opacity-80 transition disabled:opacity-40 cursor-pointer"
              >
                {reportLoading ? "Generating..." : "Generate Report"}
              </button>
            </div>
          )}

          {report && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 style={{ color: "var(--th-text)" }} className="font-semibold text-sm">
                  AI Contribution Report
                </h3>
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
                    style={{ border: "1px solid var(--th-border)", color: "var(--th-text-2)" }}
                    className="text-sm px-3 py-1.5 rounded-md hover:opacity-70 transition cursor-pointer"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setReport("")}
                    style={{ border: "1px solid var(--th-border)", color: "var(--th-text-2)" }}
                    className="text-sm px-3 py-1.5 rounded-md hover:opacity-70 transition cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <div
                style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
                className="rounded-xl p-6"
              >
                <pre
                  style={{ color: "var(--th-text)" }}
                  className="whitespace-pre-wrap text-sm font-sans leading-relaxed"
                >
                  {report}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
