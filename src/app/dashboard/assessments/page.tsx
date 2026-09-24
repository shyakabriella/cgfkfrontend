"use client";

import {
  FileQuestion,
  LoaderCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AssignedClass = {
  id: number;
  name: string;
  code?: string;
};

type TeacherAssignment = {
  id: number;
  school_class?: AssignedClass;
};

type Course = {
  id: number;
  name: string;
  code: string;
  hours?: number;
  periods?: number;
  status?: string;
  teacher_assignments?: TeacherAssignment[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

export default function AssessmentsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourses() {
      const token = getToken();

      if (!token) {
        setError("Your login session was not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/courses?per_page=100`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ?? "Courses could not be loaded.",
          );
        }

        const records =
          result.data?.data ??
          result.data ??
          result.courses ??
          [];

        setCourses(Array.isArray(records) ? records : []);
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Courses could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return courses;

    return courses.filter((course) =>
      `${course.name} ${course.code}`
        .toLowerCase()
        .includes(term),
    );
  }, [courses, search]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600">
          Academic Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Assessments
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Select a course to generate an assignment, quiz or exam
          from its uploaded course notes.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses by name or code..."
            className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
          <LoaderCircle size={20} className="animate-spin" />
          Loading courses...
        </div>
      ) : filteredCourses.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FileQuestion
            size={36}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-3 font-semibold text-slate-900">
            No courses found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            No assigned course is currently available.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/assessments/${course.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <FileQuestion size={20} />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate font-bold text-slate-900">
                    {course.name}
                  </h2>

                  <p className="mt-0.5 text-sm font-medium text-slate-500">
                    {course.code}
                  </p>
                </div>
              </div>

              {course.teacher_assignments &&
                course.teacher_assignments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {course.teacher_assignments.map(
                      (assignment) => (
                        <span
                          key={assignment.id}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600"
                        >
                          {assignment.school_class?.name ??
                            "Assigned class"}
                        </span>
                      ),
                    )}
                  </div>
                )}

              <div className="mt-4 border-t border-slate-100 pt-3 text-sm font-semibold text-violet-700">
                Generate assessment
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
