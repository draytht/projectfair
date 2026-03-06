import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkProjectLimit } from "@/lib/plan";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Auto-archive projects whose deadline has passed
  const now = new Date();
  await prisma.project.updateMany({
    where: {
      status: "ACTIVE",
      deadline: { lt: now },
      members: { some: { userId: user.id } },
    },
    data: { status: "ARCHIVED", archivedAt: now, archivedReason: "DEADLINE_PASSED" },
  });

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id, project: { status: "ACTIVE" } },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          courseCode: true,
          courseId: true,
          deadline: true,
          members: { select: { userId: true, role: true, user: { select: { id: true, name: true } } } },
          tasks: { select: { status: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(memberships.map((m) => m.project));
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, courseCode, courseId, deadline } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { allowed, message } = await checkProjectLimit(user.id);
  if (!allowed) return NextResponse.json({ error: message }, { status: 403 });

  const project = await prisma.project.create({
    data: {
      name,
      description,
      courseCode,
      courseId: courseId || null,
      deadline: deadline ? new Date(deadline) : null,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "TEAM_LEADER",
        },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      projectId: project.id,
      action: "PROJECT_CREATED",
      metadata: { projectName: name },
    },
  });

  return NextResponse.json(project);
}
