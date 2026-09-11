"use client";

import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarCheck,
  CircleCheckBig,
  Clock3,
  FileText,
  GraduationCap,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

const statistics = [
  {
    title: "Total Students",
    value: "0",
    description: "Registered students",
    icon: GraduationCap,
    iconColor: "text-blue-700",
    iconBackground: "bg-blue-100",
  },
  {
    title: "Staff Members",
    value: "1",
    description: "Active staff accounts",
    icon: Users,
    iconColor: "text-violet-700",
    iconBackground: "bg-violet-100",
  },
  {
    title: "Present Today",
    value: "0",
    description: "Attendance not recorded",
    icon: CalendarCheck,
    iconColor: "text-emerald-700",
    iconBackground: "bg-emerald-100",
  },
  {
    title: "Fees Collected",
    value: "0 RWF",
    description: "Current academic term",
    icon: WalletCards,
    iconColor: "text-amber-700",
    iconBackground: "bg-amber-100",
  },
];

const quickActions = [
  {
    name: "Register Student",
    description: "Add a new student and guardian information.",
    href: "/dashboard/students/create",
    icon: UserPlus,
    color: "bg-blue-600",
  },
  {
    name: "Record Attendance",
    description: "Record today's student attendance.",
    href: "/dashboard/attendance",
    icon: CalendarCheck,
    color: "bg-emerald-600",
  },
  {
    name: "Enter Marks",
    description: "Record marks for assigned subjects.",
    href: "/dashboard/marks",
    icon: BookOpenCheck,
    color: "bg-violet-600",
  },
  {
    name: "View Reports",
    description: "View and generate student report cards.",
    href: "/dashboard/reports",
    icon: FileText,
    color: "bg-orange-500",
  },
];

const activities = [
  {
    title: "Authentication module completed",
    description: "Login and secure access are now available.",
    time: "Current module",
    icon: CircleCheckBig,
    iconColor: "text-emerald-600",
    iconBackground: "bg-emerald-100",
  },
  {
    title: "Administrator account activated",
    description: "The initial Headmaster account is active.",
    time: "System setup",
    icon: Users,
    iconColor: "text-blue-600",
    iconBackground: "bg-blue-100",
  },
  {
    title: "Student registration pending",
    description: "Student management will be the next module.",
    time: "Next module",
    icon: Clock3,
    iconColor: "text-amber-600",
    iconBackground: "bg-amber-100",
  },
];

export default function AdminDashboardPage() {
  const date = new Intl.DateTimeFormat("en-RW", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto max-w-[1600px]">
      <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-700">
            Administration Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor the school’s important activities from one place.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <CalendarCheck size={18} className="text-blue-700" />
          {date}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((statistic) => {
          const Icon = statistic.icon;

          return (
            <article
              key={statistic.title}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {statistic.title}
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                    {statistic.value}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${statistic.iconBackground} ${statistic.iconColor}`}
                >
                  <Icon size={23} />
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  {statistic.description}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-7 grid gap-7 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Access frequently used school operations.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.name}
                  href={action.href}
                  className="group flex items-start gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${action.color}`}
                  >
                    <Icon size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-800">
                        {action.name}
                      </h3>

                      <ArrowUpRight
                        size={17}
                        className="text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-700"
                      />
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Activities
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest system progress and activities.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {activities.map((activity) => {
              const Icon = activity.icon;

              return (
                <div
                  key={activity.title}
                  className="flex items-start gap-3"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activity.iconBackground} ${activity.iconColor}`}
                  >
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {activity.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {activity.description}
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-blue-600">
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-7 rounded-2xl bg-gradient-to-r from-[#102a43] to-[#2454c6] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-200">
              System development
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Student Registration Module
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              The authentication module is ready. Student registration,
              guardian information and class enrollment will be developed next.
            </p>
          </div>

          <Link
            href="/dashboard/students"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-blue-800 transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Open Students
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
