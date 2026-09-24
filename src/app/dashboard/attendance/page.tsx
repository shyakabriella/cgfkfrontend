"use client";

import AttendanceRegister from "@/components/attendance/attendance-register";
import {
  AttendanceAssignment,
  AttendanceStudent,
  getClassStudents,
  getMyTeachingAssignments,
} from "@/services/attendance.service";
import {
  AlertCircle,
  BookOpenCheck,
  CalendarCheck,
  ChevronDown,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function AttendancePage() {
  const [assignments, setAssignments] = useState<
    AttendanceAssignment[]
  >([]);
  const [selectedAssignmentId, setSelectedAssignmentId] =
    useState("");
  const [students, setStudents] = useState<
    AttendanceStudent[]
  >([]);
  const [loadingAssignments, setLoadingAssignments] =
    useState(true);
  const [loadingStudents, setLoadingStudents] =
    useState(false);
  const [error, setError] = useState("");

  const loadAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    setError("");

    try {
      const result = await getMyTeachingAssignments();
      setAssignments(result);

      if (result.length === 1) {
        const assignment = result[0];

        setSelectedAssignmentId(String(assignment.id));
        setLoadingStudents(true);

        try {
          const classStudents = await getClassStudents(
            assignment.school_class_id,
          );

          setStudents(classStudents);
        } finally {
          setLoadingStudents(false);
        }
      }
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to load your teaching assignments.",
      );
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const selectedAssignment = assignments.find(
    (assignment) =>
      assignment.id === Number(selectedAssignmentId),
  );

  async function selectAssignment(value: string) {
    setSelectedAssignmentId(value);
    setStudents([]);
    setError("");

    const assignment = assignments.find(
      (item) => item.id === Number(value),
    );

    if (!assignment) return;

    setLoadingStudents(true);

    try {
      const result = await getClassStudents(
        assignment.school_class_id,
      );

      setStudents(result);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to load students for this class.",
      );
    } finally {
      setLoadingStudents(false);
    }
  }

  return (
    <div className="-mx-4 -mt-4 min-h-[calc(100vh-5rem)] bg-slate-50 pb-8 sm:mx-0 sm:mt-0 sm:min-h-0 sm:space-y-6 sm:bg-transparent sm:pb-0">
      <header className="border-b border-slate-200 bg-white px-4 pb-4 pt-5 sm:rounded-2xl sm:border sm:p-6 sm:shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <CalendarCheck size={22} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Academic Management
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-950 sm:text-3xl">
              Student Attendance
            </h1>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Select your lesson and mark each student’s attendance.
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:mx-0">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-0.5 leading-5">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => void loadAssignments()}
            className="shrink-0 rounded-lg p-2 text-red-700 transition hover:bg-red-100"
            aria-label="Try again"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      )}

      <section className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:static sm:mt-6 sm:rounded-2xl sm:border sm:p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <BookOpenCheck size={19} />
          </div>

          <div className="min-w-0">
            <h2 className="font-bold text-slate-900">
              Select lesson
            </h2>

            <p className="truncate text-xs text-slate-500 sm:text-sm">
              Your assigned classes and courses
            </p>
          </div>
        </div>

        {loadingAssignments ? (
          <div className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
            <LoaderCircle size={19} className="animate-spin" />
            Loading lessons...
          </div>
        ) : assignments.length > 0 ? (
          <div className="relative">
            <select
              value={selectedAssignmentId}
              onChange={(event) =>
                void selectAssignment(event.target.value)
              }
              disabled={loadingStudents}
              className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-11 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200 disabled:cursor-wait disabled:bg-slate-50"
            >
              <option value="">Choose class and course</option>

              {assignments.map((assignment) => (
                <option
                  key={assignment.id}
                  value={assignment.id}
                >
                  {assignment.school_class?.name ?? "Class"}
                  {" — "}
                  {assignment.course?.name ?? "Course"}
                  {assignment.course?.code
                    ? ` (${assignment.course.code})`
                    : ""}
                </option>
              ))}
            </select>

            <ChevronDown
              size={19}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You do not currently have an active class and course
            assignment.
          </div>
        )}
      </section>

      <main className="px-4 pt-4 sm:px-0 sm:pt-0">
        {loadingStudents && (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <LoaderCircle
                size={24}
                className="animate-spin text-slate-700"
              />
            </div>

            <p className="mt-4 font-semibold text-slate-900">
              Loading class register
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Please wait while we load the students.
            </p>
          </div>
        )}

        {!loadingStudents && selectedAssignment && (
          <AttendanceRegister
            key={selectedAssignment.id}
            assignment={selectedAssignment}
            students={students}
          />
        )}

        {!loadingStudents && !selectedAssignment && (
          <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <CalendarCheck size={27} />
            </div>

            <h2 className="mt-4 font-bold text-slate-900">
              Select a lesson
            </h2>

            <p className="mt-1 max-w-xs text-sm leading-5 text-slate-500">
              Choose a class and course above to open its student
              attendance register.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
