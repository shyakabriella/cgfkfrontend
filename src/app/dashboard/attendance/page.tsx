"use client";

import AttendanceRegister from "@/components/attendance/attendance-register";
import {
  AttendanceAssignment,
  AttendanceStudent,
  getClassStudents,
  getMyTeachingAssignments,
} from "@/services/attendance.service";
import {
  BookOpenCheck,
  CalendarCheck,
  LoaderCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    async function loadAssignments() {
      setLoadingAssignments(true);
      setError("");

      try {
        const result = await getMyTeachingAssignments();
        setAssignments(result);
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Unable to load teaching assignments.",
        );
      } finally {
        setLoadingAssignments(false);
      }
    }

    void loadAssignments();
  }, []);

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
          : "Unable to load class students.",
      );
    } finally {
      setLoadingStudents(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Academic Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Student Attendance
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Select the class and course you are going to teach,
          then mark every student’s attendance.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
            <BookOpenCheck size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Select lesson
            </h2>

            <p className="text-sm text-slate-500">
              Only your assigned classes and courses are shown.
            </p>
          </div>
        </div>

        <div className="mt-4">
          {loadingAssignments ? (
            <div className="flex h-10 items-center gap-2 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" />
              Loading your lessons...
            </div>
          ) : (
            <select
              value={selectedAssignmentId}
              onChange={(event) =>
                void selectAssignment(event.target.value)
              }
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:max-w-xl"
            >
              <option value="">Select class and course</option>

              {assignments.map((assignment) => (
                <option
                  key={assignment.id}
                  value={assignment.id}
                >
                  {assignment.school_class?.name}
                  {" — "}
                  {assignment.course?.name}
                  {" ("}
                  {assignment.course?.code}
                  {")"}
                </option>
              ))}
            </select>
          )}

          {!loadingAssignments && assignments.length === 0 && (
            <p className="mt-3 text-sm text-amber-700">
              You do not currently have an active class and course
              assignment.
            </p>
          )}
        </div>
      </section>

      {loadingStudents && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
          <LoaderCircle size={20} className="animate-spin" />
          Loading students...
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
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <CalendarCheck
            size={36}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-3 font-semibold text-slate-900">
            Select a lesson
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            The student attendance register will appear here.
          </p>
        </section>
      )}
    </div>
  );
}
