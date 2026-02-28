"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  courseCode: string | null;
  members: { user: { id: string; name: string } }[];
  tasks: { status: string }[];
};

export default function CoursesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/professor/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <p style={{ color: "var(--th-text-2)" }} className="text-sm p-8">Loading...</p>;

  const grouped = projects.reduce((acc, p) => {
    const key = p.courseCode || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, Project[]>);

  const totalProjects = projects.length;
  const totalMembers = projects.reduce((s, p) => s + p.members.length, 0);

  return (
    <div>
      {/* Page header */}
      <div className="mb-10">
        <h2 className="nc-page-title">
          My Courses
        </h2>
        <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-1">
          {totalProjects} project{totalProjects !== 1 ? "s" : ""} · {totalMembers} student{totalMembers !== 1 ? "s" : ""} enrolled
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-24">
          <p style={{ color: "var(--th-text)" }} className="text-base font-semibold mb-1">
            No projects yet
          </p>
          <p style={{ color: "var(--th-text-2)" }} className="text-sm">
            Students will appear here once they add your course code.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([courseCode, courseProjects]) => (
            <div key={courseCode}>
              {/* Course heading */}
              <div className="flex items-baseline gap-3 mb-5">
                <h3 style={{ color: "var(--th-text)" }} className="text-lg font-bold tracking-tight">
                  {courseCode}
                </h3>
                <span style={{ color: "var(--th-text-2)" }} className="text-xs">
                  {courseProjects.length} team{courseProjects.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseProjects.map((project) => {
                  const done = project.tasks.filter((t) => t.status === "DONE").length;
                  const total = project.tasks.length;
                  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

                  return (
                    <Link
                      key={project.id}
                      href={`/dashboard/monitor/${project.id}`}
                      style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
                      className="block p-6 rounded-xl nc-card-hover group"
                    >
                      <h4 style={{ color: "var(--th-text)" }} className="text-base font-semibold leading-snug mb-3">
                        {project.name}
                      </h4>

                      {/* Stats row */}
                      <div className="flex gap-4 mb-4">
                        <div>
                          <p style={{ color: "var(--th-text)" }} className="text-xl font-bold leading-none">
                            {project.members.length}
                          </p>
                          <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-0.5">members</p>
                        </div>
                        <div>
                          <p style={{ color: "var(--th-text)" }} className="text-xl font-bold leading-none">
                            {total}
                          </p>
                          <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-0.5">tasks</p>
                        </div>
                        <div>
                          <p style={{ color: "var(--th-accent)" }} className="text-xl font-bold leading-none">
                            {progress}%
                          </p>
                          <p style={{ color: "var(--th-text-2)" }} className="text-xs mt-0.5">done</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ background: "var(--th-border)" }} className="w-full h-1 rounded-full">
                        <div
                          style={{ background: "var(--th-accent)", width: `${progress}%` }}
                          className="h-1 rounded-full transition-all"
                        />
                      </div>

                      {/* Member chips */}
                      <div className="flex flex-wrap gap-1 mt-4">
                        {project.members.slice(0, 4).map((m) => (
                          <span
                            key={m.user.id}
                            style={{ background: "var(--th-bg)", color: "var(--th-text-2)" }}
                            className="text-xs px-2 py-0.5 rounded-full"
                          >
                            {m.user.name}
                          </span>
                        ))}
                        {project.members.length > 4 && (
                          <span style={{ color: "var(--th-text-2)" }} className="text-xs">
                            +{project.members.length - 4} more
                          </span>
                        )}
                      </div>

                      <p
                        style={{ color: "var(--th-accent)" }}
                        className="text-xs font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Monitor →
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
