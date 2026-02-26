import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getContributionScores } from "@/lib/contribution";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check membership
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scores = await getContributionScores(id);
  return NextResponse.json(scores);
}