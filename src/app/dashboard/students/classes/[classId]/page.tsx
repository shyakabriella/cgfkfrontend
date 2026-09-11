"use client";

import {
  ArrowLeft,
  Download,
  GraduationCap,
  LoaderCircle,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getClasses,
  getStudents,
  RegisteredStudent,
  SchoolClass,
} from "@/services/student.service";

export default function ClassStudentsPage() {
  const params = useParams<{ classId: string }>();
  const classId = Number(params.classId);

  const [schoolClass, setSchoolClass] =
    useState<SchoolClass | null>(null);
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClassStudents() {
      if (!Number.isInteger(classId) || classId <= 0) {
        setError("Invalid class.");
        setLoading(false);
        return;
      }

      try {
        const [classes, classStudents] = await Promise.all([
          getClasses(),
          getStudents({ schoolClassId: classId }),
        ]);

        setSchoolClass(
          classes.find((item) => item.id === classId) ?? null,
        );
        setStudents(classStudents);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Class students could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadClassStudents();
  }, [classId]);

  const visibleStudents = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return students;
    }

    return students.filter((student) =>
      [
        student.student_id,
        student.first_name,
        student.last_name,
        student.parent_contact,
      ].some((item) => item?.toLowerCase().includes(value)),
    );
  }, [search, students]);

  async function downloadPdf() {
    if (!schoolClass || students.length === 0) return;

    setDownloading(true);
    setError("");

    try {
      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const autoTable = autoTableModule.default;

      const logoResponse = await fetch("/lo.png");

      if (!logoResponse.ok) {
        throw new Error("School logo could not be loaded.");
      }

      const logoBlob = await logoResponse.blob();

      const logoData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(
          new Error("School logo could not be processed."),
        );

        reader.readAsDataURL(logoBlob);
      });

      const document = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = document.internal.pageSize.getWidth();

      document.addImage(
        logoData,
        "PNG",
        pageWidth / 2 - 12,
        10,
        24,
        24,
      );

      document.setTextColor(45, 55, 72);
      document.setFont("helvetica", "bold");
      document.setFontSize(15);
      document.text(
        "CGFK SCHOOL",
        pageWidth / 2,
        41,
        { align: "center" },
      );

      document.setFontSize(12);
      document.text(
        `${schoolClass.name} - Student List`,
        pageWidth / 2,
        49,
        { align: "center" },
      );

      document.setFont("helvetica", "normal");
      document.setFontSize(9);
      document.setTextColor(100, 116, 139);
      document.text(
        `Class code: ${schoolClass.code}`,
        pageWidth / 2,
        55,
        { align: "center" },
      );

      autoTable(document, {
        startY: 63,
        head: [["Student Name", "Student ID"]],
        body: students.map((student) => [
          `${student.first_name} ${student.last_name}`,
          student.student_id,
        ]),
        margin: {
          left: 22,
          right: 22,
        },
        styles: {
          fontSize: 10,
          cellPadding: 4,
          textColor: [51, 65, 85],
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [241, 245, 249],
        },
        columnStyles: {
          0: {
            cellWidth: 105,
          },
          1: {
            cellWidth: 60,
            halign: "center",
          },
        },
      });

      const pageCount = document.getNumberOfPages();

      for (let page = 1; page <= pageCount; page++) {
        document.setPage(page);
        document.setFontSize(8);
        document.setTextColor(100, 116, 139);

        document.text(
          `Page ${page} of ${pageCount}`,
          pageWidth / 2,
          290,
          { align: "center" },
        );
      }

      const safeCode = schoolClass.code
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .toLowerCase();

      document.save(`${safeCode}-student-list.pdf`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The PDF could not be generated.",
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <LoaderCircle size={21} className="animate-spin" />
        Loading class students...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Back to Students
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Class Student List
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            {schoolClass?.name || "Class"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {schoolClass?.code}
            {schoolClass?.level
              ? ` • ${schoolClass.level}`
              : ""}
            {schoolClass?.program
              ? ` • ${schoolClass.program.name}`
              : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={downloadPdf}
          disabled={downloading || students.length === 0}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {downloading ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Download size={18} />
          )}
          Download PDF
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Registered Students"
          value={students.length}
          icon={Users}
        />

        <SummaryCard
          label="Class Code"
          value={schoolClass?.code || "—"}
          icon={GraduationCap}
        />

        <SummaryCard
          label="Trade / Option"
          value={schoolClass?.program?.name || "—"}
          icon={GraduationCap}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-xl">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search inside this class..."
              className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <ClassStudentTable students={visibleStudents} />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ClassStudentTable({
  students,
}: {
  students: RegisteredStudent[];
}) {
  if (students.length === 0) {
    return (
      <div className="py-16 text-center">
        <Users size={40} className="mx-auto text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">
          No students found in this class.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-4">
      <table className="w-full min-w-[900px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <th className="px-3 py-3">No.</th>
            <th className="px-3 py-3">Student ID</th>
            <th className="px-3 py-3">Student Name</th>
            <th className="px-3 py-3">Date of Birth</th>
            <th className="px-3 py-3">Parent Contact</th>
            <th className="px-3 py-3">Address</th>
            <th className="px-3 py-3">Status</th>
          </tr>
        </thead>

        <tbody>
          {students.map((student, index) => (
            <tr
              key={student.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
            >
              <td className="px-3 py-4 text-sm text-slate-500">
                {index + 1}
              </td>

              <td className="px-3 py-4 text-sm font-semibold text-blue-600">
                {student.student_id}
              </td>

              <td className="px-3 py-4 font-medium text-slate-900">
                {student.first_name} {student.last_name}
              </td>

              <td className="px-3 py-4 text-sm text-slate-600">
                {student.date_of_birth || "—"}
              </td>

              <td className="px-3 py-4 text-sm text-slate-600">
                {student.parent_contact}
              </td>

              <td className="px-3 py-4 text-sm text-slate-600">
                {[student.district, student.sector, student.cell]
                  .filter(Boolean)
                  .join(", ")}
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
