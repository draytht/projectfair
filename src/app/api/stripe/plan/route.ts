import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await getUserPlan(user.id);
  const limits = PLAN_LIMITS[plan];

  const [courseCount, projectCount, sub] = await Promise.all([
    prisma.course.count({ where: { ownerId: user.id } }),
    prisma.project.count({ where: { ownerId: user.id } }),
    prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true, currentPeriodEnd: true, stripePriceId: true },
    }),
  ]);

  return NextResponse.json({
    plan,
    limits,
    usage: { courses: courseCount, projects: projectCount },
    status: sub?.status ?? "active",
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    stripePriceId: sub?.stripePriceId ?? null,
  });
}
