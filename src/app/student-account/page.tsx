"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type VerifiedStudent = {
  student_id: string;
  name: string;
  class?: {
    id: number;
    name: string;
    code: string;
    level?: string | null;
  } | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

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

  return response.message ?? fallback;
}

export default function StudentAccountPage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState("");
  const [student, setStudent] =
    useState<VerifiedStudent | null>(null);
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");

  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] =
    useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function verifyStudentId(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setChecking(true);
    setError("");
    setSuccess("");
    setStudent(null);

    try {
      const response = await fetch(
        `${API_URL}/student-account/check`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: studentId.trim().toUpperCase(),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            "The student ID could not be verified.",
          ),
        );
      }

      setStudent(result.data.student);
      setStudentId(result.data.student.student_id);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "The student ID could not be verified.",
      );
    } finally {
      setChecking(false);
    }
  }

  async function createAccount(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!student) return;

    if (password !== passwordConfirmation) {
      setError(
        "Password and password confirmation do not match.",
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/student-account/register`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: student.student_id,
            email: email.trim().toLowerCase(),
            gender,
            password,
            password_confirmation: passwordConfirmation,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            "The account could not be created.",
          ),
        );
      }

      setSuccess(
        "Account created successfully. Redirecting to login...",
      );

      window.setTimeout(() => {
        router.push("/login?student_account=created");
      }, 1500);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "The account could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function changeStudent() {
    setStudent(null);
    setEmail("");
    setGender("");
    setPassword("");
    setPasswordConfirmation("");
    setError("");
    setSuccess("");
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[36%_64%]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#102a43] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full border-[45px] border-emerald-500/20" />
        <div className="absolute -right-24 top-32 h-72 w-72 rounded-full border-[38px] border-yellow-400/20" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full border-[55px] border-emerald-500/20" />

        <div className="absolute left-0 top-1/4 h-2 w-52 -rotate-[28deg] bg-yellow-400" />
        <div className="absolute bottom-24 right-0 h-2 w-64 rotate-[28deg] bg-emerald-500" />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
              <Image
                src="/lo.png"
                alt="CGFK School logo"
                width={58}
                height={58}
                priority
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                CGFK School
              </h2>

              <p className="text-sm text-slate-300">
                Management System
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-sm px-8">
          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-sm">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-950/30">
              <GraduationCap size={58} />
            </div>

            <h2 className="mt-7 text-3xl font-bold text-white">
              Student Portal
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Create your account to access your classes,
              assessments, academic results and school reports.
            </p>

            <div className="mt-7 grid grid-cols-3 gap-2">
              <div className="h-2 rounded-full bg-emerald-500" />
              <div className="h-2 rounded-full bg-yellow-400" />
              <div className="h-2 rounded-full bg-white/40" />
            </div>
          </div>
        </div>

        <div className="relative z-10 p-10 text-sm text-slate-400">
          © 2026 CGFK School. All rights reserved.
        </div>
      </section>

      <section className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-10 lg:px-14 lg:py-10">
          <div>
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#102a43] px-5 text-sm font-semibold text-white transition hover:bg-[#193c5b]"
            >
              <ArrowLeft size={17} />
              Back
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-3xl">
              <header className="mb-8 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  <Image
                    src="/lo.png"
                    alt="CGFK School logo"
                    width={88}
                    height={88}
                    priority
                    className="h-full w-full object-contain"
                  />
                </div>

                <h1 className="mt-4 text-2xl font-black uppercase tracking-wide text-[#102a43] sm:text-3xl">
                  CGFK School
                </h1>

                <p className="mt-1 font-bold uppercase tracking-[0.18em] text-emerald-600">
                  Student Account Registration
                </p>

                <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-yellow-400" />
              </header>

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 size={20} />
                  {success}
                </div>
              )}

              {!student ? (
                <form
                  onSubmit={verifyStudentId}
                  className="mx-auto max-w-xl"
                >
                  <div className="mb-6 text-center">
                    <h2 className="text-xl font-bold text-slate-900">
                      Verify your student identity
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Enter the student ID given to you when you
                      registered at CGFK School.
                    </p>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Student ID
                    </span>

                    <input
                      required
                      value={studentId}
                      onChange={(event) =>
                        setStudentId(
                          event.target.value.toUpperCase(),
                        )
                      }
                      placeholder="Example: CGFK-2026-000001"
                      className="h-14 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base font-semibold uppercase outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={
                      checking || studentId.trim() === ""
                    }
                    className="mt-5 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checking ? (
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <Search size={19} />
                    )}

                    {checking
                      ? "Checking Student ID..."
                      : "Continue"}
                  </button>

                  <p className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      Sign in
                    </Link>
                  </p>
                </form>
              ) : (
                <form
                  onSubmit={createAccount}
                  className="space-y-5"
                >
                  <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <ShieldCheck size={24} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Verified Student
                      </p>

                      <h2 className="mt-1 text-lg font-bold text-slate-900">
                        {student.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-600">
                        {student.student_id}
                        {" · "}
                        {student.class?.name ??
                          "Class not assigned"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={changeStudent}
                      disabled={submitting}
                      className="self-start text-sm font-bold text-emerald-700 hover:text-emerald-900 sm:self-center"
                    >
                      Change ID
                    </button>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Email address
                      </span>

                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        placeholder="student@example.com"
                        className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                      />
                    </label>

                    <fieldset className="sm:col-span-2">
                      <legend className="mb-2 text-sm font-semibold text-slate-700">
                        Gender
                      </legend>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            value: "male",
                            label: "Male",
                          },
                          {
                            value: "female",
                            label: "Female",
                          },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className={`flex h-11 cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm font-semibold transition ${
                              gender === option.value
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="gender"
                              required
                              value={option.value}
                              checked={
                                gender === option.value
                              }
                              onChange={(event) =>
                                setGender(
                                  event.target.value,
                                )
                              }
                              className="h-4 w-4 accent-emerald-600"
                            />

                            {option.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <PasswordInput
                      label="Password"
                      value={password}
                      visible={showPassword}
                      onChange={setPassword}
                      onToggle={() =>
                        setShowPassword(
                          (current) => !current,
                        )
                      }
                    />

                    <PasswordInput
                      label="Confirm password"
                      value={passwordConfirmation}
                      visible={showConfirmation}
                      onChange={setPasswordConfirmation}
                      onToggle={() =>
                        setShowConfirmation(
                          (current) => !current,
                        )
                      }
                    />
                  </div>

                  <p className="text-xs leading-5 text-slate-500">
                    Use at least 8 characters with uppercase,
                    lowercase and a number.
                  </p>

                  <button
                    type="submit"
                    disabled={submitting || success !== ""}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <GraduationCap size={19} />
                    )}

                    {submitting
                      ? "Creating Account..."
                      : "Create Student Account"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PasswordInput({
  label,
  value,
  visible,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          required
          minLength={8}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 pr-11 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-slate-700"
          aria-label={
            visible ? "Hide password" : "Show password"
          }
        >
          {visible ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </label>
  );
}
