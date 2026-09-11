"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  must_change_password: boolean;
};

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    token: string;
    token_type: string;
    user: User;
  };
  errors?: Record<string, string[]>;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

const ROLE_HOME_PAGES: Record<string, string> = {
  headmaster: "/dashboard",
  director_of_studies: "/dashboard/director_of_studies",
  discipline_master: "/dashboard/discipline_master",
  accountant: "/dashboard/accountant",
  teacher: "/dashboard/teacher",
  matron: "/dashboard/matron",
  patron: "/dashboard/patron",
};

function getRoleHomePage(role: string) {
  return ROLE_HOME_PAGES[role] ?? "/dashboard";
}

export default function LoginScreen() {
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login,
          password,
          device_name: "cgfk-web",
        }),
      });

      const result: LoginResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        const validationMessage = result.errors
          ? Object.values(result.errors).flat()[0]
          : null;

        throw new Error(
          validationMessage ||
            result.message ||
            "Unable to login. Please try again."
        );
      }

      const storage = rememberMe ? localStorage : sessionStorage;

      localStorage.removeItem("cgfk_auth_token");
      sessionStorage.removeItem("cgfk_auth_token");

      storage.setItem("cgfk_auth_token", result.data.token);
      storage.setItem("cgfk_user", JSON.stringify(result.data.user));

      if (result.data.user.must_change_password) {
        router.replace("/change-password");
        return;
      }

      const homePage = getRoleHomePage(
        result.data.user.role
      );

      router.replace(homePage);
    } catch (caughtError) {
      if (caughtError instanceof TypeError) {
        setError(
          "Unable to connect to the server. Make sure the Laravel API is running."
        );
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef3fb] px-4 py-8 sm:px-6">
      <BackgroundDecorations />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_25px_80px_rgba(30,64,175,0.14)] lg:min-h-[650px] lg:grid-cols-[1.04fr_1fr]">
        <IllustrationPanel />

        <div className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
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
                CGFK School
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Hello Again!
              </h1>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">
                Welcome back. Enter your school account details to continue.
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

              <div>
                <label
                  htmlFor="login"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email or phone number
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="login"
                    name="login"
                    type="text"
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                    placeholder="admin@cgfk.com"
                    autoComplete="username"
                    required
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-700"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 accent-blue-700"
                  />
                  Remember me
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} />
              <span>Secure access for authorized school staff</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function IllustrationPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#2454c6] via-[#245bd4] to-[#173fa6] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
      <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-blue-400/20 blur-2xl" />

      <div className="relative z-10 flex items-center gap-3">
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
          <p className="font-bold">CGFK</p>
          <p className="text-xs text-blue-100">School Management System</p>
        </div>
      </div>

      <div className="relative mx-auto h-[310px] w-full max-w-sm">
        <div className="absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 -rotate-3 rounded-2xl bg-white p-5 text-slate-800 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Today&apos;s attendance</p>
              <p className="mt-1 text-lg font-bold">Class Overview</p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <CalendarDays size={22} />
            </div>
          </div>

          <div className="space-y-3">
            <MiniRow
              icon={<Users size={16} />}
              title="Present students"
              value="94%"
              color="bg-emerald-100 text-emerald-700"
            />

            <MiniRow
              icon={<BookOpen size={16} />}
              title="Reports completed"
              value="86%"
              color="bg-violet-100 text-violet-700"
            />

            <MiniRow
              icon={<ShieldCheck size={16} />}
              title="Records verified"
              value="100%"
              color="bg-blue-100 text-blue-700"
            />
          </div>
        </div>

        <div className="absolute bottom-4 right-1 rotate-6 rounded-xl bg-white px-4 py-3 text-slate-800 shadow-xl">
          <p className="text-[10px] text-slate-400">Active students</p>
          <p className="text-xl font-bold text-blue-700">1,248</p>
        </div>

        <div className="absolute left-0 top-8 -rotate-6 rounded-xl bg-amber-300 px-4 py-3 text-slate-900 shadow-xl">
          <p className="text-[10px] font-medium">Academic year</p>
          <p className="text-sm font-bold">2026–2027</p>
        </div>
      </div>

      <div className="relative z-10 text-center">
        <h2 className="text-2xl font-bold">
          Registration, Reports
          <br />
          and Attendance
        </h2>

        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-blue-100">
          Manage important school activities from one reliable platform.
        </p>
      </div>
    </div>
  );
}

function MiniRow({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}
        >
          {icon}
        </span>

        <span className="text-xs font-medium text-slate-600">{title}</span>
      </div>

      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}

function BackgroundDecorations() {
  return (
    <>
      <div className="absolute left-[8%] top-[9%] h-3 w-3 rounded-full bg-orange-400" />
      <div className="absolute right-[12%] top-[8%] h-4 w-8 rotate-[-35deg] rounded-full bg-pink-500" />
      <div className="absolute bottom-[8%] right-[9%] h-8 w-4 rotate-[-25deg] rounded-full bg-emerald-400" />
      <div className="absolute bottom-[13%] left-[7%] h-2 w-2 rounded-full bg-blue-500" />
      <div className="absolute right-[5%] top-[22%] h-2 w-2 rounded-full bg-blue-600" />
      <div className="absolute left-[23%] top-[5%] h-2 w-2 rounded-full bg-amber-400" />
    </>
  );
}
