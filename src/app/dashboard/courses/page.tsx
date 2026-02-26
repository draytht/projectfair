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

  if (loading) return <div className="text-gray-400 text-sm p-8">Loading...</div>;

  // Group by courseCode
  const grouped = projects.reduce((acc, p) => {
    const key = p.courseCode || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, Project[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No projects yet.</p>
          <p className="text-sm mt-1">
            Students will appear here once they add your course code to their project.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([courseCode, courseProjects]) => (
            <div key={courseCode}>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                📚 {courseCode}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseProjects.map((project) => {
                  const done = project.tasks.filter((t) => t.status === "DONE").length;
                  const total = project.tasks.length;
                  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

                  return (
                    <Link
                      key={project.id}
                      href={`/dashboard/monitor/${project.id}`}
                      className="bg-white border rounded-xl p-5 hover:shadow-md transition"
                    >
                      <h4 className="font-semibold text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        👥 {project.members.length} members · 📋 {total} tasks
                      </p>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Members */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {project.members.slice(0, 4).map((m) => (
                          <span
                            key={m.user.id}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                          >
                            {m.user.name}
                          </span>
                        ))}
                        {project.members.length > 4 && (
                          <span className="text-xs text-gray-400">
                            +{project.members.length - 4} more
                          </span>
                        )}
                      </div>
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