import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getContributionScores } from "@/lib/contribution";
import { NextResponse } from "next/server";

export async function GET(
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
    include: { giver: true, receiver: true },
  });

  // Aggregate peer review scores per member
  const reviewSummary: Record<string, {
    name: string;
    avgQuality: number;
    avgCommunication: number;
    avgTimeliness: number;
    avgInitiative: number;
    reviewCount: number;
  }> = {};

  for (const r of reviews) {
    if (!reviewSummary[r.receiverId]) {
      reviewSummary[r.receiverId] = {
        name: r.receiver.name,
        avgQuality: 0,
        avgCommunication: 0,
        avgTimeliness: 0,
        avgInitiative: 0,
        reviewCount: 0,
      };
    }
    reviewSummary[r.receiverId].avgQuality += r.quality;
    reviewSummary[r.receiverId].avgCommunication += r.communication;
    reviewSummary[r.receiverId].avgTimeliness += r.timeliness;
    reviewSummary[r.receiverId].avgInitiative += r.initiative;
    reviewSummary[r.receiverId].reviewCount += 1;
  }

  // Average the scores
  for (const userId of Object.keys(reviewSummary)) {
    const s = reviewSummary[userId];
    const count = s.reviewCount;
    s.avgQuality = Math.round((s.avgQuality / count) * 10) / 10;
    s.avgCommunication = Math.round((s.avgCommunication / count) * 10) / 10;
    s.avgTimeliness = Math.round((s.avgTimeliness / count) * 10) / 10;
    s.avgInitiative = Math.round((s.avgInitiative / count) * 10) / 10;
  }

  // Detect flags
  const flags: { name: string; reason: string }[] = [];

  for (const c of contributions) {
    const review = reviewSummary[c.userId];
    const avgPeerScore = review
      ? (review.avgQuality + review.avgCommunication + review.avgTimeliness + review.avgInitiative) / 4
      : null;

    if (c.percentage < 10 && project.members.length > 1) {
      flags.push({ name: c.name, reason: "Very low contribution (<10%)" });
    }

    if (avgPeerScore !== null && avgPeerScore >= 4.5 && c.percentage < 15) {
      flags.push({ name: c.name, reason: "High peer rating but low activity" });
    }

    if (avgPeerScore !== null && avgPeerScore <= 2 && c.percentage > 40) {
      flags.push({ name: c.name, reason: "Low peer rating but high activity" });
    }
  }

  // Task stats
  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const overdueTasks = project.tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
  ).length;

  return NextResponse.json({
    project: { id: project.id, name: project.name, courseCode: project.courseCode },
    members: project.members.length,
    taskStats: { total: totalTasks, done: doneTasks, overdue: overdueTasks },
    contributions,
    reviewSummary,
    flags,
  });
}