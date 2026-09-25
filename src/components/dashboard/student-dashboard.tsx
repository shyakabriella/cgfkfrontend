"use client";

import { useEffect, useState } from "react";

type StudentInformation = {
  student_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  gender?: string | null;
  status: string;
  school_class?: {
    id: number;
    name: string;
    code: string;
    level?: string | null;
  } | null;
};

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  student?: StudentInformation | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function getStoredUser(): CurrentUser | null {
  const stored =
    localStorage.getItem("cgfk_user") ??
    sessionStorage.getItem("cgfk_user");

  if (!stored) return null;

  try {
    return JSON.parse(stored) as CurrentUser;
  } catch {
    return null;
  }
}

export default function StudentDashboard() {
  const [user, setUser] = useState<CurrentUser | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudent() {
      const storedUser = getStoredUser();

      if (storedUser) {
        setUser(storedUser);
      }

      const token = getToken();

      if (!token) {
        setError("Your login session was not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/me`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ??
              "Your information could not be loaded.",
          );
        }

        const currentUser = result.data?.user;

        if (currentUser) {
          setUser(currentUser);

          const storage =
            localStorage.getItem("cgfk_auth_token")
              ? localStorage
              : sessionStorage;

          storage.setItem(
            "cgfk_user",
            JSON.stringify(currentUser),
          );
        }
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Your information could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStudent();
  }, []);

  const date = new Intl.DateTimeFormat("en-RW", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  if (loading && !user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500">
        Loading your dashboard...
      </div>
    );
  }

  const student = user?.student;

  const studentName =
    student?.first_name && student?.last_name
      ? `${student.first_name} ${student.last_name}`
      : user?.name ?? "Student";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-slate-500">
            Student Portal
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Welcome, {studentName}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your personal and academic information.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          {date}
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Student Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your registration information at CGFK School.
          </p>
        </div>

        <dl className="grid sm:grid-cols-2">
          <InformationItem
            label="Full name"
            value={studentName}
          />

          <InformationItem
            label="Student ID"
            value={
              student?.student_id ?? "Not available"
            }
          />

          <InformationItem
            label="Class"
            value={
              student?.school_class?.name ??
              "Not assigned"
            }
          />

          <InformationItem
            label="Class code"
            value={
              student?.school_class?.code ??
              "Not available"
            }
          />

          <InformationItem
            label="Email"
            value={
              student?.email ??
              user?.email ??
              "Not available"
            }
          />

          <InformationItem
            label="Gender"
            value={
              student?.gender
                ? capitalize(student.gender)
                : "Not provided"
            }
          />

          <InformationItem
            label="Student status"
            value={capitalize(
              student?.status ?? "inactive",
            )}
          />

          <InformationItem
            label="Account status"
            value={capitalize(
              user?.status ?? "inactive",
            )}
          />
        </dl>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Academic Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your school activities and academic records.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          <AcademicRow
            title="Courses"
            description="Courses assigned to your class."
          />

          <AcademicRow
            title="Attendance"
            description="Your daily attendance records."
          />

          <AcademicRow
            title="Assessments"
            description="Assignments, quizzes and examinations published for your class."
          />

          <AcademicRow
            title="Results"
            description="Your marks and academic reports."
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">
          Need help?
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Contact the school administration if your name,
          student ID, class or other information is incorrect.
        </p>
      </section>
    </div>
  );
}

function InformationItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-slate-200 px-5 py-4 last:border-b-0 sm:border-r sm:last:border-r-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>

      <dd className="mt-1.5 break-words text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function AcademicRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <span className="self-start rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 sm:self-center">
        Coming soon
      </span>
    </div>
  );
}

function capitalize(value: string) {
  if (!value) return "";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1).replaceAll("_", " ")
  );
}
