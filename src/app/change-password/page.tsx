"use client";

import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type PasswordResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuthentication, setCheckingAuthentication] = useState(true);

  useEffect(() => {
    const token =
      localStorage.getItem("cgfk_auth_token") ||
      sessionStorage.getItem("cgfk_auth_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    window.setTimeout(() => setCheckingAuthentication(false), 0);
  }, [router]);

  const requirements = useMemo(
    () => [
      {
        label: "At least 8 characters",
        passed: password.length >= 8,
      },
      {
        label: "One uppercase letter",
        passed: /[A-Z]/.test(password),
      },
      {
        label: "One lowercase letter",
        passed: /[a-z]/.test(password),
      },
      {
        label: "One number",
        passed: /[0-9]/.test(password),
      },
    ],
    [password]
  );

  const passwordIsStrong = requirements.every(
    (requirement) => requirement.passed
  );

  function getToken() {
    return (
      localStorage.getItem("cgfk_auth_token") ||
      sessionStorage.getItem("cgfk_auth_token")
    );
  }

  function updateStoredUser() {
    const storage = localStorage.getItem("cgfk_auth_token")
      ? localStorage
      : sessionStorage;

    const storedUser = storage.getItem("cgfk_user");

    if (!storedUser) {
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      storage.setItem(
        "cgfk_user",
        JSON.stringify({
          ...user,
          must_change_password: false,
        })
      );
    } catch {
      storage.removeItem("cgfk_user");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!passwordIsStrong) {
      setError("Your new password does not meet all requirements.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("The new password and confirmation do not match.");
      return;
    }

    if (currentPassword === password) {
      setError("Your new password must be different from your current password.");
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/change-password`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const result: PasswordResponse = await response.json();

      if (!response.ok || !result.success) {
        const validationMessage = result.errors
          ? Object.values(result.errors).flat()[0]
          : null;

        throw new Error(
          validationMessage ||
            result.message ||
            "Unable to change your password."
        );
      }

      updateStoredUser();
      router.replace("/dashboard");
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof TypeError) {
        setError(
          "Unable to connect to the server. Make sure Laravel is running."
        );
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to change your password."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuthentication) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef3fb]">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef3fb] px-4 py-10">
      <div className="absolute left-[8%] top-[10%] h-3 w-3 rounded-full bg-orange-400" />
      <div className="absolute right-[10%] top-[8%] h-5 w-9 -rotate-45 rounded-full bg-pink-500" />
      <div className="absolute bottom-[8%] right-[8%] h-8 w-4 -rotate-12 rounded-full bg-emerald-400" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_25px_80px_rgba(30,64,175,0.14)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#2454c6] via-[#245bd4] to-[#173fa6] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-lg">
              <Image
                src="/lo.png"
                alt="CGFK School logo"
                width={56}
                height={56}
                priority
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="font-bold">CGFK School</p>
              <p className="text-xs text-blue-100">
                School Management System
              </p>
            </div>
          </div>

          <div className="relative mx-auto py-14 text-center">
            <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-white/10">
              <div className="absolute inset-4 rounded-full border border-white/20" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-blue-700 shadow-2xl">
                <ShieldCheck size={50} strokeWidth={1.8} />
              </div>

              <div className="absolute -right-2 top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-emerald-950 shadow-lg">
                <KeyRound size={24} />
              </div>
            </div>

            <h2 className="mt-9 text-3xl font-bold">
              Protect your account
            </h2>

            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-blue-100">
              Create a strong password to keep student records, reports and
              school information secure.
            </p>
          </div>

          <p className="relative text-center text-xs text-blue-200">
            Secure access for authorized school staff
          </p>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100 lg:hidden">
                <Image
                  src="/lo.png"
                  alt="CGFK School logo"
                  width={80}
                  height={80}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                Account security
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Change Password
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Before continuing to the dashboard, create a secure password
                for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              <PasswordInput
                id="current-password"
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                visible={showCurrentPassword}
                onToggle={() =>
                  setShowCurrentPassword((current) => !current)
                }
                autoComplete="current-password"
                disabled={loading}
              />

              <PasswordInput
                id="new-password"
                label="New password"
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                autoComplete="new-password"
                disabled={loading}
              />

              <PasswordInput
                id="password-confirmation"
                label="Confirm new password"
                value={passwordConfirmation}
                onChange={setPasswordConfirmation}
                visible={showConfirmation}
                onToggle={() =>
                  setShowConfirmation((current) => !current)
                }
                autoComplete="new-password"
                disabled={loading}
              />

              <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                {requirements.map((requirement) => (
                  <div
                    key={requirement.label}
                    className={`flex items-center gap-2 text-xs ${
                      requirement.passed
                        ? "text-emerald-700"
                        : "text-slate-500"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        requirement.passed
                          ? "bg-emerald-100"
                          : "bg-slate-200"
                      }`}
                    >
                      <Check size={12} />
                    </span>

                    {requirement.label}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Updating password...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Change Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
  disabled: boolean;
};

function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  disabled,
}: PasswordInputProps) {
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
          placeholder={label}
          autoComplete={autoComplete}
          disabled={disabled}
          required
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-700"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
