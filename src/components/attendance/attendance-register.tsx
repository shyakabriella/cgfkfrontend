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
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [rows, search]);

  const totals = useMemo(() => {
    return {
      present: rows.filter((row) => row.status === "present")
        .length,
      absent: rows.filter((row) => row.status === "absent")
        .length,
      late: rows.filter((row) => row.status === "late").length,
      excused: rows.filter((row) => row.status === "excused")
        .length,
    };
  }, [rows]);

  function updateStatus(
    studentId: number,
    status: AttendanceStatus,
  ) {
    setRows((current) =>
      current.map((row) =>
        row.id === studentId
          ? {
              ...row,
              status,
            }
          : row,
      ),
    );

    setSuccess("");
  }

  function updateRemarks(
    studentId: number,
    remarks: string,
  ) {
    setRows((current) =>
      current.map((row) =>
        row.id === studentId
          ? {
              ...row,
              remarks,
            }
          : row,
      ),
    );

    setSuccess("");
  }

  function markAll(status: AttendanceStatus) {
    setRows((current) =>
      current.map((row) => ({
        ...row,
        status,
      })),
    );

    setSuccess("");
  }

  async function submitAttendance() {
    if (!attendanceDate) {
      setError("Select the attendance date.");
      return;
    }

    if (rows.length === 0) {
      setError("There are no students to save.");
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
    <div className="space-y-4 pb-24 lg:space-y-5 lg:pb-0">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-4 divide-x divide-slate-200">
          <SummaryItem
            label="Present"
            shortLabel="Present"
            value={totals.present}
            icon={Check}
            color="text-emerald-600"
            background="bg-emerald-50"
          />

          <SummaryItem
            label="Absent"
            shortLabel="Absent"
            value={totals.absent}
            icon={UserX}
            color="text-red-600"
            background="bg-red-50"
          />

          <SummaryItem
            label="Late"
            shortLabel="Late"
            value={totals.late}
            icon={Clock3}
            color="text-amber-600"
            background="bg-amber-50"
          />

          <SummaryItem
            label="Excused"
            shortLabel="Excused"
            value={totals.excused}
            icon={AlertCircle}
            color="text-slate-600"
            background="bg-slate-100"
          />
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <Check size={18} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:rounded-2xl">
        <div className="border-b border-slate-200 p-4 lg:p-5">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-6">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Selected lesson
              </p>

              <h2 className="mt-1 truncate text-base font-bold text-slate-900 lg:text-lg">
                {assignment.school_class?.name}
                {" — "}
                {assignment.course?.name}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {assignment.school_class?.code ?? "No class code"}
                {" · "}
                {assignment.course?.code ?? "No course code"}
                {" · "}
                {rows.length}{" "}
                {rows.length === 1 ? "student" : "students"}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 lg:mt-0 lg:flex">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Attendance date
                </span>

                <input
                  type="date"
                  value={attendanceDate}
                  max={today()}
                  onChange={(event) => {
                    setAttendanceDate(event.target.value);
                    setSuccess("");
                  }}
                  className="h-11 w-full min-w-0 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 lg:w-auto lg:px-3"
                />
              </label>

              <button
                type="button"
                onClick={() => markAll("present")}
                className="mt-5 h-11 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 transition active:scale-[0.98] hover:bg-emerald-100 lg:px-4 lg:text-sm"
              >
                Mark all present
              </button>
            </div>
          </div>

          <div className="relative mt-4">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student name or ID"
              className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyStudents />
        ) : filteredRows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Search
              size={30}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-3 font-semibold text-slate-900">
              No student found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try another name or student ID.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200 lg:hidden">
              {filteredRows.map((row, index) => (
                <MobileStudentRow
                  key={row.id}
                  row={row}
                  index={index}
                  onStatusChange={updateStatus}
                  onRemarksChange={updateRemarks}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Student ID</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Attendance</th>
                    <th className="px-5 py-3">Remarks</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-600">
                        {row.student_id}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {row.first_name} {row.last_name}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {statuses.map((status) => (
                            <StatusButton
                              key={status.value}
                              status={status}
                              selected={
                                row.status === status.value
                              }
                              onClick={() =>
                                updateStatus(
                                  row.id,
                                  status.value,
                                )
                              }
                            />
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
                          className="h-10 w-full min-w-44 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="hidden justify-end border-t border-slate-200 p-4 lg:flex">
              <SaveButton
                submitting={submitting}
                onClick={submitAttendance}
              />
            </div>
          </>
        )}
      </section>

      {rows.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_25px_rgba(15,23,42,0.10)] backdrop-blur lg:hidden">
          <SaveButton
            submitting={submitting}
            onClick={submitAttendance}
            fullWidth
          />
        </div>
      )}
    </div>
  );
}

function MobileStudentRow({
  row,
  index,
  onStatusChange,
}: {
  row: AttendanceRow;
  index: number;
  onStatusChange: (
    studentId: number,
    status: AttendanceStatus,
  ) => void;
  onRemarksChange: (
    studentId: number,
    remarks: string,
  ) => void;
}) {
  const initials = `${row.first_name?.charAt(0) ?? ""}${
    row.last_name?.charAt(0) ?? ""
  }`.toUpperCase();

  return (
    <article className="bg-white px-3 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
          {initials || index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[13px] font-bold leading-4 text-slate-900">
            {row.first_name} {row.last_name}
          </h3>

          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
            {row.student_id}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {statuses.map((status) => {
            const selected = row.status === status.value;

            return (
              <label
                key={status.value}
                title={status.label}
                className="cursor-pointer"
              >
                <input
                  type="radio"
                  name={`attendance-${row.id}`}
                  value={status.value}
                  checked={selected}
                  onChange={() =>
                    onStatusChange(row.id, status.value)
                  }
                  className="sr-only"
                />

                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[11px] font-bold transition active:scale-95 ${
                    selected
                      ? mobileStatusStyle(status.value)
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {status.value === "present" && "P"}
                  {status.value === "absent" && "A"}
                  {status.value === "late" && "L"}
                  {status.value === "excused" && "E"}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function StatusButton({
  status,
  selected,
  onClick,
  mobile = false,
}: {
  status: {
    value: AttendanceStatus;
    label: string;
  };
  selected: boolean;
  onClick: () => void;
  mobile?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-lg border font-semibold transition active:scale-95 ${
        mobile
          ? "min-h-11 px-1 text-[11px]"
          : "px-3 py-2 text-xs"
      } ${
        selected
          ? statusStyle(status.value)
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
      }`}
    >
      {status.label}
    </button>
  );
}

function SaveButton({
  submitting,
  onClick,
  fullWidth = false,
}: {
  submitting: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {submitting ? (
        <LoaderCircle size={18} className="animate-spin" />
      ) : (
        <Save size={18} />
      )}

      {submitting
        ? "Saving attendance..."
        : "Save Attendance"}
    </button>
  );
}

function SummaryItem({
  label,
  shortLabel,
  value,
  icon: Icon,
  color,
  background,
}: {
  label: string;
  shortLabel: string;
  value: number;
  icon: typeof Check;
  color: string;
  background: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center px-1 py-3 text-center sm:flex-row sm:justify-center sm:gap-3 sm:px-4 sm:py-4">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${background} ${color}`}
      >
        <Icon size={16} />
      </div>

      <div className="mt-1 min-w-0 sm:mt-0 sm:text-left">
        <p className="text-base font-bold leading-none text-slate-900 sm:text-lg">
          {value}
        </p>

        <p className="mt-1 truncate text-[10px] font-medium text-slate-500 sm:text-xs">
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </p>
      </div>
    </div>
  );
}

function EmptyStudents() {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <CalendarCheck size={24} />
      </div>

      <h3 className="mt-3 font-semibold text-slate-900">
        No students in this class
      </h3>

      <p className="mx-auto mt-1 max-w-xs text-sm leading-5 text-slate-500">
        Register students in this class before taking attendance.
      </p>
    </div>
  );
}

function statusStyle(status: AttendanceStatus) {
  switch (status) {
    case "present":
      return "border-emerald-300 bg-emerald-50 text-emerald-700";

    case "absent":
      return "border-red-300 bg-red-50 text-red-700";

    case "late":
      return "border-amber-300 bg-amber-50 text-amber-700";

    case "excused":
      return "border-slate-400 bg-slate-100 text-slate-700";

    default:
      return "border-slate-200 bg-white text-slate-600";
  }
}

function mobileStatusStyle(
  status: AttendanceStatus,
) {
  switch (status) {
    case "present":
      return "border-emerald-500 bg-emerald-500 text-white";

    case "absent":
      return "border-red-500 bg-red-500 text-white";

    case "late":
      return "border-amber-500 bg-amber-500 text-white";

    case "excused":
      return "border-slate-600 bg-slate-600 text-white";

    default:
      return "border-slate-200 bg-white text-slate-500";
  }
}

function statusBadgeStyle(status: AttendanceStatus) {
  switch (status) {
    case "present":
      return "bg-emerald-50 text-emerald-700";

    case "absent":
      return "bg-red-50 text-red-700";

    case "late":
      return "bg-amber-50 text-amber-700";

    case "excused":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}
