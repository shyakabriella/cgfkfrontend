"use client";

import TeacherAssignmentModal from "@/components/teacher-assignments/teacher-assignment-modal";
import {
  assignClassRepresentative,
  deleteTeacherAssignment,
  getAssignmentClasses,
  getAssignmentCourses,
  getTeacherAssignments,
  getTeachers,
  type Course,
  type SchoolClass,
  type Teacher,
  type TeacherAssignment,
} from "@/services/teacher-assignment.service";
import {
  BookOpenCheck,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  UserRoundCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [representativeClassId, setRepresentativeClassId] = useState("");
  const [representativeTeacherId, setRepresentativeTeacherId] = useState("");
  const [savingRepresentative, setSavingRepresentative] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData(showLoader = true) {
    if (showLoader) setLoading(true);

    setError("");

    try {
      const [
        assignmentList,
        teacherList,
        classList,
        courseList,
      ] = await Promise.all([
        getTeacherAssignments(),
        getTeachers(),
        getAssignmentClasses(),
        getAssignmentCourses(),
      ]);

      setAssignments(assignmentList);
      setTeachers(teacherList);
      setClasses(classList);
      setCourses(courseList);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to load teacher assignments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return assignments;

    return assignments.filter((assignment) => {
      const content = [
        assignment.teacher?.name,
        assignment.teacher?.email,
        assignment.school_class?.name,
        assignment.school_class?.code,
        assignment.course?.name,
        assignment.course?.code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return content.includes(term);
    });
  }, [assignments, search]);

  async function saveRepresentative() {
    if (!representativeClassId || !representativeTeacherId) {
      setError("Select both the class and representative teacher.");
      return;
    }

    setSavingRepresentative(true);
    setError("");
    setSuccess("");

    try {
      await assignClassRepresentative(
        Number(representativeClassId),
        Number(representativeTeacherId),
      );

      setSuccess("Class representative assigned successfully.");
      setRepresentativeClassId("");
      setRepresentativeTeacherId("");
      await loadData(false);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to assign the class representative.",
      );
    } finally {
      setSavingRepresentative(false);
    }
  }

  async function removeAssignment(assignment: TeacherAssignment) {
    const teacher = assignment.teacher?.name ?? "this teacher";
    const course = assignment.course?.name ?? "this course";

    if (!window.confirm(`Remove ${teacher} from ${course}?`)) {
      return;
    }

    setDeletingId(assignment.id);
    setError("");
    setSuccess("");

    try {
      await deleteTeacherAssignment(assignment.id);
      setAssignments((current) =>
        current.filter((item) => item.id !== assignment.id),
      );
      setSuccess("Teacher assignment removed successfully.");
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to remove the assignment.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Teacher Assignments
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Assign teachers to courses and select class representatives.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAssignmentModal(true)}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
        >
          <Plus size={18} />
          Assign Teacher
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
            <UserRoundCheck size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Class Representative
            </h2>
            <p className="text-sm text-slate-500">
              One teacher can represent only one class.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select
            value={representativeClassId}
            onChange={(event) =>
              setRepresentativeClassId(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Select class</option>

            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name} ({schoolClass.code})
                {schoolClass.representative_teacher
                  ? ` — ${schoolClass.representative_teacher.name}`
                  : ""}
              </option>
            ))}
          </select>

          <select
            value={representativeTeacherId}
            onChange={(event) =>
              setRepresentativeTeacherId(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Select teacher</option>

            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={saveRepresentative}
            disabled={
              savingRepresentative ||
              !representativeClassId ||
              !representativeTeacherId
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {savingRepresentative && (
              <LoaderCircle size={17} className="animate-spin" />
            )}
            Save
          </button>
        </div>
      </section>

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
            placeholder="Search by teacher, class or course..."
            className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <BookOpenCheck size={26} />
            </div>

            <h2 className="mt-4 font-semibold text-slate-900">
              No teacher assignments found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Click Assign Teacher to create the first assignment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Teacher</th>
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {assignment.teacher?.name ?? "Unknown teacher"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {assignment.teacher?.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {assignment.school_class?.name ?? "—"}
                      <span className="ml-1 text-xs text-slate-400">
                        {assignment.school_class?.code}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {assignment.course?.name ?? "—"}
                      <span className="ml-1 text-xs text-slate-400">
                        {assignment.course?.code}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {assignment.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => removeAssignment(assignment)}
                        disabled={deletingId === assignment.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === assignment.id ? (
                          <LoaderCircle
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <TeacherAssignmentModal
        open={showAssignmentModal}
        teachers={teachers}
        classes={classes}
        courses={courses}
        onClose={() => setShowAssignmentModal(false)}
        onCreated={() => {
          setSuccess("Teacher assigned successfully.");
          void loadData(false);
        }}
      />
    </div>
  );
}
