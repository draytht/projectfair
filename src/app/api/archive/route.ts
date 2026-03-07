import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id, project: { status: "ARCHIVED" } },
    include: {
      project: {
        select: {
          id: true, name: true, description: true,
          courseCode: true, deadline: true,
          archivedAt: true, archivedReason: true,
          members: { select: { user: { select: { id: true, name: true } } } },
          tasks: { select: { status: true } },
          files: { select: { id: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(memberships.map((m) => m.project));
}
