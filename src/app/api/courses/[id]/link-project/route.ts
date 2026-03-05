import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/courses/[id]/link-project
// Body: { projectId: string, courseId: string | null }
// Links or unlinks a project from a course.
// User must own the course or the project.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;
  const { projectId, targetCourseId } = await req.json();

  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  // Verify user owns the course (if linking to a course) or the project
  const [project, course] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } }),
    targetCourseId !== undefined && targetCourseId !== null
      ? prisma.course.findUnique({ where: { id: targetCourseId ?? courseId }, select: { ownerId: true } })
      : Promise.resolve(null),
  ]);

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const userOwnsProject = project.ownerId === user.id;
  const userOwnsCourse = course?.ownerId === user.id;

  if (!userOwnsProject && !userOwnsCourse) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newCourseId = targetCourseId !== undefined ? targetCourseId : courseId;

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { courseId: newCourseId },
    select: { id: true, courseId: true },
  });

  return NextResponse.json(updated);
}
