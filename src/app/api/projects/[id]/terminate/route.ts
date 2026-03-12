import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/projects/[id]/terminate
 *
 * Permanently destroys the project and removes it for all members.
 * Restricted to the project owner only (project.ownerId === authenticated user).
 * Unlike DELETE (soft-delete to Trash), this is irreversible.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (project.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the project owner can terminate a project" }, { status: 403 });
  }

  // Hard delete — cascades to ProjectMember, Task, ActivityLog, ProjectFile, etc.
  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
