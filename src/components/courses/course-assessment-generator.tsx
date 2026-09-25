"use client";

import AssessmentAssignmentPanel from "@/components/assessments/assessment-assignment-panel";

import {
  Check,
  CheckCircle2,
  FileQuestion,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AssignedClass = {
  id: number;
  name: string;
  code: string;
  level?: string | null;
};

type TeacherAssignment = {
  id: number;
  school_class_id: number;
  status: "active" | "inactive";
  school_class?: AssignedClass;
};

type IndicativeContent = {
  id: number;
  title: string;
  details?: string | null;
};

type LearningUnit = {
  id: number;
  title: string;
  code?: string | null;
  indicative_contents: IndicativeContent[];
};

export type AssessmentCourse = {
  id: number;
  name: string;
  code: string;
  curriculum_url?: string | null;
  notes_url?: string | null;
  teacher_assignments?: TeacherAssignment[];
};

type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "essay";

type GeneratedQuestion = {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[] | null;
  correct_answer?: string | null;
  explanation?: string | null;
  marks: number;
  position: number;
};

type GeneratedAssessment = {
  id: number;
  title: string;
  type: "assignment" | "quiz" | "exam";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  instructions?: string | null;
  duration_minutes?: number | null;
  total_marks: number;
  question_count: number;
  status: "draft" | "published" | "archived";
  questions: GeneratedQuestion[];
};

type AssessmentForm = {
  school_class_id: string;
  course_learning_unit_id: string;
  course_indicative_content_id: string;
  title: string;
  type: "assignment" | "quiz" | "exam";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  question_count: string;
  duration_minutes: string;
  total_marks: string;
  use_curriculum: boolean;
  use_notes: boolean;
  question_types: QuestionType[];
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

const questionTypeOptions: Array<{
  value: QuestionType;
  label: string;
}> = [
  {
    value: "multiple_choice",
    label: "Multiple choice",
  },
  {
    value: "true_false",
    label: "True or false",
  },
  {
    value: "short_answer",
    label: "Short answer",
  },
  {
    value: "essay",
    label: "Essay",
  },
];

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function getErrorMessage(
  result: unknown,
  fallback: string,
) {
  if (!result || typeof result !== "object") {
    return fallback;
  }

  const response = result as {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (response.errors) {
    return Object.values(response.errors)
      .flat()
      .join(" ");
  }

  return response.message || fallback;
}

function getAssessment(
  result: unknown,
): GeneratedAssessment | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  const response = result as {
    data?: GeneratedAssessment;
  };

  return response.data ?? (result as GeneratedAssessment);
}

function isPdf(url?: string | null) {
  if (!url) return false;

  return url
    .split("?")[0]
    .toLowerCase()
    .endsWith(".pdf");
}

export default function CourseAssessmentGenerator({
  course,
  standalone = false,
}: {
  course: AssessmentCourse;
  standalone?: boolean;
}) {
  const router = useRouter();
  const curriculumIsPdf = isPdf(
    course.curriculum_url,
  );
  const notesArePdf = isPdf(course.notes_url);

  const initialForm = useMemo<AssessmentForm>(
    () => ({
      school_class_id: "",
      course_learning_unit_id: "",
      course_indicative_content_id: "",
      title: `${course.name} Quiz`,
      type: "quiz",
      difficulty: "medium",
      question_count: "10",
      duration_minutes: "30",
      total_marks: "20",
      use_curriculum: curriculumIsPdf,
      use_notes: notesArePdf,
      question_types: [
        "multiple_choice",
        "true_false",
      ],
    }),
    [
      course.name,
      curriculumIsPdf,
      notesArePdf,
    ],
  );

  const [learningUnits, setLearningUnits] =
    useState<LearningUnit[]>([]);
  const [loadingUnits, setLoadingUnits] =
    useState(false);

  const assignedClasses = useMemo(() => {
    const classes = new Map<number, AssignedClass>();

    course.teacher_assignments
      ?.filter(
        (assignment) =>
          assignment.status === "active" &&
          assignment.school_class,
      )
      .forEach((assignment) => {
        if (assignment.school_class) {
          classes.set(
            assignment.school_class.id,
            assignment.school_class,
          );
        }
      });

    return Array.from(classes.values());
  }, [course.teacher_assignments]);

  const [open, setOpen] = useState(standalone);
  const [form, setForm] =
    useState<AssessmentForm>(initialForm);
  const [generated, setGenerated] =
    useState<GeneratedAssessment | null>(null);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  async function openGenerator() {
    setForm({
      ...initialForm,
      school_class_id:
        assignedClasses.length === 1
          ? String(assignedClasses[0].id)
          : "",
    });
    setGenerated(null);
    setError("");
    setOpen(true);
    setLoadingUnits(true);

    const token = getToken();

    if (!token) {
      setError("Authentication token was not found.");
      setLoadingUnits(false);
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/courses/${course.id}/learning-units`,
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
          getErrorMessage(
            result,
            "Learning units could not be loaded.",
          ),
        );
      }

      const learningUnitRecords =
        result.data?.learning_units ??
        result.learning_units ??
        result.data?.data ??
        result.data ??
        [];

      setLearningUnits(
        Array.isArray(learningUnitRecords)
          ? learningUnitRecords
          : [],
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Learning units could not be loaded.",
      );
    } finally {
      setLoadingUnits(false);
    }
  }

  useEffect(() => {
    if (standalone) {
      void openGenerator();
    }
  }, [standalone, course.id]);

  function closeGenerator() {
    if (submitting) return;

    if (standalone) {
      router.push("/dashboard/assessments");
      return;
    }

    setOpen(false);
    setGenerated(null);
    setError("");
  }

  function changeAssessmentType(
    type: AssessmentForm["type"],
  ) {
    const title =
      type === "exam"
        ? `${course.name} Exam`
        : type === "assignment"
          ? `${course.name} Assignment`
          : `${course.name} Quiz`;

    setForm((current) => ({
      ...current,
      type,
      title,
    }));
  }

  function toggleQuestionType(
    questionType: QuestionType,
  ) {
    setForm((current) => {
      const selected =
        current.question_types.includes(questionType);

      return {
        ...current,
        question_types: selected
          ? current.question_types.filter(
              (item) => item !== questionType,
            )
          : [
              ...current.question_types,
              questionType,
            ],
      };
    });
  }

  async function generateAssessment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !form.use_curriculum &&
      !form.use_notes
    ) {
      setError(
        "Select the curriculum, course notes, or both.",
      );
      return;
    }

    if (form.question_types.length === 0) {
      setError(
        "Select at least one question type.",
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Authentication token was not found.",
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setGenerated(null);

    try {
      const response = await fetch(
        `${apiUrl}/courses/${course.id}/generate-assessment`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            school_class_id: Number(
              form.school_class_id,
            ),
            course_learning_unit_id: Number(
              form.course_learning_unit_id,
            ),
            course_indicative_content_id: Number(
              form.course_indicative_content_id,
            ),
            type: form.type,
            title: form.title.trim(),
            difficulty: form.difficulty,
            question_count: Number(
              form.question_count,
            ),
            question_types:
              form.question_types,
            duration_minutes: Number(
              form.duration_minutes,
            ),
            total_marks: Number(
              form.total_marks,
            ),
            use_curriculum:
              form.use_curriculum,
            use_notes: form.use_notes,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            "The assessment could not be generated.",
          ),
        );
      }

      const assessment =
        getAssessment(result);

      if (!assessment) {
        throw new Error(
          "The server returned an invalid assessment.",
        );
      }

      setGenerated(assessment);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The assessment could not be generated.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {!standalone && (
<button
        type="button"
        onClick={() => void openGenerator()}
        className="flex w-full items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-left transition hover:border-violet-300 hover:bg-violet-100"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
          <Sparkles size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            Generate assessment
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            Create an assignment, quiz or exam using AI.
          </p>
        </div>
      </button>
      )}

      {open && (
        <div
          className={
          standalone
            ? "w-full"
            : "fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        }
          onMouseDown={(event) => {
            if (
              !standalone &&
              event.target ===
                event.currentTarget &&
              !submitting
            ) {
              closeGenerator();
            }
          }}
        >
          <div className={
            standalone
              ? "flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              : "flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          }>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  AI Assessment Generator
                </p>

                <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                  {course.name}
                </h2>

                <p className="text-xs text-slate-500">
                  {course.code}
                </p>
              </div>

              {!standalone && (
<button
                type="button"
                onClick={closeGenerator}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close assessment generator"
              >
                <X size={20} />
              </button>
            )}
            </div>

            <div className="overflow-y-auto">
              {!generated ? (
                <form
                  onSubmit={generateAssessment}
                  className="space-y-5 p-4 sm:p-6"
                >
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {!curriculumIsPdf &&
                    !notesArePdf && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Upload the curriculum or course notes as a PDF before generating an assessment.
                      </div>
                    )}

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">
                        Assigned class
                      </span>

                      <select
                        required
                        value={form.school_class_id}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            school_class_id:
                              event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      >
                        <option value="">
                          Select class
                        </option>

                        {assignedClasses.map(
                          (schoolClass) => (
                            <option
                              key={schoolClass.id}
                              value={schoolClass.id}
                            >
                              {schoolClass.name}
                              {schoolClass.code
                                ? ` (${schoolClass.code})`
                                : ""}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">
                        Learning unit
                      </span>

                      <select
                        required
                        disabled={loadingUnits}
                        value={
                          form.course_learning_unit_id
                        }
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            course_learning_unit_id:
                              event.target.value,
                            course_indicative_content_id:
                              "",
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
                      >
                        <option value="">
                          {loadingUnits
                            ? "Loading units..."
                            : "Select learning unit"}
                        </option>

                        {learningUnits.map((unit) => (
                          <option
                            key={unit.id}
                            value={unit.id}
                          >
                            {unit.code
                              ? `${unit.code} — `
                              : ""}
                            {unit.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">
                        Indicative content
                      </span>

                      <select
                        required
                        disabled={
                          !form.course_learning_unit_id
                        }
                        value={
                          form.course_indicative_content_id
                        }
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            course_indicative_content_id:
                              event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
                      >
                        <option value="">
                          Select indicative content
                        </option>

                        {learningUnits
                          .find(
                            (unit) =>
                              unit.id ===
                              Number(
                                form.course_learning_unit_id,
                              ),
                          )
                          ?.indicative_contents.map(
                            (content) => (
                              <option
                                key={content.id}
                                value={content.id}
                              >
                                {content.title}
                              </option>
                            ),
                          )}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">
                        Assessment title
                      </span>

                      <input
                        required
                        value={form.title}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            title:
                              event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">
                        Assessment type
                      </span>

                      <select
                        value={form.type}
                        onChange={(event) =>
                          changeAssessmentType(
                            event.target
                              .value as AssessmentForm["type"],
                          )
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      >
                        <option value="assignment">
                          Assignment
                        </option>

                        <option value="quiz">
                          Quiz
                        </option>

                        <option value="exam">
                          Exam
                        </option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">
                        Difficulty
                      </span>

                      <select
                        value={form.difficulty}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            difficulty:
                              event.target
                                .value as AssessmentForm["difficulty"],
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      >
                        <option value="easy">
                          Easy
                        </option>

                        <option value="medium">
                          Medium
                        </option>

                        <option value="hard">
                          Hard
                        </option>

                        <option value="mixed">
                          Mixed
                        </option>
                      </select>
                    </label>

                    <NumberField
                      label="Number of questions"
                      value={form.question_count}
                      min={1}
                      max={50}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          question_count: value,
                        }))
                      }
                    />

                    <NumberField
                      label="Total marks"
                      value={form.total_marks}
                      min={1}
                      max={1000}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          total_marks: value,
                        }))
                      }
                    />

                    <NumberField
                      label="Duration in minutes"
                      value={
                        form.duration_minutes
                      }
                      min={5}
                      max={360}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          duration_minutes:
                            value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Source documents
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Gemini will only use the selected PDF documents.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <SourceCheckbox
                        label="Course curriculum"
                        checked={
                          form.use_curriculum
                        }
                        available={
                          curriculumIsPdf
                        }
                        onChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            use_curriculum:
                              checked,
                          }))
                        }
                      />

                      <SourceCheckbox
                        label="Course notes"
                        checked={form.use_notes}
                        available={notesArePdf}
                        onChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            use_notes: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Question types
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {questionTypeOptions.map(
                        (option) => {
                          const selected =
                            form.question_types.includes(
                              option.value,
                            );

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                toggleQuestionType(
                                  option.value,
                                )
                              }
                              className={`flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                selected
                                  ? "border-violet-600 bg-violet-50 text-violet-700"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {selected && (
                                <Check
                                  size={15}
                                />
                              )}

                              {option.label}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
                    The assessment will be saved as a draft. Review every question and answer before publishing it to students.
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeGenerator}
                      disabled={submitting}
                      className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        (!form.use_curriculum &&
                          !form.use_notes) ||
                        form.question_types
                          .length === 0
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {submitting ? (
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <Sparkles size={17} />
                      )}

                      {submitting
                        ? "Generating assessment..."
                        : "Generate Assessment"}
                    </button>
                  </div>
                </form>
              ) : (
                <AssessmentPreview
                  assessment={generated}
                  onClose={closeGenerator}
                  onGenerateAnother={() => {
                    setGenerated(null);
                    setError("");
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        required
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
      />
    </label>
  );
}

function SourceCheckbox({
  label,
  checked,
  available,
  onChange,
}: {
  label: string;
  checked: boolean;
  available: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        available
          ? "cursor-pointer border-slate-200 bg-white"
          : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={!available}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
      />

      <div>
        <p className="text-sm font-semibold text-slate-800">
          {label}
        </p>

        <p className="text-xs text-slate-500">
          {available
            ? "PDF ready"
            : "PDF not uploaded"}
        </p>
      </div>
    </label>
  );
}

function AssessmentPreview({
  assessment,
  onClose,
  onGenerateAnother,
}: {
  assessment: GeneratedAssessment;
  onClose: () => void;
  onGenerateAnother: () => void;
}) {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2
          size={21}
          className="mt-0.5 shrink-0 text-emerald-600"
        />

        <div>
          <p className="font-semibold text-emerald-800">
            Assessment generated successfully
          </p>

          <p className="mt-1 text-sm text-emerald-700">
            It has been saved as a draft for your review.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              {assessment.type}
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {assessment.title}
            </h3>

            {assessment.instructions && (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {assessment.instructions}
              </p>
            )}
          </div>

          <span className="self-start rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-700">
            {assessment.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryItem
            label="Questions"
            value={String(
              assessment.question_count,
            )}
          />

          <SummaryItem
            label="Marks"
            value={String(
              assessment.total_marks,
            )}
          />

          <SummaryItem
            label="Minutes"
            value={String(
              assessment.duration_minutes ??
                "—",
            )}
          />
        </div>
      </div>

      <AssessmentAssignmentPanel
        assessmentId={assessment.id}
      />

      <div className="mt-5 space-y-3">
        {assessment.questions.map(
          (question, index) => (
            <div
              key={question.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold leading-6 text-slate-900">
                  {index + 1}.{" "}
                  {question.question}
                </p>

                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {question.marks}{" "}
                  {question.marks === 1
                    ? "mark"
                    : "marks"}
                </span>
              </div>

              {question.options &&
                question.options.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {question.options.map(
                      (option, optionIndex) => (
                        <div
                          key={`${question.id}-${optionIndex}`}
                          className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                        >
                          {String.fromCharCode(
                            65 + optionIndex,
                          )}
                          . {option}
                        </div>
                      ),
                    )}
                  </div>
                )}

              {question.correct_answer && (
                <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <span className="font-semibold">
                    Answer:
                  </span>{" "}
                  {question.correct_answer}
                </div>
              )}

              {question.explanation && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {question.explanation}
                </p>
              )}
            </div>
          ),
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onGenerateAnother}
          className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Generate another
        </button>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <FileQuestion size={17} />
          Finish
        </button>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-3 text-center">
      <p className="text-lg font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-0.5 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}
