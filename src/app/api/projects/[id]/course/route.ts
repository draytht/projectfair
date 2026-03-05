import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/projects/[id]/course
// Body: { courseId: string | null }
// Sets or clears the courseId on a project. User must own the project.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { courseId } = await req.json();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const userOwnsProject = project.ownerId === user.id;

  // Also allow the owner of the target course to link projects to it
  let userOwnsCourse = false;
  if (!userOwnsProject && courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { ownerId: true },
    });
    userOwnsCourse = course?.ownerId === user.id;
  }

  if (!userOwnsProject && !userOwnsCourse) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { courseId: courseId ?? null },
    select: { id: true, courseId: true },
  });

  return NextResponse.json(updated);
}
