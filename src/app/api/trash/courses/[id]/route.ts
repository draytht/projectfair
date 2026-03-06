import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Restore a deleted course
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course || course.ownerId !== user.id || !course.deletedAt) {
    return NextResponse.json({ error: "Not found in trash" }, { status: 404 });
  }

  await prisma.course.update({ where: { id }, data: { deletedAt: null } });
  return NextResponse.json({ ok: true });
}

// Permanently delete a course
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course || course.ownerId !== user.id || !course.deletedAt) {
    return NextResponse.json({ error: "Not found in trash" }, { status: 404 });
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
