"use client";



import {
  BookOpen,
  CheckCircle2,
  FileText,
  LoaderCircle,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Course = {
  id: number;
  name: string;
  code: string;
  hours: number;
  periods: number;
  status: "active" | "inactive";
  created_at?: string;
  curriculum_path?: string | null;
  curriculum_url?: string | null;
  notes_path?: string | null;
  notes_url?: string | null;
  teacher_assignments?: Array<{
    id: number;
    school_class_id: number;
    status: "active" | "inactive";
    school_class?: {
      id: number;
      name: string;
      code: string;
      level?: string | null;
    };
  }>;
};

type CourseForm = {
  name: string;
  code: string;
  hours: string;
  periods: string;
};

const emptyForm: CourseForm = {
  name: "",
  code: "",
  hours: "",
  periods: "",
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function extractCourses(result: unknown): Course[] {
  if (Array.isArray(result)) {
    return result as Course[];
  }

  const response = result as {
    data?: Course[] | { data?: Course[] };
  };

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (response?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
}

function getErrorMessage(result: unknown, fallback: string) {
  if (!result || typeof result !== "object") {
    return fallback;
  }

  const response = result as {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (response.errors) {
    return Object.values(response.errors).flat().join(" ");
  }

  return response.message || fallback;
}

function generateCourseCode(name: string) {
  const words = name
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "";
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  return words
    .slice(0, 4)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");
  const [editingCourse, setEditingCourse] =
    useState<Course | null>(null);
  const [openMenuId, setOpenMenuId] =
    useState<number | null>(null);
  const [deletingCourseId, setDeletingCourseId] =
    useState<number | null>(null);
  const [curriculumFile, setCurriculumFile] =
    useState<File | null>(null);
  const [notesFile, setNotesFile] =
    useState<File | null>(null);
  const [uploadingMaterials, setUploadingMaterials] =
    useState(false);

  const isTeacher = userRole === "teacher";

  const canManageCourses = [
    "admin",
    "headmaster",
    "director_of_studies",
  ].includes(userRole);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("cgfk_user") ??
      sessionStorage.getItem("cgfk_user");

    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser) as {
        role?: string;
      };

      setUserRole(user.role ?? "");
    } catch {
      setUserRole("");
    }
  }, []);

  useEffect(() => {
    async function loadCourses() {
      const token = getToken();

      if (!token) {
        setError("Authentication token was not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${apiUrl}/courses?per_page=100`,
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
            getErrorMessage(result, "Courses could not be loaded."),
          );
        }

        setCourses(extractCourses(result));
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Courses could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  const visibleCourses = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return courses;
    }

    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(value) ||
        course.code.toLowerCase().includes(value),
    );
  }, [courses, search]);

  function openModal() {
    if (isTeacher) return;

    setEditingCourse(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setOpenMenuId(null);
    setShowModal(true);
  }

  function openEditModal(course: Course) {
    setEditingCourse(course);
    setForm({
      name: course.name,
      code: course.code,
      hours: String(course.hours),
      periods: String(course.periods),
    });
    setError("");
    setSuccess("");
    setOpenMenuId(null);
    setShowModal(true);
  }

  function closeModal() {
    if (submitting) return;

    setShowModal(false);
    setEditingCourse(null);
    setForm(emptyForm);
    setError("");
  }

  function updateCourseName(name: string) {
    setForm((current) => ({
      ...current,
      name,
      code: generateCourseCode(name),
    }));
  }

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError("Authentication token was not found.");
      return;
    }

    if (!form.code) {
      setError("Enter the course name to generate its code.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = editingCourse
        ? `${apiUrl}/courses/${editingCourse.id}`
        : `${apiUrl}/courses`;

      const response = await fetch(endpoint, {
        method: editingCourse ? "PATCH" : "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code,
          hours: Number(form.hours),
          periods: Number(form.periods),
          status: "active",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "Course could not be created."),
        );
      }

      const savedCourse = (result.data ?? result) as Course;

      setCourses((current) =>
        editingCourse
          ? current.map((course) =>
              course.id === savedCourse.id
                ? savedCourse
                : course,
            )
          : [
              savedCourse,
              ...current.filter(
                (course) => course.id !== savedCourse.id,
              ),
            ],
      );

      setShowModal(false);
      setEditingCourse(null);
      setForm(emptyForm);
      setSuccess(
        editingCourse
          ? `${savedCourse.name} updated successfully.`
          : `${savedCourse.name} created with code ${savedCourse.code}.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Course could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCourse(course: Course) {
    if (deletingCourseId) return;

    const confirmed = window.confirm(
      `Archive "${course.name}"? This course will no longer be active.`,
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      setError("Authentication token was not found.");
      return;
    }

    setDeletingCourseId(course.id);
    setOpenMenuId(null);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${apiUrl}/courses/${course.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            "Course could not be archived.",
          ),
        );
      }

      setCourses((current) =>
        current.filter((item) => item.id !== course.id),
      );

      setSuccess(`${course.name} archived successfully.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Course could not be archived.",
      );
    } finally {
      setDeletingCourseId(null);
    }
  }

  async function uploadCourseMaterials(
    course: Course,
  ) {
    if (!curriculumFile && !notesFile) {
      setError(
        "Select a curriculum or course notes file.",
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Authentication token was not found.");
      return;
    }

    const data = new FormData();

    if (curriculumFile) {
      data.append("curriculum", curriculumFile);
    }

    if (notesFile) {
      data.append("notes", notesFile);
    }

    setUploadingMaterials(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${apiUrl}/courses/${course.id}/materials`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: data,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            "Course materials could not be uploaded.",
          ),
        );
      }

      const updatedCourse = (
        result.data ?? result
      ) as Course;

      setCourses((current) =>
        current.map((item) =>
          item.id === updatedCourse.id
            ? {
                ...item,
                ...updatedCourse,
              }
            : item,
        ),
      );

      setCurriculumFile(null);
      setNotesFile(null);
      setOpenMenuId(null);
      setSuccess(
        "Course materials uploaded successfully.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Course materials could not be uploaded.",
      );
    } finally {
      setUploadingMaterials(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Courses
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {isTeacher
              ? "View the courses and classes assigned to you."
              : "Create and manage courses taught at the school."}
          </p>
        </div>

        {(
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Course
          </button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
            placeholder="Search courses by name or code..."
            className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              {isTeacher ? "My Assigned Courses" : "Course List"}
            </h2>

            <p className="text-sm text-slate-500">
              {visibleCourses.length}{" "}
              {visibleCourses.length === 1 ? "course" : "courses"}
            </p>
          </div>

          <BookOpen size={21} className="text-blue-600" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading courses...
          </div>
        ) : visibleCourses.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BookOpen size={27} />
            </div>

            <h2 className="mt-4 font-semibold text-slate-900">
              No courses found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {isTeacher
                ? "You do not currently have an active course assignment."
                : "Click Add Course to create the first course."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">Course Name</th>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">Hours</th>
                  <th className="px-3 py-3">Periods</th>

                  {isTeacher && (
                    <th className="px-3 py-3">
                      Assigned Classes
                    </th>
                  )}

                  <th className="px-3 py-3">Status</th>

                  <th className="w-20 px-3 py-3 text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-3 py-4 font-medium text-slate-900">
                      {course.name}
                    </td>

                    <td className="px-3 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {course.code}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-sm font-semibold text-slate-700">
                      {course.hours}
                    </td>

                    <td className="px-3 py-4 text-sm font-semibold text-slate-700">
                      {course.periods}
                    </td>

                    {isTeacher && (
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {course.teacher_assignments?.length ? (
                            course.teacher_assignments.map(
                              (assignment) => (
                                <span
                                  key={assignment.id}
                                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700"
                                >
                                  {assignment.school_class?.name ??
                                    assignment.school_class?.code ??
                                    "Class"}
                                </span>
                              ),
                            )
                          ) : (
                            <span className="text-sm text-slate-400">
                              No class
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          course.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>

                    <td className="relative px-3 py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId((current) =>
                            current === course.id
                              ? null
                              : course.id,
                          )
                        }
                        disabled={
                          deletingCourseId === course.id
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                        aria-label={`Manage ${course.name}`}
                        aria-expanded={
                          openMenuId === course.id
                        }
                      >
                        {deletingCourseId === course.id ? (
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <MoreVertical size={20} />
                        )}
                      </button>


                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {openMenuId !== null && (() => {
        const selectedCourse = courses.find(
          (course) => course.id === openMenuId,
        );

        if (!selectedCourse) return null;

        return (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setOpenMenuId(null);
              }
            }}
          >
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Course Management
                  </p>

                  <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                    Manage Course
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenMenuId(null)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close course management"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <p className="font-semibold text-slate-900">
                  {selectedCourse.name}
                </p>

                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-md bg-white px-2 py-1 font-bold text-slate-700 ring-1 ring-slate-200">
                    {selectedCourse.code}
                  </span>

                  <span>
                    {selectedCourse.hours} hours
                  </span>

                  <span>·</span>

                  <span>
                    {selectedCourse.periods} periods
                  </span>
                </div>
              </div>

              <div className="space-y-4 border-b border-slate-200 p-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Course Materials
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Upload PDF, DOC or DOCX files. Maximum 20 MB.
                  </p>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Course curriculum
                  </span>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(event) =>
                      setCurriculumFile(
                        event.target.files?.[0] ?? null,
                      )
                    }
                    className="block w-full rounded-lg border border-slate-300 bg-white text-xs text-slate-600 file:mr-3 file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2.5 file:text-xs file:font-semibold file:text-slate-700"
                  />

                  {selectedCourse.curriculum_url && (
                    <a
                      href={selectedCourse.curriculum_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <FileText size={14} />
                      View current curriculum
                    </a>
                  )}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Course notes
                  </span>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(event) =>
                      setNotesFile(
                        event.target.files?.[0] ?? null,
                      )
                    }
                    className="block w-full rounded-lg border border-slate-300 bg-white text-xs text-slate-600 file:mr-3 file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2.5 file:text-xs file:font-semibold file:text-slate-700"
                  />

                  {selectedCourse.notes_url && (
                    <a
                      href={selectedCourse.notes_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <FileText size={14} />
                      View current notes
                    </a>
                  )}
                </label>

                <button
                  type="button"
                  onClick={() =>
                    void uploadCourseMaterials(
                      selectedCourse,
                    )
                  }
                  disabled={
                    uploadingMaterials ||
                    (!curriculumFile && !notesFile)
                  }
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {uploadingMaterials ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Upload size={17} />
                  )}

                  {uploadingMaterials
                    ? "Uploading..."
                    : "Upload Materials"}
                </button>
              </div>

              {canManageCourses && (
                <div className="space-y-2 p-4">
                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(selectedCourse)
                    }
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Pencil size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Edit course
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Update name, code, hours and periods.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void deleteCourse(selectedCourse)
                  }
                  disabled={
                    deletingCourseId === selectedCourse.id
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-red-100 px-4 py-3 text-left transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    {deletingCourseId === selectedCourse.id ? (
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Archive course
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Remove this course from active courses.
                    </p>
                  </div>
                </button>
                </div>
              )}

              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpenMenuId(null)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  {editingCourse
                    ? "Edit Course"
                    : "Create Course"}
                </h2>

                <p className="text-sm text-slate-500">
                  {editingCourse
                    ? "Update the course information."
                    : "The course code is generated automatically."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createCourse} className="space-y-4 p-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Course name
                </span>

                <input
                  required
                  value={form.name}
                  placeholder="Example: Mathematics"
                  onChange={(event) =>
                    updateCourseName(event.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Generated code
                </span>

                <input
                  readOnly
                  value={form.code}
                  placeholder="Generated automatically"
                  className="h-10 w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm font-semibold uppercase text-slate-700 outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Course hours
                  </span>

                  <input
                    required
                    type="number"
                    min="1"
                    value={form.hours}
                    placeholder="Example: 120"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        hours: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Course periods
                  </span>

                  <input
                    required
                    type="number"
                    min="1"
                    value={form.periods}
                    placeholder="Example: 180"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        periods: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !form.name ||
                    !form.code ||
                    !form.hours ||
                    !form.periods
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting && (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {submitting
                    ? editingCourse
                      ? "Updating..."
                      : "Creating..."
                    : editingCourse
                      ? "Update Course"
                      : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
