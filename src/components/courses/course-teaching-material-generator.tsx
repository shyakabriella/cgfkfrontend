"use client";

import { downloadTeachingMaterialPdf } from "@/lib/download-teaching-material-pdf";

import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

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

type Course = {
  id: number;
  name: string;
  code: string;
  curriculum_url?: string | null;
  notes_url?: string | null;
  teacher_assignments?: TeacherAssignment[];
};

type IndicativeContent = {
  id: number;
  course_learning_unit_id: number;
  title: string;
  details?: string | null;
  source_page?: string | null;
  position: number;
};

type LearningUnit = {
  id: number;
  course_id: number;
  code?: string | null;
  title: string;
  description?: string | null;
  learning_outcomes?: string[] | null;
  source_page?: string | null;
  position: number;
  indicative_contents: IndicativeContent[];
};

type SourceReference = {
  document: string;
  page_reference: string;
  excerpt: string;
};

type TeachingPoint = {
  title: string;
  explanation: string;
};

type LessonSection = {
  heading: string;
  introduction: string;
  paragraphs: string[];
  key_points: TeachingPoint[];
  examples: TeachingPoint[];
  highlights: string[];
  source_references: SourceReference[];

  // Supports teaching materials generated before
  // the structured format was introduced.
  content?: string;
};

type GeneratedContent = {
  status: "generated" | "insufficient_material";
  message: string;
  title: string;
  lesson_summary: string;
  lesson_sections: LessonSection[];
};

type TeachingMaterial = {
  id: number;
  title: string;
  lesson_date: string;
  duration_minutes: number;
  status:
    | "draft"
    | "approved"
    | "insufficient_material"
    | "archived";
  generated_content: GeneratedContent;
  school_class?: AssignedClass;
  learning_unit?: LearningUnit;
  indicative_content?: IndicativeContent;
};

type GeneratorForm = {
  school_class_id: string;
  course_learning_unit_id: string;
  course_indicative_content_id: string;
  lesson_date: string;
  duration_minutes: string;
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function currentDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(
    date.getTime() - offset * 60 * 1000,
  );

  return localDate.toISOString().split("T")[0];
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

function extractLearningUnits(
  result: unknown,
): LearningUnit[] {
  if (Array.isArray(result)) {
    return result as LearningUnit[];
  }

  const response = result as {
    data?: LearningUnit[];
  };

  return Array.isArray(response?.data)
    ? response.data
    : [];
}

function extractTeachingMaterial(
  result: unknown,
): TeachingMaterial | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  const response = result as {
    data?: TeachingMaterial;
  };

  return response.data ?? (result as TeachingMaterial);
}

function isPdf(url?: string | null) {
  if (!url) return false;

  return url
    .split("?")[0]
    .toLowerCase()
    .endsWith(".pdf");
}

