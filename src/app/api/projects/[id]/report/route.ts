import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getContributionScores } from "@/lib/contribution";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      tasks: { include: { assignee: true } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contributions = await getContributionScores(id);

  const reviews = await prisma.peerReview.findMany({
    where: { projectId: id },
    include: { receiver: true },
  });

  // Build peer review averages
  const reviewMap: Record<string, number[]> = {};
  for (const r of reviews) {
    const avg = (r.quality + r.communication + r.timeliness + r.initiative) / 4;
    if (!reviewMap[r.receiverId]) reviewMap[r.receiverId] = [];
    reviewMap[r.receiverId].push(avg);
  }

  const reviewAverages: Record<string, number> = {};
  for (const [uid, scores] of Object.entries(reviewMap)) {
    reviewAverages[uid] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  }

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const overdueTasks = project.tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
  ).length;

  // Build prompt data
  const memberSummaries = contributions.map((c) => ({
    name: c.name,
    contributionPercent: c.percentage,
    points: c.points,
    tasksCompleted: c.breakdown.tasksCompleted,
    tasksCreated: c.breakdown.tasksCreated,
    peerRating: reviewAverages[c.userId] ?? null,
  }));

  const prompt = `
You are an academic project evaluator. Generate a professional contribution report for a university group project.

Project: "${project.name}"
Course: ${project.courseCode || "N/A"}
Total Tasks: ${totalTasks} (${doneTasks} completed, ${overdueTasks} overdue)
Team Size: ${project.members.length}

Member Data:
${memberSummaries.map((m) => `
- ${m.name}:
  Contribution: ${m.contributionPercent}%
  Tasks Completed: ${m.tasksCompleted}
  Tasks Created: ${m.tasksCreated}
  Peer Rating: ${m.peerRating !== null ? `${m.peerRating}/5` : "No reviews yet"}
`).join("")}

Write a professional report with:
1. A brief project summary
2. Individual contribution analysis for each member (2-3 sentences each)
3. Team dynamics observations
4. Suggested grading adjustment (e.g. +5%, -10%) based on contribution and peer scores
5. Any flags or concerns

Be factual, fair, and concise. Use professional academic language.
`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const report = message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ report });
}