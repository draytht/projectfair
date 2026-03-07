import { NextResponse } from "next/server";

export async function GET() {
  const monthly = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? "";
  const annual  = process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID  ?? "";

  if (!monthly || !annual) {
    return NextResponse.json({ error: "Stripe prices not configured" }, { status: 503 });
  }

  return NextResponse.json({ monthly, annual });
}