export default function CourseTeachingMaterialGenerator({
  course,
  standalone = false,
}: {
  course: Course;
  standalone?: boolean;
}) {
  const router = useRouter();
  const classes = useMemo(() => {
    const classMap = new Map<number, AssignedClass>();

    course.teacher_assignments
      ?.filter(
        (assignment) =>
          assignment.status === "active" &&
          assignment.school_class,
      )
      .forEach((assignment) => {
        if (assignment.school_class) {
          classMap.set(
            assignment.school_class.id,
            assignment.school_class,
          );
        }
      });

    return Array.from(classMap.values());
  }, [course.teacher_assignments]);

  const [open, setOpen] = useState(standalone);
  const [learningUnits, setLearningUnits] = useState<
    LearningUnit[]
  >([]);
  const [form, setForm] = useState<GeneratorForm>({
    school_class_id: "",
    course_learning_unit_id: "",
    course_indicative_content_id: "",
    lesson_date: currentDate(),
    duration_minutes: "80",
  });
  const [generated, setGenerated] =
    useState<TeachingMaterial | null>(null);
  const [loadingUnits, setLoadingUnits] =
    useState(false);
  const [analyzing, setAnalyzing] =
    useState(false);
  const [generating, setGenerating] =
    useState(false);
  const [error, setError] = useState("");

  const curriculumIsPdf = isPdf(
    course.curriculum_url,
  );

  const selectedUnit = learningUnits.find(
    (unit) =>
      unit.id ===
      Number(form.course_learning_unit_id),
  );

  const indicativeContents =
    selectedUnit?.indicative_contents ?? [];

  useEffect(() => {
    if (standalone) {
      void loadLearningUnits();
    }
  }, [standalone, course.id]);

  useEffect(() => {
    if (
      open &&
      classes.length === 1 &&
      !form.school_class_id
    ) {
      setForm((current) => ({
        ...current,
        school_class_id: String(classes[0].id),
      }));
    }
  }, [open, classes, form.school_class_id]);

  async function request(
    endpoint: string,
    options?: RequestInit,
  ) {
    const token = getToken();

    if (!token) {
      throw new Error(
        "Authentication token was not found.",
      );
    }

    const response = await fetch(
      `${apiUrl}${endpoint}`,
      {
        ...options,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(options?.headers ?? {}),
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          result,
          "The request could not be completed.",
        ),
      );
    }

    return result;
  }

  async function loadLearningUnits() {
    setLoadingUnits(true);
    setError("");

    try {
      const result = await request(
        `/courses/${course.id}/learning-units`,
      );

      setLearningUnits(
        extractLearningUnits(result),
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

  async function openGenerator() {
    setOpen(true);
    setGenerated(null);
    setError("");
    setForm({
      school_class_id:
        classes.length === 1
          ? String(classes[0].id)
          : "",
      course_learning_unit_id: "",
      course_indicative_content_id: "",
      lesson_date: currentDate(),
      duration_minutes: "80",
    });

    await loadLearningUnits();
  }

  function closeGenerator() {
    if (analyzing || generating) return;

    if (standalone) {
      router.push("/dashboard/teaching-materials");
      return;
    }

    setOpen(false);
    setGenerated(null);
    setError("");
  }

  async function analyzeSyllabus() {
    if (!curriculumIsPdf) {
      setError(
        "Upload the course syllabus as a PDF before analyzing it.",
      );
      return;
    }

    setAnalyzing(true);
    setError("");
    setGenerated(null);

    try {
      const result = await request(
        `/courses/${course.id}/analyze-syllabus`,
        {
          method: "POST",
        },
      );

      const units = extractLearningUnits(result);

      setLearningUnits(units);
      setForm((current) => ({
        ...current,
        course_learning_unit_id: "",
        course_indicative_content_id: "",
      }));

      if (units.length === 0) {
        setError(
          "No learning units were found in the syllabus.",
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The syllabus could not be analyzed.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function selectLearningUnit(value: string) {
    setForm((current) => ({
      ...current,
      course_learning_unit_id: value,
      course_indicative_content_id: "",
    }));
  }

  async function generateTeachingMaterial(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.school_class_id) {
      setError("Select the class.");
      return;
    }

    if (!form.course_learning_unit_id) {
      setError("Select the learning unit.");
      return;
    }

    if (!form.course_indicative_content_id) {
      setError("Select the indicative content.");
      return;
    }

    setGenerating(true);
    setError("");
    setGenerated(null);

    try {
      const result = await request(
        `/courses/${course.id}/generate-teaching-material`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
            lesson_date: form.lesson_date,
            duration_minutes: Number(
              form.duration_minutes,
            ),
          }),
        },
      );

      const material =
        extractTeachingMaterial(result);

      if (!material) {
        throw new Error(
          "The server returned invalid teaching material.",
        );
      }

      setGenerated(material);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Teaching material could not be generated.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      {!standalone && (
        <button
        type="button"
        onClick={() => void openGenerator()}
        className="flex w-full items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-100"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <BookOpenCheck size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            Generate teaching material
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            Select syllabus content and prepare today&apos;s lesson.
          </p>
        </div>
      </button>
      )}

      {open && (
        <div
          className={
            standalone
              ? "w-full"
              : "fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          }
          onMouseDown={(event) => {
            if (
              !standalone &&
              event.target === event.currentTarget &&
              !analyzing &&
              !generating
            ) {
              closeGenerator();
            }
          }}
        >
          <div
            className={
              standalone
                ? "flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                : "flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            }
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  AI Teaching Assistant
                </p>

                <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                  Generate Teaching Material
                </h2>

                <p className="truncate text-xs text-slate-500">
                  {course.name} · {course.code}
                </p>
              </div>

              <button
                type="button"
                onClick={closeGenerator}
                disabled={analyzing || generating}
                aria-label="Close teaching-material generator"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </header>

            <div className="overflow-y-auto">
              {generated ? (
                <div>
                  <div className="flex justify-end border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
                    <button
                      type="button"
                      onClick={() =>
                        void downloadTeachingMaterialPdf(
                          course,
                          generated,
                        )
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 text-sm font-semibold text-white transition hover:bg-slate-900"
                    >
                      <Download size={17} />
                      Download PDF
                    </button>
                  </div>

                  <TeachingMaterialPreview
                    material={generated}
                    onClose={closeGenerator}
                    onGenerateAnother={() => {
                      setGenerated(null);
                      setError("");
                    }}
                  />
                </div>
              ) : (
                <form
                  onSubmit={generateTeachingMaterial}
                  className="space-y-5 p-4 sm:p-6"
                >
                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <span>{error}</span>
                    </div>
                  )}

                  <SyllabusStatus
                    curriculumIsPdf={curriculumIsPdf}
                    loading={loadingUnits}
                    analyzing={analyzing}
                    unitCount={learningUnits.length}
                    onAnalyze={() =>
                      void analyzeSyllabus()
                    }
                  />

                  {loadingUnits ? (
                    <div className="flex min-h-40 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />
                      Loading syllabus content...
                    </div>
                  ) : learningUnits.length > 0 ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <SelectField
                          label="Assigned class"
                          value={form.school_class_id}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              school_class_id: value,
                            }))
                          }
                        >
                          <option value="">
                            Select class
                          </option>

                          {classes.map((schoolClass) => (
                            <option
                              key={schoolClass.id}
                              value={schoolClass.id}
                            >
                              {schoolClass.name}
                              {schoolClass.code
                                ? ` (${schoolClass.code})`
                                : ""}
                            </option>
                          ))}
                        </SelectField>

                        <SelectField
                          label="Learning unit"
                          value={
                            form.course_learning_unit_id
                          }
                          onChange={selectLearningUnit}
                        >
                          <option value="">
                            Select learning unit
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
                        </SelectField>

                        <SelectField
                          label="Indicative content"
                          value={
                            form.course_indicative_content_id
                          }
                          disabled={!selectedUnit}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              course_indicative_content_id:
                                value,
                            }))
                          }
                        >
                          <option value="">
                            {selectedUnit
                              ? "Select indicative content"
                              : "Select learning unit first"}
                          </option>

                          {indicativeContents.map(
                            (content) => (
                              <option
                                key={content.id}
                                value={content.id}
                              >
                                {content.title}
                              </option>
                            ),
                          )}
                        </SelectField>

                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-slate-700">
                            Lesson date
                          </span>

                          <input
                            required
                            type="date"
                            value={form.lesson_date}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                lesson_date:
                                  event.target.value,
                              }))
                            }
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-slate-700">
                            Lesson duration
                          </span>

                          <div className="relative">
                            <input
                              required
                              type="number"
                              min="10"
                              max="480"
                              value={
                                form.duration_minutes
                              }
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  duration_minutes:
                                    event.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-lg border border-slate-300 px-3 pr-20 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                              minutes
                            </span>
                          </div>
                        </label>
                      </div>

                      {selectedUnit && (
                        <SelectedSyllabusContent
                          unit={selectedUnit}
                          content={indicativeContents.find(
                            (item) =>
                              item.id ===
                              Number(
                                form.course_indicative_content_id,
                              ),
                          )}
                        />
                      )}

                      {classes.length === 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          You do not have an assigned class for this course.
                        </div>
                      )}

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
                        The system will only organize information found in the uploaded syllabus and course notes. It will not introduce external academic content.
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                      <FileSearch
                        size={34}
                        className="mx-auto text-slate-400"
                      />

                      <h3 className="mt-3 font-semibold text-slate-900">
                        Syllabus not analyzed
                      </h3>

                      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                        Analyze the uploaded syllabus to extract its existing learning units and indicative contents.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeGenerator}
                      disabled={analyzing || generating}
                      className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        generating ||
                        analyzing ||
                        classes.length === 0 ||
                        !form.school_class_id ||
                        !form.course_learning_unit_id ||
                        !form.course_indicative_content_id
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {generating ? (
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <Sparkles size={17} />
                      )}

                      {generating
                        ? "Preparing material..."
                        : "Generate Teaching Material"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SyllabusStatus({
  curriculumIsPdf,
  loading,
  analyzing,
  unitCount,
  onAnalyze,
}: {
  curriculumIsPdf: boolean;
  loading: boolean;
  analyzing: boolean;
  unitCount: number;
  onAnalyze: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            unitCount > 0
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {unitCount > 0 ? (
            <CheckCircle2 size={20} />
          ) : (
            <FileSearch size={20} />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">
            Syllabus content
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            {!curriculumIsPdf
              ? "Upload the syllabus as PDF first."
              : unitCount > 0
                ? `${unitCount} learning ${
                    unitCount === 1
                      ? "unit"
                      : "units"
                  } extracted.`
                : "Extract learning units and indicative contents."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onAnalyze}
        disabled={
          !curriculumIsPdf ||
          loading ||
          analyzing
        }
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {analyzing ? (
          <LoaderCircle
            size={15}
            className="animate-spin"
          />
        ) : (
          <RefreshCw size={15} />
        )}

        {analyzing
          ? "Analyzing..."
          : unitCount > 0
            ? "Analyze Again"
            : "Analyze Syllabus"}
      </button>
    </div>
  );
}

function SelectField({
  label,
  value,
  disabled = false,
  onChange,
  children,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <div className="relative">
        <select
          required
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          {children}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </label>
  );
}

function SelectedSyllabusContent({
  unit,
  content,
}: {
  unit: LearningUnit;
  content?: IndicativeContent;
}) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        Selected syllabus content
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900">
        {unit.code ? `${unit.code} — ` : ""}
        {unit.title}
      </p>

      {content && (
        <>
          <p className="mt-2 text-sm text-slate-700">
            {content.title}
          </p>

          {content.details && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {content.details}
            </p>
          )}

          {content.source_page && (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              Source: {content.source_page}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function TeachingMaterialPreview({
  material,
  onClose,
  onGenerateAnother,
}: {
  material: TeachingMaterial;
  onClose: () => void;
  onGenerateAnother: () => void;
}) {
  const content = material.generated_content;
  const insufficient =
    material.status === "insufficient_material" ||
    content.status === "insufficient_material";

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 ${
          insufficient
            ? "border-amber-200 bg-amber-50"
            : "border-emerald-200 bg-emerald-50"
        }`}
      >
        {insufficient ? (
          <AlertCircle
            size={21}
            className="mt-0.5 shrink-0 text-amber-600"
          />
        ) : (
          <CheckCircle2
            size={21}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
        )}

        <div>
          <p
            className={`font-semibold ${
              insufficient
                ? "text-amber-800"
                : "text-emerald-800"
            }`}
          >
            {insufficient
              ? "Insufficient course material"
              : "Teaching material generated"}
          </p>

          <p
            className={`mt-1 text-sm ${
              insufficient
                ? "text-amber-700"
                : "text-emerald-700"
            }`}
          >
            {content.message}
          </p>
        </div>
      </div>

      {!insufficient && (
        <>
          <section className="rounded-xl border border-slate-200 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Draft Teaching Material
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {content.title || material.title}
            </h3>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-md bg-slate-100 px-2.5 py-1">
                {new Date(
                  material.lesson_date,
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>

              <span className="rounded-md bg-slate-100 px-2.5 py-1">
                {material.duration_minutes} minutes
              </span>

              <span className="rounded-md bg-amber-50 px-2.5 py-1 font-semibold capitalize text-amber-700">
                {material.status}
              </span>
            </div>

            {content.lesson_summary && (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {content.lesson_summary}
              </p>
            )}
          </section>

          <section className="space-y-4">
            {content.lesson_sections.map(
              (section, index) => (
                <article
                  key={`${section.heading}-${index}`}
                  className="rounded-xl border border-slate-200 p-4 sm:p-5"
                >
                  <h4 className="font-bold text-slate-900">
                    {index + 1}. {section.heading}
                  </h4>

                  {section.introduction && (
                    <p className="mt-3 text-sm font-medium leading-7 text-slate-700">
                      {section.introduction}
                    </p>
                  )}

                  {section.content && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                      {section.content}
                    </p>
                  )}

                  {section.paragraphs?.map(
                    (paragraph, paragraphIndex) => (
                      <p
                        key={paragraphIndex}
                        className="mt-3 text-sm leading-7 text-slate-700"
                      >
                        {paragraph}
                      </p>
                    ),
                  )}

                  {section.key_points?.length > 0 && (
                    <div className="mt-5">
                      <h5 className="text-sm font-bold text-slate-900">
                        Key points
                      </h5>

                      <ol className="mt-3 space-y-3">
                        {section.key_points.map(
                          (point, pointIndex) => (
                            <li
                              key={pointIndex}
                              className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                {pointIndex + 1}
                              </span>

                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900">
                                  {point.title}
                                </p>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                  {point.explanation}
                                </p>
                              </div>
                            </li>
                          ),
                        )}
                      </ol>
                    </div>
                  )}

                  {section.examples?.length > 0 && (
                    <div className="mt-5">
                      <h5 className="text-sm font-bold text-slate-900">
                        Examples
                      </h5>

                      <div className="mt-3 space-y-3">
                        {section.examples.map(
                          (example, exampleIndex) => (
                            <div
                              key={exampleIndex}
                              className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3"
                            >
                              <p className="text-sm font-bold text-amber-900">
                                {example.title}
                              </p>

                              <p className="mt-1 text-sm leading-6 text-amber-800">
                                {example.explanation}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {section.highlights?.length > 0 && (
                    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                        Important points to emphasize
                      </p>

                      <ul className="mt-3 space-y-2">
                        {section.highlights.map(
                          (highlight, highlightIndex) => (
                            <li
                              key={highlightIndex}
                              className="flex items-start gap-2 text-sm leading-6 text-blue-900"
                            >
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                              <span>{highlight}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                  {section.source_references?.length >
                    0 && (
                    <details className="mt-5 border-t border-slate-100 pt-4">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
                        View source references
                      </summary>

                      <div className="mt-3 space-y-2">
                        {section.source_references.map(
                          (
                            reference,
                            referenceIndex,
                          ) => (
                            <div
                              key={referenceIndex}
                              className="rounded-lg bg-slate-50 px-3 py-2"
                            >
                              <p className="text-xs font-semibold text-slate-700">
                                {reference.document}
                                {reference.page_reference
                                  ? ` · Page ${reference.page_reference}`
                                  : ""}
                              </p>

                              <p className="mt-1 text-xs italic leading-5 text-slate-500">
                                “{reference.excerpt}”
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </details>
                  )}
                </article>
              ),
            )}
          </section>
        </>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
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
          className="h-10 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Finish
        </button>
      </div>
    </div>
  );
}
