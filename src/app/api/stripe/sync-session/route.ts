import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  // Retry up to 4 times — Stripe occasionally needs a moment after redirect
  let session: Stripe.Checkout.Session | null = null;
  let lastMsg = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt));
    try {
      const s = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      });
      session = s;
      // Accept "complete" regardless of payment_status (covers trials, promos, etc.)
      if (s.status === "complete" && s.subscription) break;
      lastMsg = `status=${s.status} payment_status=${s.payment_status}`;
    } catch (err) {
      lastMsg = String(err);
      // Keep retrying unless it's the last attempt
      if (attempt === 3) {
        return NextResponse.json({ error: "Failed to retrieve session", detail: lastMsg }, { status: 400 });
      }
    }
  }

  if (!session || session.status !== "complete" || !session.subscription) {
    return NextResponse.json({ error: "Session not complete", detail: lastMsg }, { status: 400 });
  }

  const subscription = session.subscription as Stripe.Subscription;
  const periodEnd = (subscription as any).current_period_end;

  try {
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        plan: "PRO",
        status: subscription.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      },
      update: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        plan: "PRO",
        status: subscription.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      },
    });
  } catch (err) {
    // Log but don't fail — the webhook may have already written it
    console.error("[sync-session] upsert error:", err);
    // Re-read from DB to check if webhook already handled it
    const existing = await prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { plan: true },
    });
    if (existing?.plan !== "PRO") {
      return NextResponse.json({ error: "Failed to save subscription", detail: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
