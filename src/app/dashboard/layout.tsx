import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r px-4 py-6 flex flex-col gap-2">
        <h1 className="text-xl font-bold mb-6">
          No<span className="text-blue-600">Carry</span>
        </h1>
        <Link href="/dashboard" className="text-sm text-gray-700 hover:text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50">
          🏠 Dashboard
        </Link>

        {dbUser.role === "STUDENT" && (
          <>
            <Link href="/dashboard/projects" className="text-sm text-gray-700 hover:text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50">
              📁 My Projects
            </Link>
            <Link href="/dashboard/tasks" className="text-sm text-gray-700 hover:text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50">
              ✅ My Tasks
            </Link>
          </>
        )}

        {dbUser.role === "PROFESSOR" && (
          <>
            <Link href="/dashboard/courses" className="text-sm text-gray-700 hover:text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50">
              🎓 My Courses
            </Link>
            <Link href="/dashboard/monitor" className="text-sm text-gray-700 hover:text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50">
              📊 Monitor Teams
            </Link>
          </>
        )}

        <div className="mt-auto border-t pt-4">
          <p className="text-xs text-gray-400">{dbUser.name}</p>
          <p className="text-xs text-gray-400 capitalize">{dbUser.role.toLowerCase()}</p>
          <form action="/api/auth/logout" method="POST">
            <button className="text-xs text-red-500 hover:underline mt-1">Log out</button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}