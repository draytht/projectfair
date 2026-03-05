import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfessorProjectsView from "./_components/ProfessorProjectsView";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect("/login");

  // Professor gets their own dedicated view
  if (dbUser.role === "PROFESSOR") {
    return <ProfessorProjectsView />;
  }

  // Student / Team Leader view
  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: { project: true },
  });

  const projects = memberships.map((m) => m.project);

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="nc-page-title">
            My Projects
          </h2>
          <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
            {projects.length} active project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="nc-btn-3d text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-80 transition active:scale-95"
          style={{ background: "var(--th-accent)", color: "var(--th-accent-fg)", textDecoration: "none", flexShrink: 0 }}
        >
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24">
          <p style={{ color: "var(--th-text)" }} className="text-base font-semibold mb-1">
            No projects yet
          </p>
          <p style={{ color: "var(--th-text-2)" }} className="text-sm">
            Create one or ask your team leader to invite you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
              className="block p-6 rounded-xl nc-card-hover group"
            >
              {project.courseCode && (
                <p style={{ color: "var(--th-accent)" }} className="text-xs font-medium uppercase tracking-widest mb-2">
                  {project.courseCode}
                </p>
              )}
              <h3 style={{ color: "var(--th-text)" }} className="text-base font-semibold leading-snug mb-1">
                {project.name}
              </h3>
              {project.description && (
                <p style={{ color: "var(--th-text-2)" }} className="text-sm mt-2 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              )}
              <p
                style={{ color: "var(--th-accent)" }}
                className="text-xs font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Open →
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
