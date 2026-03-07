import { prisma } from "./prisma";

export const PLAN_LIMITS = {
  FREE: { courses: 1, projects: 1 },
  PRO:  { courses: 5, projects: 5 },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

/** Returns the user's effective plan (FREE unless PRO + active/trialing). */
export async function getUserPlan(userId: string): Promise<PlanName> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });
  if (sub?.plan === "PRO" && (sub.status === "active" || sub.status === "trialing")) {
    return "PRO";
  }
  return "FREE";
}

export async function checkCourseLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].courses;
  const count = await prisma.course.count({ where: { ownerId: userId, deletedAt: null } });
  if (count >= limit) {
    return {
      allowed: false,
      message: plan === "FREE"
        ? `Free plan allows ${limit} course. Upgrade to Pro for up to ${PLAN_LIMITS.PRO.courses} courses.`
        : `Pro plan allows up to ${limit} courses.`,
    };
  }
  return { allowed: true };
}

export async function checkProjectLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].projects;
  const count = await prisma.project.count({ where: { ownerId: userId, deletedAt: null } });
  if (count >= limit) {
    return {
      allowed: false,
      message: plan === "FREE"
        ? `Free plan allows ${limit} project. Upgrade to Pro for up to ${PLAN_LIMITS.PRO.projects} projects.`
        : `Pro plan allows up to ${limit} projects.`,
    };
  }
  return { allowed: true };
}
