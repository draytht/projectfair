import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Soft-delete a course (moves to trash)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (course.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.$transaction([
    // Unlink all projects that belong to this course
    prisma.project.updateMany({
      where: { courseId: id },
      data: { courseId: null, courseCode: null },
    }),
    prisma.course.update({ where: { id }, data: { deletedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}
