"use client";

import {
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Search,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Course = {
  id: number;
  name: string;
  code: string;
  hours: number;
  periods: number;
  status: "active" | "inactive";
  created_at?: string;
};

type CourseForm = {
  name: string;
  code: string;
  hours: string;
  periods: string;
};

const emptyForm: CourseForm = {
  name: "",
  code: "",
  hours: "",
  periods: "",
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function extractCourses(result: unknown): Course[] {
  if (Array.isArray(result)) {
    return result as Course[];
  }

  const response = result as {
    data?: Course[] | { data?: Course[] };
  };

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (response?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
}

function getErrorMessage(result: unknown, fallback: string) {
  if (!result || typeof result !== "object") {
    return fallback;
  }

  const response = result as {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (response.errors) {
    return Object.values(response.errors).flat().join(" ");
  }

  return response.message || fallback;
}

function generateCourseCode(name: string) {
  const words = name
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "";
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  return words
    .slice(0, 4)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
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
            getErrorMessage(result, "Courses could not be loaded."),
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

    loadCourses();
  }, []);

  const visibleCourses = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return courses;
    }

    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(value) ||
        course.code.toLowerCase().includes(value),
    );
  }, [courses, search]);

  function openModal() {
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (submitting) return;

    setShowModal(false);
    setForm(emptyForm);
    setError("");
  }

  function updateCourseName(name: string) {
    setForm((current) => ({
      ...current,
      name,
      code: generateCourseCode(name),
    }));
  }

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError("Authentication token was not found.");
      return;
    }

    if (!form.code) {
      setError("Enter the course name to generate its code.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${apiUrl}/courses`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code,
          hours: Number(form.hours),
          periods: Number(form.periods),
          status: "active",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "Course could not be created."),
        );
      }

      const createdCourse = (result.data ?? result) as Course;

      setCourses((current) => [
        createdCourse,
        ...current.filter(
          (course) => course.id !== createdCourse.id,
        ),
      ]);

      setShowModal(false);
      setForm(emptyForm);
      setSuccess(
        `${createdCourse.name} created with code ${createdCourse.code}.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Course could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Courses
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create and manage courses taught at the school.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Course
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {error && !showModal && (
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
            className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Course List
            </h2>

            <p className="text-sm text-slate-500">
              {visibleCourses.length} courses
            </p>
          </div>

          <BookOpen size={21} className="text-blue-600" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading courses...
          </div>
        ) : visibleCourses.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BookOpen size={27} />
            </div>

            <h2 className="mt-4 font-semibold text-slate-900">
              No courses found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Click Add Course to create the first course.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">Course Name</th>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">Hours</th>
                  <th className="px-3 py-3">Periods</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {visibleCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-3 py-4 font-medium text-slate-900">
                      {course.name}
                    </td>

                    <td className="px-3 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {course.code}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-sm font-semibold text-slate-700">
                      {course.hours}
                    </td>

                    <td className="px-3 py-4 text-sm font-semibold text-slate-700">
                      {course.periods}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          course.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Create Course
                </h2>

                <p className="text-sm text-slate-500">
                  The course code is generated automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createCourse} className="space-y-4 p-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Course name
                </span>

                <input
                  required
                  value={form.name}
                  placeholder="Example: Mathematics"
                  onChange={(event) =>
                    updateCourseName(event.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Generated code
                </span>

                <input
                  readOnly
                  value={form.code}
                  placeholder="Generated automatically"
                  className="h-10 w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm font-semibold uppercase text-slate-700 outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Course hours
                  </span>

                  <input
                    required
                    type="number"
                    min="1"
                    value={form.hours}
                    placeholder="Example: 120"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        hours: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Course periods
                  </span>

                  <input
                    required
                    type="number"
                    min="1"
                    value={form.periods}
                    placeholder="Example: 180"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        periods: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !form.name ||
                    !form.code ||
                    !form.hours ||
                    !form.periods
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting && (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {submitting ? "Creating..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
