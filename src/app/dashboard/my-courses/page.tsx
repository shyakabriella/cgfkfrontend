"use client";

import {
  BookOpen,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SchoolClass = {
  id: number;
  name: string;
  code: string;
  level?: string | null;
};

type Course = {
  id: number;
  name: string;
  code: string;
  hours?: number | null;
  periods?: number | null;
  status?: string;
};

type StudentUser = {
  student?: {
    student_id: string;
    school_class?: SchoolClass | null;
  } | null;
};

export default function MyCoursesPage() {
  const [search, setSearch] = useState("");
  const [courses] = useState<Course[]>([]);
  const [studentClass, setStudentClass] =
    useState<SchoolClass | null>(null);

  useEffect(() => {
    const stored =
      localStorage.getItem("cgfk_user") ??
      sessionStorage.getItem("cgfk_user");

    if (!stored) return;

    try {
      const user = JSON.parse(stored) as StudentUser;

      setStudentClass(
        user.student?.school_class ?? null,
      );
    } catch {
      setStudentClass(null);
    }
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
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm text-slate-500">
          Student Portal
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          My Courses
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View the courses assigned to your class.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Current class
        </p>

        <p className="mt-1 font-semibold text-slate-900">
          {studentClass?.name ?? "Class not assigned"}
        </p>

        {studentClass?.code && (
          <p className="mt-1 text-sm text-slate-500">
            {studentClass.code}
          </p>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search your courses..."
            className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <BookOpen
            size={34}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-4 font-semibold text-slate-900">
            No courses available
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Courses assigned to your class will appear here.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-200">
            {filteredCourses.map((course) => (
              <article
                key={course.id}
                className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {course.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {course.code}
                  </p>
                </div>

                <div className="text-sm text-slate-500">
                  {course.hours
                    ? `${course.hours} hours`
                    : ""}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
