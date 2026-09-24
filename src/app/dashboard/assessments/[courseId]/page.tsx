"use client";

import CourseAssessmentGenerator, {
  AssessmentCourse,
} from "@/components/courses/course-assessment-generator";
import {
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

export default function CourseAssessmentPage() {
  const params = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<AssessmentCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, []);

  useEffect(() => {
    async function loadCourse() {
      const token = getToken();

      if (!token) {
        setError("Your login session was not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/courses/${params.courseId}`,
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
            result.message ?? "Course could not be loaded.",
          );
        }

        setCourse(result.data?.course ?? result.data);
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Course could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCourse();
  }, [params.courseId]);

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/assessments"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={17} />
        Back to Assessments
      </Link>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
          <LoaderCircle size={20} className="animate-spin" />
          Loading assessment generator...
        </div>
      )}

      {!loading && course && (
        <CourseAssessmentGenerator
          course={course}
          standalone
        />
      )}
    </div>
  );
}
