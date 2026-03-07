import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await getUserPlan(user.id);
  const limits = PLAN_LIMITS[plan];

  const [courseCount, projectCount, sub] = await Promise.all([
    prisma.course.count({ where: { ownerId: user.id, deletedAt: null } }),
    prisma.project.count({ where: { ownerId: user.id, deletedAt: null } }),
    prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true, currentPeriodEnd: true, stripePriceId: true, stripeSubscriptionId: true },
    }),
  ]);

  // Fetch cancel_at_period_end live from Stripe when there's an active subscription
  let cancelAtPeriodEnd = false;
  if (sub?.stripeSubscriptionId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
      cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
    } catch { /* subscription may not exist yet */ }
  }

  return NextResponse.json({
    plan,
    limits,
    usage: { courses: courseCount, projects: projectCount },
    status: sub?.status ?? "active",
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    stripePriceId: sub?.stripePriceId ?? null,
    cancelAtPeriodEnd,
  });
}
