import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const [rawMessages, pref] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { projectId: id },
        include: {
          sender: { select: { id: true, name: true, preferredName: true, avatarUrl: true } },
          reactions: { select: { userId: true, emoji: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.chatReactionPreference.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: id } },
      }),
    ]);

    // Reverse so messages display oldest→newest
    const messages = rawMessages.reverse();
    return NextResponse.json({ messages, myReactionEmoji: pref?.emoji ?? "👍" });
  } catch (err) {
    console.error("[GET /api/projects/chat]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { text, imageUrl } = body;
  if (!text && !imageUrl) return NextResponse.json({ error: "text or imageUrl required" }, { status: 400 });

  try {
    const message = await prisma.chatMessage.create({
      data: { projectId: id, senderId: user.id, text: text ?? null, imageUrl: imageUrl ?? null },
      include: {
        sender: { select: { id: true, name: true, preferredName: true, avatarUrl: true } },
        reactions: { select: { userId: true, emoji: true } },
      },
    });
    return NextResponse.json(message);
  } catch (err) {
    console.error("[POST /api/projects/chat]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
