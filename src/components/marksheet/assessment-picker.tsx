"use client";

import {
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  FileQuestion,
} from "lucide-react";

export type MarksheetAssessment = {
  id: number;
  course_id: number;
  school_class_id: number;
  title: string;
  type: "quiz" | "exam" | "assignment";
  total_marks: number;
  question_count: number;
  created_at: string;
  course: {
    id: number;
    name: string;
    code: string;
  };
  school_class?: {
    id: number;
    name: string;
    code: string;
    level?: string | null;
  } | null;
};

function assessmentIcon(
  type: MarksheetAssessment["type"],
) {
  if (type === "quiz") {
    return FileQuestion;
  }

  if (type === "exam") {
    return FileCheck2;
  }

  return ClipboardCheck;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-RW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function AssessmentPicker({
  assessments,
  selectedId,
  type,
  onSelect,
}: {
  assessments: MarksheetAssessment[];
  selectedId: string;
  type: string;
  onSelect: (assessmentId: string) => void;
}) {
  if (!type) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
        <FileQuestion
          size={32}
          className="mx-auto text-slate-400"
        />

        <h2 className="mt-3 font-semibold text-slate-900">
          Select assessment type
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select Quiz, Exam or Assignment to view the assessments
          created by the teacher.
        </p>
      </section>
    );
  }

  if (assessments.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
        <FileQuestion
          size={32}
          className="mx-auto text-slate-400"
        />

        <h2 className="mt-3 font-semibold text-slate-900">
          No {type}s created
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          There are no published {type}s for the selected class
          and course.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold capitalize text-slate-900">
          Available {type}s
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select one to open its Marksheet.
        </p>
      </div>

      <div className="divide-y divide-slate-200">
        {assessments.map((assessment) => {
          const Icon = assessmentIcon(
            assessment.type,
          );

          const selected =
            selectedId === String(assessment.id);

          return (
            <button
              key={assessment.id}
              type="button"
              onClick={() =>
                onSelect(String(assessment.id))
              }
              className={`flex w-full items-center gap-4 px-5 py-4 text-left transition ${
                selected
                  ? "bg-blue-50"
                  : "hover:bg-slate-50"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  selected
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-900">
                  {assessment.title}
                </h3>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    {assessment.question_count} questions
                  </span>

                  <span>
                    {assessment.total_marks} marks
                  </span>

                  <span>
                    {formatDate(assessment.created_at)}
                  </span>
                </div>
              </div>

              <ArrowRight
                size={18}
                className={
                  selected
                    ? "text-blue-600"
                    : "text-slate-400"
                }
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
