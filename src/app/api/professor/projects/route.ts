import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseCode = searchParams.get("courseCode");

  try {
    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        status: { not: "DELETED" },
        courseCode: courseCode || undefined,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        members: { include: { user: true } },
        tasks: true,
        owner: true,
      },
    });

    // Also include projects where professor is owner
    const ownedProjects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        status: { not: "DELETED" },
        ownerId: user.id,
        courseCode: courseCode || undefined,
      },
      include: {
        members: { include: { user: true } },
        tasks: true,
        owner: true,
      },
    });

    // Merge and deduplicate
    const all = [...projects, ...ownedProjects];
    const unique = all.filter(
      (p, i, self) => self.findIndex((x) => x.id === p.id) === i
    );

    return NextResponse.json(unique);
  } catch {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, courseCode, courseId } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Project name is required" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      courseCode: courseCode?.trim() || null,
      courseId: courseId || null,
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "PROFESSOR" },
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