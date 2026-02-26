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