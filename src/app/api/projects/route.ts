import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: { project: { select: { id: true, name: true, courseCode: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(memberships.map((m) => m.project));
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, courseCode } = await req.json();

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      name,
      description,
      courseCode,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "TEAM_LEADER",
        },
      },
    },
  });

  // Log activity
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