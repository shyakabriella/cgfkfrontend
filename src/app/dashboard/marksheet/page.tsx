"use client";

import { exportMarksheetPdf } from "@/lib/export-marksheet-pdf";
import {
  ClipboardList,
  Download,
  LoaderCircle,
  Search,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

type Course = {
  id: number;
  name: string;
  code: string;
};

type Assessment = {
  id: number;
  course_id: number;
  title: string;
  type: "quiz" | "exam" | "assignment";
  total_marks: number;
  course: Course;
};

type MarksheetStudent = {
  assignment_id: number;
  student_id: string;
  student_name: string;
  status: string;
  score: number | null;
  total_marks: number;
  percentage: number | null;
};

type Marksheet = {
  assessment: {
    id: number;
    title: string;
    type: string;
    total_marks: number;
    course: Course;
    teacher?: {
      id: number;
      name: string;
    } | null;
    school_class?: {
      name: string;
      code: string;
    } | null;
  };
  students: MarksheetStudent[];
  summary: {
    students: number;
    submitted: number;
    pending: number;
    average: number;
  };
};

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

export default function MarksheetPage() {
  const [assessments, setAssessments] =
    useState<Assessment[]>([]);
  const [assessmentId, setAssessmentId] =
    useState("");
  const [courseId, setCourseId] =
    useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [marksheet, setMarksheet] =
    useState<Marksheet | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [loadingSheet, setLoadingSheet] =
    useState(false);
  const [exporting, setExporting] =
    useState(false);
  const [error, setError] = useState("");

  async function requestMarksheet(
    selectedAssessmentId = "",
  ) {
    const token = getToken();

    if (!token) {
      throw new Error(
        "Your login session was not found.",
      );
    }

    const query = new URLSearchParams();

    if (courseId) {
      query.set("course_id", courseId);
    }

    if (type) {
      query.set("type", type);
    }

    if (selectedAssessmentId) {
      query.set(
        "assessment_id",
        selectedAssessmentId,
      );
    }

    const response = await fetch(
      `${API_URL}/teacher/marksheets?${query.toString()}`,
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
          "Marksheet could not be loaded.",
      );
    }

    setAssessments(
      result.data?.assessments ?? [],
    );

    setMarksheet(
      result.data?.marksheet ?? null,
    );
  }

  useEffect(() => {
    async function loadAssessments() {
      try {
        await requestMarksheet();
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Assessments could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAssessments();
  }, []);

  const courses = useMemo(() => {
    const records = new Map<number, Course>();

    assessments.forEach((assessment) => {
      if (assessment.course) {
        records.set(
          assessment.course.id,
          assessment.course,
        );
      }
    });

    return Array.from(records.values());
  }, [assessments]);

  const visibleAssessments = useMemo(() => {
    return assessments.filter(
      (assessment) =>
        (!courseId ||
          assessment.course_id ===
            Number(courseId)) &&
        (!type || assessment.type === type),
    );
  }, [assessments, courseId, type]);

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!marksheet) return [];

    if (!term) return marksheet.students;

    return marksheet.students.filter(
      (student) =>
        `${student.student_id} ${student.student_name}`
          .toLowerCase()
          .includes(term),
    );
  }, [marksheet, search]);

  async function selectAssessment(
    value: string,
  ) {
    setAssessmentId(value);
    setMarksheet(null);
    setError("");

    if (!value) return;

    setLoadingSheet(true);

    try {
      await requestMarksheet(value);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Marksheet could not be loaded.",
      );
    } finally {
      setLoadingSheet(false);
    }
  }

  function changeCourse(value: string) {
    setCourseId(value);
    setAssessmentId("");
    setMarksheet(null);
    setSearch("");
  }

  function changeType(value: string) {
    setType(value);
    setAssessmentId("");
    setMarksheet(null);
    setSearch("");
  }

  async function downloadPdf() {
    if (!marksheet || exporting) return;

    setExporting(true);
    setError("");

    try {
      await exportMarksheetPdf(marksheet);
    } catch (exception) {
      console.error(exception);

      setError(
        "The Marksheet PDF could not be generated.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm text-slate-500">
          Academic Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Marksheet
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View and export marks from quizzes, exams and
          assignments for your assigned courses.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <label>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Course
          </span>

          <select
            value={courseId}
            onChange={(event) =>
              changeCourse(event.target.value)
            }
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">
              All assigned courses
            </option>

            {courses.map((course) => (
              <option
                key={course.id}
                value={course.id}
              >
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Assessment type
          </span>

          <select
            value={type}
            onChange={(event) =>
              changeType(event.target.value)
            }
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">
              All assessment types
            </option>
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
            <option value="assignment">
              Assignment
            </option>
          </select>
        </label>

        <label>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Assessment
          </span>

          <select
            value={assessmentId}
            onChange={(event) =>
              void selectAssessment(
                event.target.value,
              )
            }
            disabled={loading}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
          >
            <option value="">
              Select assessment
            </option>

            {visibleAssessments.map(
              (assessment) => (
                <option
                  key={assessment.id}
                  value={assessment.id}
                >
                  {assessment.title}
                </option>
              ),
            )}
          </select>
        </label>
      </section>

      {loading || loadingSheet ? (
        <div className="flex min-h-64 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
          <LoaderCircle
            size={20}
            className="animate-spin"
          />
          Loading marksheet...
        </div>
      ) : !marksheet ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <ClipboardList
            size={34}
            className="mx-auto text-slate-400"
          />

          <p className="mt-3 font-semibold text-slate-900">
            Select an assessment
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Student marks will appear here.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Students"
              value={String(
                marksheet.summary.students,
              )}
            />

            <SummaryCard
              label="Submitted"
              value={String(
                marksheet.summary.submitted,
              )}
            />

            <SummaryCard
              label="Pending"
              value={String(
                marksheet.summary.pending,
              )}
            />

            <SummaryCard
              label="Average"
              value={`${marksheet.summary.average}%`}
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {marksheet.assessment.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      marksheet.assessment.course
                        .name
                    }
                    {" · "}
                    {marksheet.assessment
                      .school_class?.name ??
                      "Class not specified"}
                  </p>

                  <p className="mt-1 text-xs capitalize text-slate-500">
                    {marksheet.assessment.type}
                    {" · "}
                    {
                      marksheet.assessment
                        .total_marks
                    }{" "}
                    marks
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void downloadPdf()
                  }
                  disabled={exporting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {exporting ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Download size={17} />
                  )}

                  {exporting
                    ? "Preparing PDF..."
                    : "Download PDF"}
                </button>
              </div>

              <div className="relative mt-4">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search student by name or ID..."
                  className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">
                      Student ID
                    </th>

                    <th className="px-4 py-3">
                      Student
                    </th>

                    <th className="px-4 py-3">
                      Status
                    </th>

                    <th className="px-4 py-3">
                      Marks
                    </th>

                    <th className="px-4 py-3">
                      Percentage
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {visibleStudents.map(
                    (student) => (
                      <tr
                        key={
                          student.assignment_id
                        }
                        className="hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                          {student.student_id}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {student.student_name}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge
                            status={
                              student.status
                            }
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                          {student.score === null
                            ? "—"
                            : `${student.score} / ${student.total_marks}`}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                          {student.percentage ===
                          null
                            ? "—"
                            : `${student.percentage}%`}
                        </td>
                      </tr>
                    ),
                  )}

                  {visibleStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        No matching students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const submitted = status === "submitted";
  const inProgress =
    status === "in_progress";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize ${
        submitted
          ? "bg-emerald-50 text-emerald-700"
          : inProgress
            ? "bg-blue-50 text-blue-700"
            : "bg-amber-50 text-amber-700"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
