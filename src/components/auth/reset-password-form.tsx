"use client";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

type Props = {
  token: string;
  email: string;
};

type ResetResponse = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

export default function ResetPasswordForm({
  token,
  email,
}: Props) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const linkIsValid = Boolean(token && email);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("The password confirmation does not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/reset-password`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const result: ResetResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || result.success === false) {
        const validationMessage = result.errors
          ? Object.values(result.errors).flat()[0]
          : null;

        throw new Error(
          validationMessage ??
            result.message ??
            "Unable to reset your password.",
        );
      }

      localStorage.removeItem("cgfk_auth_token");
      localStorage.removeItem("cgfk_user");
      sessionStorage.removeItem("cgfk_auth_token");
      sessionStorage.removeItem("cgfk_user");

      setCompleted(true);
    } catch (exception) {
      if (exception instanceof TypeError) {
        setError(
          "Failed to connect to the backend. Confirm that Laravel is running.",
        );
      } else {
        setError(
          exception instanceof Error
            ? exception.message
            : "Unable to reset your password.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Password changed
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your password was reset successfully. You can now
            log in using your new password.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Continue to login
            <ArrowRight size={17} />
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (!linkIsValid) {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <KeyRound size={27} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Invalid reset link
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            This link does not contain the required email and
            reset token. Request a new password reset link.
          </p>

          <Link
            href="/forgot-password"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Request new link
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <KeyRound size={26} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Create new password
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Set a secure password for
          <span className="ml-1 font-semibold text-slate-700">
            {email}
          </span>
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <PasswordField
          id="password"
          label="New password"
          value={password}
          visible={showPassword}
          disabled={submitting}
          placeholder="Enter your new password"
          onChange={setPassword}
          onToggle={() => setShowPassword((current) => !current)}
        />

        <PasswordField
          id="password_confirmation"
          label="Confirm password"
          value={passwordConfirmation}
          visible={showConfirmation}
          disabled={submitting}
          placeholder="Repeat your new password"
          onChange={setPasswordConfirmation}
          onToggle={() =>
            setShowConfirmation((current) => !current)
          }
        />

        <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
          Password must contain at least 8 characters, an
          uppercase letter, a lowercase letter and a number.
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Resetting password...
            </>
          ) : (
            <>
              Reset password
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-700 hover:text-blue-900"
        >
          Login
        </Link>
      </p>
    </AuthCard>
  );
}

function AuthCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef3fb] px-4 py-8">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_25px_80px_rgba(30,64,175,0.14)] sm:p-8">
        <div className="mb-6 flex justify-center">
          <Image
            src="/lo.png"
            alt="CGFK School logo"
            width={72}
            height={72}
            priority
            className="h-16 w-16 object-contain"
          />
        </div>

        {children}
      </section>
    </main>
  );
}

function PasswordField({
  id,
  label,
  value,
  placeholder,
  visible,
  disabled,
  onChange,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  visible: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <LockKeyhole
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          minLength={8}
          required
          disabled={disabled}
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
