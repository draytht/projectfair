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

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      tasks: {
        include: { assignee: true },
        orderBy: { createdAt: "desc" },
      },
      owner: true,
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = project.members.some((m) => m.userId === user.id);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(project);
}

export async function PATCH(
  req: Request,
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
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = project.members.find((m) => m.userId === user.id);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (member.role !== "TEAM_LEADER" && member.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Only team leaders can edit project settings" }, { status: 403 });
  }

  const body = await req.json();
  const now = new Date();
  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(body.deadline !== undefined && { deadline: body.deadline ? new Date(body.deadline) : null }),
      ...(body.status === "ARCHIVED" && { status: "ARCHIVED", archivedAt: now, archivedReason: body.archivedReason ?? "COMPLETED" }),
      ...(body.status === "ACTIVE" && { status: "ACTIVE", archivedAt: null, archivedReason: null }),
    },
  });

  return NextResponse.json(updated);
}

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
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = project.members.find((m) => m.userId === user.id);
  if (!member || member.role !== "TEAM_LEADER") {
    return NextResponse.json({ error: "Only team leaders can delete projects" }, { status: 403 });
  }

  await prisma.project.update({
    where: { id },
    data: { status: "DELETED", deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}