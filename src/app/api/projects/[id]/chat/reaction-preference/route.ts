import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { emoji } = await req.json();
  if (!emoji) return NextResponse.json({ error: "emoji required" }, { status: 400 });

  const pref = await prisma.chatReactionPreference.upsert({
    where: { userId_projectId: { userId: user.id, projectId: id } },
    create: { userId: user.id, projectId: id, emoji },
    update: { emoji },
  });

  return NextResponse.json(pref);
}
