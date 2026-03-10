import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "./_components/Sidebar";
import { AvatarStatusCard } from "./_components/AvatarStatusCard";
import { MobileNav } from "./_components/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) redirect("/login");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: { plan: true, status: true },
  });
  const isPro =
    subscription?.plan === "PRO" &&
    (subscription?.status === "active" || subscription?.status === "trialing");

  const displayName = dbUser.preferredName || dbUser.name;

  return (
    <div
      style={{ background: "var(--th-bg)", color: "var(--th-text)" }}
      className="min-h-screen flex flex-col md:flex-row"
    >
      {/* Mobile nav — completely excluded on md+ screens */}
      <div className="md:hidden">
        <MobileNav
          name={displayName}
          avatarUrl={dbUser.avatarUrl ?? null}
          role={dbUser.role}
          isPro={isPro ?? false}
        />
      </div>

      {/* Desktop sidebar */}
      <Sidebar role={dbUser.role} name={displayName} avatarUrl={dbUser.avatarUrl ?? null} isPro={isPro ?? false} />

      {/* Spacer that pushes content below the 56px fixed mobile navbar */}
      <div className="md:hidden shrink-0" style={{ height: 56 }} />

      {/* Main content */}
      <main className="flex-1 px-4 pb-4 pt-4 md:px-8 md:pb-8 md:pt-8 overflow-auto">{children}</main>

      {/* Floating avatar status card */}
      <AvatarStatusCard
        name={displayName}
        avatarUrl={dbUser.avatarUrl ?? null}
        initialStatus={dbUser.status ?? null}
        initialStatusExpiresAt={dbUser.statusExpiresAt?.toISOString() ?? null}
      />
    </div>
  );
}
