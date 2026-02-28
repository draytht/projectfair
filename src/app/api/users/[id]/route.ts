import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const profile = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      preferredName: true,
      bio: true,
      school: true,
      major: true,
      avatarUrl: true,
      githubUrl: true,
      linkedinUrl: true,
      personalLinks: true,
      status: true,
      statusExpiresAt: true,
      role: true,
    },
  });

  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(profile);
}
