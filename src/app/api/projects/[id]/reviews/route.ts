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

  const reviews = await prisma.peerReview.findMany({
    where: { projectId: id, giverId: user.id },
    include: { receiver: true },
  });

  return NextResponse.json(reviews);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, quality, communication, timeliness, initiative, comment } = await req.json();

  if (receiverId === user.id) {
    return NextResponse.json({ error: "You cannot review yourself." }, { status: 400 });
  }

  // Upsert — allow updating existing review
  const review = await prisma.peerReview.upsert({
    where: {
      projectId_giverId_receiverId: {
        projectId: id,
        giverId: user.id,
        receiverId,
      },
    },
    update: { quality, communication, timeliness, initiative, comment },
    create: {
      projectId: id,
      giverId: user.id,
      receiverId,
      quality,
      communication,
      timeliness,
      initiative,
      comment,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      projectId: id,
      action: "PEER_REVIEW_SUBMITTED",
      metadata: { receiverId },
    },
  });

  return NextResponse.json(review);
}