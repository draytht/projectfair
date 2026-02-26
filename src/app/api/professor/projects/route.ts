import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseCode = searchParams.get("courseCode");

  const projects = await prisma.project.findMany({
    where: {
      courseCode: courseCode || undefined,
      members: {
        some: {
          user: { role: "PROFESSOR" },
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
}