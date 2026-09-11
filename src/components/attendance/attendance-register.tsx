"use client";

import {
  AlertCircle,
  CalendarCheck,
  Check,
  Clock3,
  LoaderCircle,
  Save,
  Search,
  UserX,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  AttendanceAssignment,
  AttendanceStatus,
  AttendanceStudent,
  saveAttendance,
  StudentAttendance,
} from "@/services/attendance.service";

type Props = {
  assignment: AttendanceAssignment;
  students: AttendanceStudent[];
};

type AttendanceRow = AttendanceStudent & {
  status: AttendanceStatus;
  remarks: string;
};

const statuses: Array<{
  value: AttendanceStatus;
  label: string;
}> = [
  {
    value: "present",
    label: "Present",
  },
  {
    value: "absent",
    label: "Absent",
  },
  {
    value: "late",
    label: "Late",
  },
  {
    value: "excused",
    label: "Excused",
  },
];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function AttendanceRegister({
  assignment,
  students,
}: Props) {
  const [rows, setRows] = useState<AttendanceRow[]>(
    students.map((student) => ({
      ...student,
      status: "present",
      remarks: "",
    })),
  );

  const [attendanceDate, setAttendanceDate] = useState(today());
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((row) =>
      [
        row.first_name,
        row.last_name,
        row.student_id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [rows, search]);

  const totals = useMemo(() => {
    return {
      present: rows.filter((row) => row.status === "present").length,
      absent: rows.filter((row) => row.status === "absent").length,
      late: rows.filter((row) => row.status === "late").length,
      excused: rows.filter((row) => row.status === "excused").length,
    };
  }, [rows]);

  function updateStatus(
    studentId: number,
    status: AttendanceStatus,
  ) {
    setRows((current) =>
      current.map((row) =>
        row.id === studentId
          ? { ...row, status }
          : row,
      ),
    );
  }

  function updateRemarks(studentId: number, remarks: string) {
    setRows((current) =>
      current.map((row) =>
        row.id === studentId
          ? { ...row, remarks }
          : row,
      ),
    );
  }

  function markAll(status: AttendanceStatus) {
    setRows((current) =>
      current.map((row) => ({
        ...row,
        status,
      })),
    );
  }

  async function submitAttendance() {
    if (!attendanceDate) {
      setError("Select the attendance date.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    const attendanceStudents: StudentAttendance[] = rows.map(
      (row) => ({
        student_id: row.id,
        status: row.status,
        remarks: row.remarks.trim(),
      }),
    );

    try {
      await saveAttendance({
        teacher_assignment_id: assignment.id,
        school_class_id: assignment.school_class_id,
        course_id: assignment.course_id,
        attendance_date: attendanceDate,
        students: attendanceStudents,
      });

      setSuccess("Attendance saved successfully.");
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to save attendance.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Present"
            value={totals.present}
            icon={Check}
            color="text-emerald-600"
            background="bg-emerald-50"
          />

          <SummaryCard
            label="Absent"
            value={totals.absent}
            icon={UserX}
            color="text-red-600"
            background="bg-red-50"
          />

          <SummaryCard
            label="Late"
            value={totals.late}
            icon={Clock3}
            color="text-amber-600"
            background="bg-amber-50"
          />

          <SummaryCard
            label="Excused"
            value={totals.excused}
            icon={AlertCircle}
            color="text-slate-600"
            background="bg-slate-100"
          />
        </div>
      </section>

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

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">Selected lesson</p>

              <h2 className="mt-1 font-bold text-slate-900">
                {assignment.school_class?.name}
                {" — "}
                {assignment.course?.name}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Class code: {assignment.school_class?.code}
                {" · "}
                Course code: {assignment.course?.code}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Attendance date
                </span>

                <input
                  type="date"
                  value={attendanceDate}
                  max={today()}
                  onChange={(event) =>
                    setAttendanceDate(event.target.value)
                  }
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <button
                type="button"
                onClick={() => markAll("present")}
                className="mt-auto h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Mark all present
              </button>
            </div>
          </div>

          <div className="relative mt-4">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student by name or student ID..."
              className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarCheck
              size={34}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-3 font-semibold text-slate-900">
              No students in this class
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Register students in this class before taking attendance.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Student ID</th>
                    <th className="px-5 py-3">Attendance</th>
                    <th className="px-5 py-3">Remarks</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {row.first_name} {row.last_name}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {row.student_id}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {statuses.map((status) => (
                            <button
                              key={status.value}
                              type="button"
                              onClick={() =>
                                updateStatus(row.id, status.value)
                              }
                              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                                row.status === status.value
                                  ? statusStyle(status.value)
                                  : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                              }`}
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <input
                          value={row.remarks}
                          onChange={(event) =>
                            updateRemarks(
                              row.id,
                              event.target.value,
                            )
                          }
                          placeholder="Optional remarks"
                          className="h-9 w-full min-w-44 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={submitAttendance}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
              >
                {submitting ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                {submitting
                  ? "Saving attendance..."
                  : "Save Attendance"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function statusStyle(status: AttendanceStatus) {
  switch (status) {
    case "present":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";

    case "absent":
      return "border border-red-200 bg-red-50 text-red-700";

    case "late":
      return "border border-amber-200 bg-amber-50 text-amber-700";

    default:
      return "border border-slate-300 bg-slate-100 text-slate-700";
  }
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  background,
}: {
  label: string;
  value: number;
  icon: typeof Check;
  color: string;
  background: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
      <div className={`rounded-lg p-2 ${background} ${color}`}>
        <Icon size={19} />
      </div>

      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
