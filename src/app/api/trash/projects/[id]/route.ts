import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Restore a deleted project
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!project || project.status !== "DELETED") {
    return NextResponse.json({ error: "Not found in trash" }, { status: 404 });
  }
  const member = project.members.find((m) => m.userId === user.id);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.project.update({
    where: { id },
    data: { status: "ACTIVE", deletedAt: null },
  });

  return NextResponse.json({ ok: true });
}

// Permanently delete a project
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!project || project.status !== "DELETED") {
    return NextResponse.json({ error: "Not found in trash" }, { status: 404 });
  }
  const member = project.members.find((m) => m.userId === user.id);
  if (!member || member.role !== "TEAM_LEADER") {
    return NextResponse.json({ error: "Only team leaders can permanently delete" }, { status: 403 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
