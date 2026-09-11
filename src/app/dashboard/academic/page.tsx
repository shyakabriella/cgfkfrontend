"use client";

import AcademicItemActions from "@/components/academic/academic-item-actions";
import StudentRegistrationForm from "@/components/students/student-registration-form";
import StudentActions from "@/components/students/student-actions";
import {
  getStudents,
  RegisteredStudent,
} from "@/services/student.service";
import {
  BookOpen,
  Building2,
  GraduationCap,
  LoaderCircle,
  Network,
  Plus,
  School,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type AcademicSection = "departments" | "trades" | "classes" | "students";
type ProgramType = "trade" | "option";

type Department = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  status?: "active" | "inactive";
  is_active?: boolean;
};

type DepartmentProgram = {
  id: number;
  department_id: number;
  name: string;
  code: string;
  type: ProgramType;
  description?: string | null;
  status: "active" | "inactive";
  classes_count?: number;
  department?: {
    id: number;
    name: string;
    code: string;
  };
};

type SchoolClass = {
  id: number;
  department_program_id: number;
  name: string;
  code: string;
  level?: string | null;
  description?: string | null;
  status: "active" | "inactive";
  program?: {
    id: number;
    department_id: number;
    name: string;
    code: string;
    type: ProgramType;
    department?: {
      id: number;
      name: string;
      code: string;
    };
  };
};

type DepartmentForm = {
  name: string;
  code: string;
  description: string;
};

type ProgramForm = {
  department_id: string;
  name: string;
  code: string;
  type: ProgramType;
  description: string;
  status: "active" | "inactive";
};

type ClassForm = {
  department_program_id: string;
  name: string;
  code: string;
  level: string;
  description: string;
  status: "active" | "inactive";
};

const sections = [
  {
    id: "departments" as const,
    name: "Departments",
    icon: Building2,
  },
  {
    id: "trades" as const,
    name: "Trades / Options",
    icon: Network,
  },
  {
    id: "classes" as const,
    name: "Classes",
    icon: GraduationCap,
  },
  {
    id: "students" as const,
    name: "Register Student",
    icon: UserPlus,
  },
];

const emptyDepartmentForm: DepartmentForm = {
  name: "",
  code: "",
  description: "",
};

const emptyProgramForm: ProgramForm = {
  department_id: "",
  name: "",
  code: "",
  type: "trade",
  description: "",
  status: "active",
};

