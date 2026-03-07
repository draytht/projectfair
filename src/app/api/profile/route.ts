import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(dbUser);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { preferredName, bio, school, major, githubUrl, linkedinUrl, personalLinks, avatarUrl, name, status, statusExpiresAt } = body;

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(preferredName !== undefined && { preferredName: preferredName || null }),
        ...(bio !== undefined && { bio }),
        ...(school !== undefined && { school }),
        ...(major !== undefined && { major }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(personalLinks !== undefined && { personalLinks }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(name !== undefined && { name: name || null }),
        ...(status !== undefined && { status: status || null }),
        ...(statusExpiresAt !== undefined && { statusExpiresAt: statusExpiresAt ? new Date(statusExpiresAt) : null }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/profile]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Delete all user data from the DB (cascades to related records)
    await prisma.user.delete({ where: { id: user.id } });

    // Delete the auth user via Supabase admin client
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id);
    if (authDeleteError) {
      console.error("[DELETE /api/profile] auth delete error:", authDeleteError.message);
      // DB is already cleaned; best-effort sign-out anyway
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/profile]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
