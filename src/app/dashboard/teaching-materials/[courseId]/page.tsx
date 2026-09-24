"use client";

import CourseTeachingMaterialGenerator from "@/components/courses/course-teaching-material-generator";
import {
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type AssignedClass = {
  id: number;
  name: string;
  code: string;
  level?: string | null;
};

type Course = {
  id: number;
  name: string;
  code: string;
  curriculum_url?: string | null;
  notes_url?: string | null;
  teacher_assignments?: Array<{
    id: number;
    school_class_id: number;
    status: "active" | "inactive";
    school_class?: AssignedClass;
  }>;
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

export default function TeachingMaterialCoursePage() {
  const params = useParams<{
    courseId: string;
  }>();

  const [course, setCourse] =
    useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourse() {
      const token = getToken();

      if (!token) {
        setError("Authentication token was not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${apiUrl}/courses/${params.courseId}`,
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
            result.message ??
              "The course could not be loaded.",
          );
        }

        setCourse(result.data ?? result);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "The course could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCourse();
  }, [params.courseId]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
        <LoaderCircle size={20} className="animate-spin" />
        Loading course...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/teaching-materials"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={17} />
          Back to Teaching Materials
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "The course was not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/teaching-materials"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={17} />
        Back to Teaching Materials
      </Link>

      <CourseTeachingMaterialGenerator
        course={course}
        standalone
      />
    </div>
  );
}
