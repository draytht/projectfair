import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const { id, messageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pref = await prisma.chatReactionPreference.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: id } },
  });
  const emoji = pref?.emoji ?? "👍";

  const existing = await prisma.chatReaction.findUnique({
    where: { messageId_userId: { messageId, userId: user.id } },
  });

  if (existing) {
    await prisma.chatReaction.delete({
      where: { messageId_userId: { messageId, userId: user.id } },
    });
  } else {
    await prisma.chatReaction.create({
      data: { messageId, userId: user.id, emoji },
    });
  }

  const reactions = await prisma.chatReaction.findMany({
    where: { messageId },
    select: { userId: true, emoji: true },
  });

  return NextResponse.json({ reactions });
}
