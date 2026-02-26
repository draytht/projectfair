import { prisma } from "@/lib/prisma";

const ACTION_POINTS: Record<string, number> = {
  TASK_CREATED: 2,
  MEMBER_INVITED: 1,
  PROJECT_CREATED: 1,
};

export async function getContributionScores(projectId: string) {
  const logs = await prisma.activityLog.findMany({
    where: { projectId },
    include: { user: true },
  });

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: true },
  });

  // Count task completions per user (from tasks table directly)
  const completedTasks = await prisma.task.findMany({
    where: { projectId, status: "DONE" },
    include: { assignee: true },
  });

  const inProgressTasks = await prisma.task.findMany({
    where: { projectId, status: "IN_PROGRESS" },
    include: { assignee: true },
  });

  // Build score map
  const scoreMap: Record<string, { name: string; points: number; breakdown: Record<string, number> }> = {};

  // Initialize all members with 0
  for (const m of members) {
    scoreMap[m.userId] = {
      name: m.user.name,
      points: 0,
      breakdown: {
        tasksCompleted: 0,
        tasksInProgress: 0,
        tasksCreated: 0,
        otherActions: 0,
      },
    };
  }

  // Add points from activity logs
  for (const log of logs) {
    if (!scoreMap[log.userId]) continue;

    if (log.action === "TASK_CREATED") {
      scoreMap[log.userId].points += ACTION_POINTS.TASK_CREATED;
      scoreMap[log.userId].breakdown.tasksCreated += 1;
    } else if (log.action === "MEMBER_INVITED" || log.action === "PROJECT_CREATED") {
      scoreMap[log.userId].points += ACTION_POINTS[log.action] || 0;
      scoreMap[log.userId].breakdown.otherActions += 1;
    }
  }

  // Add points for completed tasks (assigned to user)
  for (const task of completedTasks) {
    if (task.assigneeId && scoreMap[task.assigneeId]) {
      scoreMap[task.assigneeId].points += 5;
      scoreMap[task.assigneeId].breakdown.tasksCompleted += 1;
    }
  }

  // Add points for in-progress tasks
  for (const task of inProgressTasks) {
    if (task.assigneeId && scoreMap[task.assigneeId]) {
      scoreMap[task.assigneeId].points += 3;
      scoreMap[task.assigneeId].breakdown.tasksInProgress += 1;
    }
  }

  // Calculate percentages
  const totalPoints = Object.values(scoreMap).reduce((sum, s) => sum + s.points, 0);

  const scores = Object.entries(scoreMap).map(([userId, data]) => ({
    userId,
    name: data.name,
    points: data.points,
    percentage: totalPoints === 0 ? 0 : Math.round((data.points / totalPoints) * 100),
    breakdown: data.breakdown,
  }));

  return scores.sort((a, b) => b.points - a.points);
}