import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST — toggle cancel_at_period_end (cancel or reactivate)
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reactivate } = await req.json().catch(() => ({ reactivate: false }));

  const sub = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: { stripeSubscriptionId: true },
  });

  if (!sub?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
  }

  const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: !reactivate,
  });

  return NextResponse.json({
    cancelAtPeriodEnd: updated.cancel_at_period_end,
    currentPeriodEnd: new Date((updated as any).current_period_end * 1000).toISOString(),
  });
}
