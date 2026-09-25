"use client";

import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

type StudentWork = {
  id: number;
  assessment_id: number;
  title: string;
  type: "assignment" | "quiz" | "exam";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  instructions?: string | null;
  duration_minutes?: number | null;
  total_marks: number;
  question_count: number;
  course?: {
    id: number;
    name: string;
    code: string;
  } | null;
  teacher?: {
    id: number;
    name: string;
  } | null;
  status: "assigned" | "in_progress" | "submitted";
  assigned_at?: string | null;
  due_at?: string | null;
  submitted_at?: string | null;
  score?: string | number | null;
};

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function formatDate(value?: string | null) {
  if (!value) return "No deadline";

  return new Intl.DateTimeFormat("en-RW", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isOverdue(work: StudentWork) {
  return (
    work.status !== "submitted" &&
    Boolean(work.due_at) &&
    new Date(work.due_at!).getTime() < Date.now()
  );
}

export default function MyWorkPage() {
  const [search, setSearch] = useState("");
  const [work, setWork] = useState<StudentWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWork() {
      const token = getToken();

      if (!token) {
        setError("Your login session was not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/student/my-work`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ??
              "Your assigned work could not be loaded.",
          );
        }

        const records =
          result.data?.data ??
          result.data ??
          [];

        setWork(
          Array.isArray(records) ? records : [],
        );
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Your assigned work could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadWork();
  }, []);

  const filteredWork = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return work;

    return work.filter((item) =>
      [
        item.title,
        item.type,
        item.difficulty,
        item.course?.name,
        item.course?.code,
        item.teacher?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [search, work]);

  const pendingCount = work.filter(
    (item) =>
      item.status !== "submitted" &&
      !isOverdue(item),
  ).length;

  const submittedCount = work.filter(
    (item) => item.status === "submitted",
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm text-slate-500">
          Student Portal
        </p>

        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              My Work
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Open assignments, quizzes and examinations assigned
              to you.
            </p>
          </div>

          {!loading && (
            <div className="flex gap-2 text-xs">
              <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600">
                {pendingCount} pending
              </span>

              <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600">
                {submittedCount} submitted
              </span>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />
          {error}
        </div>
      )}

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
            placeholder="Search assignments, quizzes or exams..."
            className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {loading ? (
        <section className="flex min-h-64 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
          <LoaderCircle
            size={20}
            className="animate-spin"
          />
          Loading your work...
        </section>
      ) : filteredWork.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <ClipboardList
            size={34}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-4 font-semibold text-slate-900">
            {search
              ? "No matching work found"
              : "No work assigned"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {search
              ? "Try a different search term."
              : "Assignments, quizzes and examinations published for your class will appear here."}
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-200">
            {filteredWork.map((item) => {
              const overdue = isOverdue(item);
              const submitted =
                item.status === "submitted";

              return (
                <article
                  key={item.id}
                  className="px-4 py-5 sm:px-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-900">
                          {item.title}
                        </h2>

                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-600">
                          {item.type}
                        </span>

                        {submitted ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 size={13} />
                            Submitted
                          </span>
                        ) : overdue ? (
                          <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                            Closed
                          </span>
                        ) : (
                          <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                            Pending
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        {item.course?.name ?? "Course"}
                        {item.course?.code
                          ? ` (${item.course.code})`
                          : ""}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span>
                          {item.question_count} questions
                        </span>

                        <span>
                          {item.total_marks} marks
                        </span>

                        {item.duration_minutes && (
                          <span>
                            {item.duration_minutes} minutes
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1">
                          <CalendarClock size={14} />
                          {formatDate(item.due_at)}
                        </span>
                      </div>

                      {submitted &&
                        item.score !== null &&
                        item.score !== undefined && (
                          <p className="mt-3 text-sm font-semibold text-slate-800">
                            Score: {item.score} /{" "}
                            {item.total_marks}
                          </p>
                        )}
                    </div>

                    {overdue && !submitted ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-400"
                      >
                        Deadline passed
                      </button>
                    ) : (
                      <Link
                        href={`/dashboard/my-work/${item.id}`}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        {submitted
                          ? "View Result"
                          : item.status === "in_progress"
                            ? "Continue"
                            : "Start"}

                        <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
