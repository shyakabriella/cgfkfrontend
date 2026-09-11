"use client";

import {
  LoaderCircle,
  UserRoundCheck,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  Course,
  createTeacherAssignment,
  SchoolClass,
  Teacher,
} from "@/services/teacher-assignment.service";

type Props = {
  open: boolean;
  teachers: Teacher[];
  classes: SchoolClass[];
  courses: Course[];
  onClose: () => void;
  onCreated: () => void;
};

export default function TeacherAssignmentModal({
  open,
  teachers,
  classes,
  courses,
  onClose,
  onCreated,
}: Props) {
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setTeacherId("");
      setClassId("");
      setCourseId("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createTeacherAssignment({
        teacher_id: Number(teacherId),
        school_class_id: Number(classId),
        course_id: Number(courseId),
      });

      onCreated();
      onClose();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to create the assignment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
              <UserRoundCheck size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Assign Teacher
              </h2>
              <p className="text-sm text-slate-500">
                Select a teacher, class and course.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <SelectField
            label="Teacher"
            value={teacherId}
            onChange={setTeacherId}
            options={teachers.map((teacher) => ({
              value: teacher.id,
              label: teacher.name,
            }))}
            placeholder="Select teacher"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Class"
              value={classId}
              onChange={setClassId}
              options={classes.map((schoolClass) => ({
                value: schoolClass.id,
                label: `${schoolClass.name} (${schoolClass.code})`,
              }))}
              placeholder="Select class"
            />

            <SelectField
              label="Course"
              value={courseId}
              onChange={setCourseId}
              options={courses.map((course) => ({
                value: course.id,
                label: `${course.name} (${course.code})`,
              }))}
              placeholder="Select course"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                !teacherId ||
                !classId ||
                !courseId
              }
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && (
                <LoaderCircle size={17} className="animate-spin" />
              )}

              {submitting ? "Assigning..." : "Assign Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{
    value: number;
    label: string;
  }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
