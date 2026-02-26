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

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Find user by email
  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) return NextResponse.json({ error: "No user found with that email." }, { status: 404 });

  // Check already a member
  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: invitee.id } },
  });
  if (existing) return NextResponse.json({ error: "Already a member." }, { status: 400 });

//   await prisma.projectMember.create({
//     data: { projectId: id, userId: invitee.id, role: "STUDENT" },
//   });

  await prisma.projectMember.create({
  data: { projectId: id, userId: invitee.id, role: invitee.role },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      projectId: id,
      action: "MEMBER_INVITED",
      metadata: { inviteeEmail: email },
    },
  });

  return NextResponse.json({ name: invitee.name });
}