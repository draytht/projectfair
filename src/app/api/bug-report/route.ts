import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ── POST /api/bug-report  — submit a bug report ───────────────────────────────
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { title, description, steps, email } = body as {
    title?:       string;
    description?: string;
    steps?:       string;
    email?:       string;
  };

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!description?.trim()) return NextResponse.json({ error: "Description is required" }, { status: 400 });
  if (title.trim().length > 120) return NextResponse.json({ error: "Title must be under 120 characters" }, { status: 400 });

  // Validate email format if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Attach to logged-in user if available
  let userId: string | null = null;
  let userEmail: string | null = email?.trim() ?? null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      if (!userEmail) userEmail = user.email ?? null;
    }
  } catch {}

  const report = await prisma.bugReport.create({
    data: {
      title:       title.trim().slice(0, 120),
      description: description.trim().slice(0, 2000),
      steps:       steps?.trim().slice(0, 1000) ?? null,
      email:       userEmail,
      userId,
    },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, report }, { status: 201 });
}

// ── GET /api/bug-report  — admin: list all bug reports (auth required) ────────
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only allow professors/admins — for now just require auth
  const dbUser = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { role: true },
  });
  if (!dbUser || dbUser.role !== "PROFESSOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reports = await prisma.bugReport.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:          true,
      title:       true,
      description: true,
      steps:       true,
      email:       true,
      status:      true,
      createdAt:   true,
      user:        { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(reports);
}