const emptyClassForm: ClassForm = {
  department_program_id: "",
  name: "",
  code: "",
  level: "",
  description: "",
  status: "active",
};

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function extractList<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  if (!result || typeof result !== "object") {
    return [];
  }

  const response = result as {
    data?: T[] | { data?: T[] };
  };

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && Array.isArray(response.data.data)) {
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

export default function AcademicPage() {
  const [activeSection, setActiveSection] =
    useState<AcademicSection>("departments");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<DepartmentProgram[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [editingStudent, setEditingStudent] =
    useState<RegisteredStudent | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [departmentForm, setDepartmentForm] =
    useState<DepartmentForm>(emptyDepartmentForm);
  const [programForm, setProgramForm] =
    useState<ProgramForm>(emptyProgramForm);
  const [classForm, setClassForm] =
    useState<ClassForm>(emptyClassForm);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  useEffect(() => {
    async function loadAcademicData() {
      const token = getToken();

      if (!token) {
        setError("Authentication token was not found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [departmentResponse, programResponse, classResponse] =
          await Promise.all([
            fetch(`${apiUrl}/departments?per_page=100`, { headers }),
            fetch(`${apiUrl}/department-programs?per_page=100`, { headers }),
            fetch(`${apiUrl}/school-classes?per_page=100`, { headers }),
          ]);

        const departmentResult = await departmentResponse.json();
        const programResult = await programResponse.json();
        const classResult = await classResponse.json();

        if (!departmentResponse.ok) {
          throw new Error(
            getErrorMessage(
              departmentResult,
              "Departments could not be loaded.",
            ),
          );
        }

        if (!programResponse.ok) {
          throw new Error(
            getErrorMessage(
              programResult,
              "Trades and options could not be loaded.",
            ),
          );
        }

        if (!classResponse.ok) {
          throw new Error(
            getErrorMessage(classResult, "Classes could not be loaded."),
          );
        }

        setDepartments(extractList<Department>(departmentResult));
        setPrograms(extractList<DepartmentProgram>(programResult));
        setClasses(extractList<SchoolClass>(classResult));
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Academic information could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadAcademicData();
  }, [apiUrl]);


  useEffect(() => {
    async function loadStudents() {
      try {
        setStudents(await getStudents());
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Students could not be loaded.",
        );
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, []);

  function handleStudentSaved(student: RegisteredStudent) {
    setStudents((current) => [
      student,
      ...current.filter((item) => item.id !== student.id),
    ]);

    setShowForm(false);
    setSuccess(
      editingStudent
        ? `Student ${student.student_id} updated successfully.`
        : `Student registered successfully. Student ID: ${student.student_id}`,
    );

    setEditingStudent(null);
  }

  function openForm() {
    setError("");
    setSuccess("");
    setEditingStudent(null);
    setShowForm(true);
  }

  function openStudentEdit(student: RegisteredStudent) {
    setError("");
    setSuccess("");
    setEditingStudent(student);
    setActiveSection("students");
    setShowForm(true);
  }

  function closeForm() {
    if (submitting) return;

    setShowForm(false);
    setEditingStudent(null);
    setError("");
    setDepartmentForm(emptyDepartmentForm);
    setProgramForm(emptyProgramForm);
    setClassForm(emptyClassForm);
  }

  async function submitDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError("Authentication token was not found. Please log in again.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${apiUrl}/departments`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: departmentForm.name.trim(),
          code: departmentForm.code.trim().toUpperCase(),
          description: departmentForm.description.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "Department could not be created."),
        );
      }

      const createdDepartment = result.data ?? result;

      setDepartments((current) => [
        createdDepartment,
        ...current.filter(
          (department) => department.id !== createdDepartment.id,
        ),
      ]);

      setDepartmentForm(emptyDepartmentForm);
      setShowForm(false);
      setSuccess("Department created successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Department could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError("Authentication token was not found. Please log in again.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${apiUrl}/department-programs`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          department_id: Number(programForm.department_id),
          name: programForm.name.trim(),
          code: programForm.code.trim().toUpperCase(),
          type: programForm.type,
          description: programForm.description.trim() || null,
          status: programForm.status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "Trade or option could not be created."),
        );
      }

      const createdProgram = result.data ?? result;

      setPrograms((current) => [
        createdProgram,
        ...current.filter((program) => program.id !== createdProgram.id),
      ]);

      setProgramForm(emptyProgramForm);
      setShowForm(false);
      setSuccess(
        `${createdProgram.type === "option" ? "Option" : "Trade"} created successfully.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Trade or option could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError("Authentication token was not found. Please log in again.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${apiUrl}/school-classes`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          department_program_id: Number(
            classForm.department_program_id,
          ),
          name: classForm.name.trim(),
          code: classForm.code.trim().toUpperCase(),
          level: classForm.level.trim() || null,
          description: classForm.description.trim() || null,
          status: classForm.status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "Class could not be created."),
        );
      }

      const createdClass = result.data ?? result;

      setClasses((current) => [
        createdClass,
        ...current.filter(
          (schoolClass) => schoolClass.id !== createdClass.id,
        ),
      ]);

      setClassForm(emptyClassForm);
      setShowForm(false);
      setSuccess("Class created successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Class could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const activeDepartments = departments.filter(
    (department) =>
      department.status !== "inactive" && department.is_active !== false,
  );

  const activePrograms = programs.filter(
    (program) => program.status === "active",
  );

  const activeDetails = {
    departments: {
      title: "Departments",
      description: "Create and manage school departments.",
      icon: Building2,
    },
    trades: {
      title: "Trades / Options",
      description: "Create trades or options inside a department.",
      icon: Network,
    },
    classes: {
      title: "Classes",
      description: "Create classes inside a trade or option.",
      icon: GraduationCap,
    },
    students: {
      title: "Student Registration",
      description: "Register a student and assign the correct class.",
      icon: UserPlus,
    },
  }[activeSection];

  const ActiveIcon = activeDetails.icon;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          School configuration
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Academic Structure
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage departments, trades or options, and classes.
        </p>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {error && !showForm && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {sections.map((section) => {
          const Icon = section.icon;
          const active = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setActiveSection(section.id);
                setSuccess("");
                setError("");
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={17} />
              {section.name}
            </button>
          );
        })}

        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <BookOpen size={17} />
          Courses
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ActiveIcon size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                {activeDetails.title}
              </h2>

              <p className="text-sm text-slate-500">
                {activeDetails.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:self-auto"
          >
            <Plus size={17} />

            {activeSection === "departments"
              ? "Add Department"
              : activeSection === "trades"
                ? "Add Trade / Option"
                : activeSection === "classes"
                  ? "Add Class"
                  : "Add Student"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading...
          </div>
        ) : activeSection === "departments" ? (
          <DepartmentTable departments={departments} />
        ) : activeSection === "trades" ? (
          <ProgramTable programs={programs} />
        ) : activeSection === "classes" ? (
          <ClassTable classes={classes} />
        ) : (
          <StudentTable
            students={students}
            loading={loadingStudents}
            onEdit={openStudentEdit}
          />
        )}
      </section>

      {showForm && activeSection === "departments" && (
        <FormModal
          title="Create Department"
          description="Enter the department information."
          onClose={closeForm}
        >
          <form onSubmit={submitDepartment} className="space-y-4">
            {error && <ErrorMessage message={error} />}

            <FormInput
              label="Department name"
              value={departmentForm.name}
              placeholder="Example: Information Technology"
              onChange={(value) =>
                setDepartmentForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
            />

            <FormInput
              label="Department code"
              value={departmentForm.code}
              placeholder="Example: ICT"
              uppercase
              onChange={(value) =>
                setDepartmentForm((current) => ({
                  ...current,
                  code: value,
                }))
              }
            />

            <FormTextarea
              label="Description"
              value={departmentForm.description}
              onChange={(value) =>
                setDepartmentForm((current) => ({
                  ...current,
                  description: value,
                }))
              }
            />

            <FormActions
              submitting={submitting}
              buttonText="Create Department"
              onCancel={closeForm}
            />
          </form>
        </FormModal>
      )}

      {showForm && activeSection === "trades" && (
        <FormModal
          title="Create Trade / Option"
          description="Add a trade or option under a department."
          onClose={closeForm}
        >
          <form onSubmit={submitProgram} className="space-y-4">
            {error && <ErrorMessage message={error} />}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Department
              </label>

              <select
                required
                value={programForm.department_id}
                onChange={(event) =>
                  setProgramForm((current) => ({
                    ...current,
                    department_id: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select department</option>

                {activeDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name} ({department.code})
                  </option>
                ))}
              </select>

              {activeDepartments.length === 0 && (
                <p className="mt-2 text-xs text-red-600">
                  Create an active department first.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Type
              </label>

              <div className="grid grid-cols-2 gap-3">
                {(["trade", "option"] as ProgramType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setProgramForm((current) => ({
                        ...current,
                        type,
                      }))
                    }
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold capitalize transition ${
                      programForm.type === type
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <FormInput
              label={`${programForm.type === "trade" ? "Trade" : "Option"} name`}
              value={programForm.name}
              placeholder="Example: Software Development"
              onChange={(value) =>
                setProgramForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
            />

            <FormInput
              label="Code"
              value={programForm.code}
              placeholder="Example: SOD"
              uppercase
              onChange={(value) =>
                setProgramForm((current) => ({
                  ...current,
                  code: value,
                }))
              }
            />

            <FormTextarea
              label="Description"
              value={programForm.description}
              onChange={(value) =>
                setProgramForm((current) => ({
                  ...current,
                  description: value,
                }))
              }
            />

            <FormActions
              submitting={submitting}
              disabled={activeDepartments.length === 0}
              buttonText={`Create ${
                programForm.type === "trade" ? "Trade" : "Option"
              }`}
              onCancel={closeForm}
            />
          </form>
        </FormModal>
      )}
      {showForm && activeSection === "classes" && (
        <FormModal
          title="Create Class"
          description="Add a class under a trade or option."
          onClose={closeForm}
        >
          <form onSubmit={submitClass} className="space-y-4">
            {error && <ErrorMessage message={error} />}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Trade / Option
              </label>

              <select
                required
                value={classForm.department_program_id}
                onChange={(event) =>
                  setClassForm((current) => ({
                    ...current,
                    department_program_id: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select trade or option</option>

                {activePrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name} ({program.code}) —{" "}
                    {program.department?.name || "Department"}
                  </option>
                ))}
              </select>

              {activePrograms.length === 0 && (
                <p className="mt-2 text-xs text-red-600">
                  Create an active trade or option first.
                </p>
              )}
            </div>

            <FormInput
              label="Class name"
              value={classForm.name}
              placeholder="Example: Level 3 Software Development"
              onChange={(value) =>
                setClassForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
            />

            <FormInput
              label="Class code"
              value={classForm.code}
              placeholder="Example: L3SOD"
              uppercase
              onChange={(value) =>
                setClassForm((current) => ({
                  ...current,
                  code: value,
                }))
              }
            />

            <FormInput
              label="Level"
              value={classForm.level}
              placeholder="Example: Level 3"
              required={false}
              onChange={(value) =>
                setClassForm((current) => ({
                  ...current,
                  level: value,
                }))
              }
            />

            <FormTextarea
              label="Description"
              value={classForm.description}
              onChange={(value) =>
                setClassForm((current) => ({
                  ...current,
                  description: value,
                }))
              }
            />

            <FormActions
              submitting={submitting}
              disabled={activePrograms.length === 0}
              buttonText="Create Class"
              onCancel={closeForm}
            />
          </form>
        </FormModal>
      )}

      {showForm && activeSection === "students" && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
          <div className="mx-auto my-4 w-full max-w-5xl overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingStudent
                    ? "Edit Student"
                    : "Register Student"}
                </h2>

                <p className="text-sm text-slate-500">
                  {editingStudent
                    ? `Update ${editingStudent.first_name} ${editingStudent.last_name}'s information.`
                    : "Complete the student information below."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close student form"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-2 sm:p-4">
              <StudentRegistrationForm
                mode={editingStudent ? "edit" : "create"}
                student={editingStudent ?? undefined}
                onSuccess={handleStudentSaved}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StudentTable({
  students,
  loading,
  onEdit,
}: {
  students: RegisteredStudent[];
  loading: boolean;
  onEdit: (student: RegisteredStudent) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <LoaderCircle size={19} className="animate-spin" />
        Loading students...
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <UserPlus size={26} />
        </div>

        <h3 className="mt-4 font-semibold text-slate-900">
          No registered students
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Click Add Student to register the first student.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-5">
      <table className="w-full min-w-[950px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <th className="px-3 py-3">Student</th>
            <th className="px-3 py-3">Student ID</th>
            <th className="px-3 py-3">Class</th>
            <th className="px-3 py-3">Parent contact</th>
            <th className="px-3 py-3">Address</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
            >
              <td className="px-3 py-4">
                <div className="flex items-center gap-3">
                  {student.image_url ? (
                    <img
                      src={student.image_url}
                      alt={`${student.first_name} ${student.last_name}`}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
                      {student.first_name.charAt(0)}
                      {student.last_name.charAt(0)}
                    </div>
                  )}

                  <span className="font-medium text-slate-900">
                    {student.first_name} {student.last_name}
                  </span>
                </div>
              </td>

              <td className="px-3 py-4">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                  {student.student_id}
                </span>
              </td>

              <td className="px-3 py-4 text-sm text-slate-600">
                {student.school_class?.name || "—"}
              </td>

              <td className="px-3 py-4 text-sm text-slate-600">
                {student.parent_contact}
              </td>

              <td className="px-3 py-4 text-sm text-slate-600">
                {[
                  student.province,
                  student.district,
                  student.sector,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </td>

              <td className="px-3 py-4">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                  {student.status}
                </span>
              </td>

              <td className="px-3 py-4">
                <StudentActions
                  student={student}
                  onEdit={onEdit}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DepartmentTable({
  departments,
}: {
  departments: Department[];
}) {
  if (departments.length === 0) {
    return <EmptyState text="No departments created." icon={Building2} />;
  }

  return (
    <div className="overflow-x-auto p-5">
      <table className="w-full min-w-[650px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {departments.map((department) => (
            <tr
              key={department.id}
              className="border-b border-slate-100 last:border-0"
            >
              <td className="px-4 py-4 font-medium text-slate-900">
                {department.name}
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">
                {department.code}
              </td>
              <td className="px-4 py-4 text-sm text-slate-500">
                {department.description || "—"}
              </td>
              <td className="px-4 py-4">
                <StatusBadge
                  active={
                    department.status !== "inactive" &&
                    department.is_active !== false
                  }
                />
              </td>
              <td className="px-4 py-4">
                <AcademicItemActions
                  resource="departments"
                  item={department}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgramTable({
  programs,
}: {
  programs: DepartmentProgram[];
}) {
  if (programs.length === 0) {
    return <EmptyState text="No trades or options created." icon={Network} />;
  }

  return (
    <div className="overflow-x-auto p-5">
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Classes</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {programs.map((program) => (
            <tr
              key={program.id}
              className="border-b border-slate-100 last:border-0"
            >
              <td className="px-4 py-4 font-medium text-slate-900">
                {program.name}
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">
                {program.code}
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                  {program.type}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">
                {program.department?.name || "—"}
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">
                {program.classes_count ?? 0}
              </td>
              <td className="px-4 py-4">
                <StatusBadge active={program.status === "active"} />
              </td>
              <td className="px-4 py-4">
                <AcademicItemActions
                  resource="department-programs"
                  item={program}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClassTable({
  classes,
}: {
  classes: SchoolClass[];
}) {
  if (classes.length === 0) {
    return <EmptyState text="No classes created." icon={GraduationCap} />;
  }

  return (
    <div className="overflow-x-auto p-5">
      <table className="w-full min-w-[850px] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <th className="px-4 py-3">Class</th>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Level</th>
            <th className="px-4 py-3">Trade / Option</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {classes.map((schoolClass) => (
            <tr
              key={schoolClass.id}
              className="border-b border-slate-100 last:border-0"
            >
              <td className="px-4 py-4 font-medium text-slate-900">
                {schoolClass.name}
              </td>

              <td className="px-4 py-4 text-sm text-slate-600">
                {schoolClass.code}
              </td>

              <td className="px-4 py-4 text-sm text-slate-600">
                {schoolClass.level || "—"}
              </td>

              <td className="px-4 py-4 text-sm text-slate-600">
                {schoolClass.program?.name || "—"}
              </td>

              <td className="px-4 py-4 text-sm text-slate-600">
                {schoolClass.program?.department?.name || "—"}
              </td>

              <td className="px-4 py-4">
                <StatusBadge active={schoolClass.status === "active"} />
              </td>
              <td className="px-4 py-4">
                <AcademicItemActions
                  resource="school-classes"
                  item={schoolClass}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function EmptyState({
  text,
  icon: Icon,
}: {
  text: string;
  icon: typeof School;
}) {
  return (
    <div className="py-16 text-center">
      <Icon size={40} className="mx-auto text-slate-300" />
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function FormModal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  placeholder,
  uppercase = false,
  required = true,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  uppercase?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(uppercase ? event.target.value.toUpperCase() : event.target.value)
        }
        className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
          uppercase ? "uppercase" : ""
        }`}
      />
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label} <span className="font-normal text-slate-400">(optional)</span>
      </label>

      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function FormActions({
  submitting,
  disabled = false,
  buttonText,
  onCancel,
}: {
  submitting: boolean;
  disabled?: boolean;
  buttonText: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={submitting || disabled}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? (
          <>
            <LoaderCircle size={17} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Plus size={17} />
            {buttonText}
          </>
        )}
      </button>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}
