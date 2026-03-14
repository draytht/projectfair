import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkCourseLimit } from "@/lib/plan";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Courses the user owns
    const ownedCourses = await prisma.course.findMany({
      where: { ownerId: user.id, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        projects: {
          where: { deletedAt: null, status: { not: "DELETED" } },
          select: {
            id: true,
            name: true,
            courseCode: true,
            members: { select: { user: { select: { id: true, name: true } } } },
            tasks: { select: { status: true } },
          },
        },
      },
    });

    // Courses where user has a project enrolled (but doesn't own the course)
    const ownedCourseIds = new Set(ownedCourses.map((c) => c.id));
    const enrolledCourses = await prisma.course.findMany({
      where: {
        deletedAt: null,
        ownerId: { not: user.id },
        projects: {
          some: {
            deletedAt: null,
            status: { not: "DELETED" },
            members: { some: { userId: user.id } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        // Only include the projects that belong to this user
        projects: {
          where: {
            deletedAt: null,
            status: { not: "DELETED" },
            members: { some: { userId: user.id } },
          },
          select: {
            id: true,
            name: true,
            courseCode: true,
            members: { select: { user: { select: { id: true, name: true } } } },
            tasks: { select: { status: true } },
          },
        },
      },
    });

    return NextResponse.json({
      owned: ownedCourses,
      enrolled: enrolledCourses.filter((c) => !ownedCourseIds.has(c.id)),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, code, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Course name is required" }, { status: 400 });
  if (!code?.trim()) return NextResponse.json({ error: "Course code is required" }, { status: 400 });

  const { allowed, message } = await checkCourseLimit(user.id);
  if (!allowed) return NextResponse.json({ error: message }, { status: 403 });

  try {
    const course = await prisma.course.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        ownerId: user.id,
      },
      include: { projects: true },
    });
    return NextResponse.json(course);
  } catch {
    return NextResponse.json({ error: "Course code already exists for your account" }, { status: 409 });
  }
}
