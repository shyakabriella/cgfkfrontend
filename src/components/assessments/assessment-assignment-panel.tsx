"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

type Student = {
  id: number;
  student_id: string;
  name: string;
  email?: string | null;
  has_account: boolean;
  is_assigned: boolean;
};

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

export default function AssessmentAssignmentPanel({
  assessmentId,
}: {
  assessmentId: number;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [scope, setScope] = useState<"all" | "selected">("all");
  const [search, setSearch] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadStudents() {
      const token = getToken();

      if (!token) {
        setError("Your login session was not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/assessments/${assessmentId}/students`,
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
            result.message ?? "Students could not be loaded.",
          );
        }

        const records: Student[] =
          result.data?.students ?? [];

        setStudents(records);
        setSelected(
          records
            .filter((student) => student.is_assigned)
            .map((student) => student.id),
        );
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Students could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStudents();
  }, [assessmentId]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return students;

    return students.filter((student) =>
      `${student.student_id} ${student.name} ${student.email ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [search, students]);

  function toggleStudent(id: number) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((studentId) => studentId !== id)
        : [...current, id],
    );
  }

  async function assignAssessment() {
    if (scope === "selected" && selected.length === 0) {
      setError("Select at least one student.");
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Your login session was not found.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/assessments/${assessmentId}/assign`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            assignment_scope: scope,
            student_ids:
              scope === "selected" ? selected : [],
            due_at: dueAt || null,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ?? "Assessment could not be assigned.",
        );
      }

      setSuccess(
        `Assessment assigned to ${result.data?.assigned_count ?? 0} students.`,
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Assessment could not be assigned.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Users size={20} className="mt-0.5 text-slate-600" />

        <div>
          <h3 className="font-semibold text-slate-900">
            Assign to students
          </h3>

          <p className="text-sm text-slate-500">
            Choose all students or select individual students.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin" />
          Loading students...
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`rounded-lg border p-3 text-left ${
                scope === "all"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200"
              }`}
            >
              <p className="text-sm font-semibold">
                All students
              </p>
              <p className="text-xs text-slate-500">
                Assign to {students.length} active students.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScope("selected")}
              className={`rounded-lg border p-3 text-left ${
                scope === "selected"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200"
              }`}
            >
              <p className="text-sm font-semibold">
                Selected students
              </p>
              <p className="text-xs text-slate-500">
                {selected.length} selected.
              </p>
            </button>
          </div>

          {scope === "selected" && (
            <div className="mt-4">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student..."
                  className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm"
                />
              </div>

              <div className="mt-3 max-h-64 divide-y overflow-y-auto rounded-lg border border-slate-200">
                {filteredStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-3 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="h-4 w-4 rounded"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {student.student_id}
                      </p>
                    </div>

                    {!student.has_account && (
                      <span className="text-xs text-amber-600">
                        No account
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium">
              Due date
            </span>

            <input
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm sm:max-w-sm"
            />
          </label>

          <button
            type="button"
            onClick={() => void assignAssessment()}
            disabled={submitting || students.length === 0}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            {submitting ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}

            {submitting ? "Assigning..." : "Assign Assessment"}
          </button>
        </>
      )}
    </section>
  );
}
