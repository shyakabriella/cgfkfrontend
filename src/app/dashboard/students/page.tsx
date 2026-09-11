"use client";

import {
  GraduationCap,
  LoaderCircle,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getClasses,
  getStudents,
  RegisteredStudent,
  SchoolClass,
} from "@/services/student.service";

export default function StudentsPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [classData, studentData] = await Promise.all([
          getClasses(),
          getStudents(),
        ]);

        setClasses(classData);
        setStudents(studentData);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Students could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function searchStudents(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSearching(true);
    setError("");

    try {
      setStudents(
        await getStudents({
          search: search.trim() || undefined,
        }),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Student search failed.",
      );
    } finally {
      setSearching(false);
    }
  }

  const visibleClasses = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return classes;
    }

    return classes.filter((schoolClass) => {
      const program = schoolClass.program?.name ?? "";
      const department =
        schoolClass.program?.department?.name ?? "";

      return [
        schoolClass.name,
        schoolClass.code,
        schoolClass.level,
        program,
        department,
      ].some((item) => item?.toLowerCase().includes(value));
    });
  }, [classes, search]);

  function getClassStudentCount(classId: number) {
    return students.filter(
      (student) => student.school_class?.id === classId,
    ).length;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <LoaderCircle size={21} className="animate-spin" />
        Loading students...
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Student Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Students
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Search students or select a class to view its students.
          </p>
        </div>

        <Link
          href="/dashboard/academic"
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <UserPlus size={18} />
          Register Student
        </Link>
      </div>

      <form
        onSubmit={searchStudents}
        className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={22}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student name, student ID, contact, class or department..."
              className="h-14 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={searching}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400"
          >
            {searching ? (
              <LoaderCircle size={19} className="animate-spin" />
            ) : (
              <Search size={19} />
            )}
            Search
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Classes
            </h2>

            <p className="text-sm text-slate-500">
              Select a class to view registered students.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {visibleClasses.length} classes
          </span>
        </div>

        {visibleClasses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
            <GraduationCap
              size={40}
              className="mx-auto text-slate-300"
            />
            <p className="mt-3 text-sm text-slate-500">
              No classes found.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleClasses.map((schoolClass) => (
              <Link
                key={schoolClass.id}
                href={`/dashboard/students/classes/${schoolClass.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    <GraduationCap size={20} />
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {getClassStudentCount(schoolClass.id)} students
                  </span>
                </div>

                <h3 className="mt-3 font-semibold text-slate-900">
                  {schoolClass.name}
                </h3>

                <p className="mt-1 text-xs font-medium text-blue-600">
                  {schoolClass.code}
                  {schoolClass.level
                    ? ` • ${schoolClass.level}`
                    : ""}
                </p>

                <p className="mt-2 truncate text-sm text-slate-500">
                  {schoolClass.program?.name || "No trade or option"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Search Results
            </h2>

            <p className="text-sm text-slate-500">
              {students.length} students found
            </p>
          </div>

          <Users size={21} className="text-blue-600" />
        </div>

        <StudentSearchTable students={students} />
      </section>
    </div>
  );
}

function StudentSearchTable({
  students,
}: {
  students: RegisteredStudent[];
}) {
  if (students.length === 0) {
    return (
      <div className="py-14 text-center text-sm text-slate-500">
        No students found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-4">
      <table className="w-full min-w-[800px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <th className="px-3 py-3">Student</th>
            <th className="px-3 py-3">Student ID</th>
            <th className="px-3 py-3">Class</th>
            <th className="px-3 py-3">Parent Contact</th>
            <th className="px-3 py-3">District</th>
            <th className="px-3 py-3">Status</th>
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
            >
              <td className="px-3 py-4 font-medium text-slate-900">
                {student.first_name} {student.last_name}
              </td>

              <td className="px-3 py-4 text-sm text-slate-600">
                {student.student_id}
              </td>

              <td className="px-3 py-4 text-sm text-slate-600">
                {student.school_class?.name || "—"}
              </td>

              <td className="px-3 py-4 text-sm text-slate-600">
                {student.parent_contact}
              </td>

              <td className="px-3 py-4 text-sm text-slate-600">
                {student.district}
              </td>

              <td className="px-3 py-4">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                  {student.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
