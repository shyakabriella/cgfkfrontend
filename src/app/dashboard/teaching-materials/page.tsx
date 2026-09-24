"use client";

import {
  ArrowRight,
  BookOpenCheck,
  LoaderCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Course = {
  id: number;
  name: string;
  code: string;
  hours: number;
  periods: number;
  status: string;
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function extractCourses(result: unknown): Course[] {
  if (!result || typeof result !== "object") {
    return [];
  }

  const response = result as {
    data?: {
      data?: Course[];
    } | Course[];
  };

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return Array.isArray(response.data?.data)
    ? response.data.data
    : [];
}

export default function TeachingMaterialsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourses() {
      const token = getToken();

      if (!token) {
        setError("Authentication token was not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${apiUrl}/courses?per_page=100`,
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
            result.message ??
              "Courses could not be loaded.",
          );
        }

        setCourses(extractCourses(result));
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
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
        <p className="text-sm font-medium text-slate-500">
          Academic Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Teaching Materials
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Select an assigned course and prepare printable teaching
          material from its uploaded notes.
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
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search courses by name or code..."
            className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
          <LoaderCircle size={20} className="animate-spin" />
          Loading courses...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <BookOpenCheck
            size={36}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-3 font-semibold text-slate-900">
            No assigned courses found
          </h2>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/teaching-materials/${course.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                  <BookOpenCheck size={22} />
                </div>

                <ArrowRight
                  size={19}
                  className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700"
                />
              </div>

              <h2 className="mt-4 font-bold text-slate-900">
                {course.name}
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {course.code}
              </p>

              <div className="mt-4 flex gap-4 text-xs text-slate-500">
                <span>{course.hours} hours</span>
                <span>{course.periods} periods</span>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-700">
                Prepare teaching material
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
