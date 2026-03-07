import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dbUser, sub] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, preferredName: true },
    }),
    prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { plan: true, status: true },
    }),
  ]);
  const plan = (sub?.plan === "PRO" && (sub.status === "active" || sub.status === "trialing")) ? "PRO" : "FREE";
  return NextResponse.json({ ...dbUser, plan });
}