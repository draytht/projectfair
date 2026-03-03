import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ── POST /api/feedback  — submit a new feedback entry ────────────────────────
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, role, message, rating } = body as {
    name?: string;
    role?: string;
    message?: string;
    rating?: number;
  };

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 });
  if (message.trim().length < 10) return NextResponse.json({ error: "Message is too short" }, { status: 400 });
  if (message.trim().length > 500) return NextResponse.json({ error: "Message must be under 500 characters" }, { status: 400 });

  const parsedRating = typeof rating === "number" ? Math.min(5, Math.max(1, Math.round(rating))) : 5;

  // Attach to logged-in user if available (not required)
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {}

  const feedback = await prisma.feedback.create({
    data: {
      name:    name.trim().slice(0, 80),
      role:    role?.trim().slice(0, 100) ?? null,
      message: message.trim(),
      rating:  parsedRating,
      userId,
      // approved defaults to false — requires admin action
    },
    select: { id: true, name: true, message: true, rating: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, feedback }, { status: 201 });
}

// ── GET /api/feedback  — return all approved feedbacks (public, for landing page)
export async function GET() {
  const feedbacks = await prisma.feedback.findMany({
    where:   { approved: true },
    orderBy: { createdAt: "desc" },
    take:    20,
    select:  { id: true, name: true, role: true, message: true, rating: true, createdAt: true },
  });

  return NextResponse.json(feedbacks);
}
