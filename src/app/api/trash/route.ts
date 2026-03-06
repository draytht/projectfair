import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [projectMemberships, courses] = await Promise.all([
    prisma.projectMember.findMany({
      where: { userId: user.id, project: { status: "DELETED" } },
      include: {
        project: {
          select: {
            id: true, name: true, description: true,
            courseCode: true, deletedAt: true,
            members: { select: { user: { select: { id: true, name: true } } } },
            tasks: { select: { status: true } },
          },
        },
      },
    }),
    prisma.course.findMany({
      where: { ownerId: user.id, deletedAt: { not: null } },
      select: {
        id: true, name: true, code: true, description: true, deletedAt: true,
        projects: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    projects: projectMemberships.map((m) => m.project),
    courses,
  });
}
