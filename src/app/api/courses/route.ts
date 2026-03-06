import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkCourseLimit } from "@/lib/plan";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const courses = await prisma.course.findMany({
      where: { ownerId: user.id, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        projects: {
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
    return NextResponse.json(courses);
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
