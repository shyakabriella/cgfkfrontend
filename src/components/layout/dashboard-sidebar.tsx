"use client";

import {
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  FileQuestion,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  NotebookText,
  School,
  Settings,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type DashboardSidebarProps = {
  open: boolean;
  onClose: () => void;
};

type NavigationItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  hiddenFor?: string[];
  allowedFor?: string[];
  comingSoon?: boolean;
};

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "My Courses",
    href: "/dashboard/my-courses",
    icon: LibraryBig,
    allowedFor: ["student"],
  },
  {
    name: "My Work",
    href: "/dashboard/my-work",
    icon: ClipboardList,
    allowedFor: ["student"],
  },
  {
    name: "Academic",
    href: "/dashboard/academic",
    icon: School,
  },
  {
    name: "Teaching Materials",
    href: "/dashboard/teaching-materials",
    icon: NotebookText,
    allowedFor: [
      "headmaster",
      "director_of_studies",
      "teacher",
    ],
  },
  {
    name: "Teacher Assignments",
    href: "/dashboard/teacher-assignments",
    icon: UserRoundCheck,
  },
  {
    name: "Students",
    href: "/dashboard/students",
    icon: GraduationCap,
  },
  {
    name: "Assessments",
    href: "/dashboard/assessments",
    icon: FileQuestion,
    allowedFor: [
      "headmaster",
      "director_of_studies",
      "teacher",
    ],
  },
  {
    name: "Attendance",
    href: "/dashboard/attendance",
    icon: CalendarCheck,
    hiddenFor: ["director_of_studies"],
  },
  {
    name: "Marks",
    href: "/dashboard/marks",
    icon: BookOpenCheck,
    hiddenFor: ["director_of_studies"],
    comingSoon: true,
  },
  {
    name: "Report Cards",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    name: "Finance",
    href: "/dashboard/finance",
    icon: WalletCards,
    allowedFor: ["headmaster", "accountant"],
  },
  {
    name: "Staff",
    href: "/dashboard/staff",
    icon: Users,
    hiddenFor: ["director_of_studies"],
  },
];

const roleDashboardPages: Record<string, string> = {
  headmaster: "/dashboard",
  director_of_studies: "/dashboard/director_of_studies",
  discipline_master: "/dashboard/discipline_master",
  accountant: "/dashboard/accountant",
  teacher: "/dashboard/teacher",
  student: "/dashboard",
  matron: "/dashboard/matron",
  patron: "/dashboard/patron",
};

export default function DashboardSidebar({
  open,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const storedUser =
      localStorage.getItem("cgfk_user") ??
      sessionStorage.getItem("cgfk_user");

    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser) as {
        role?: string;
      };

      setUserRole(user.role ?? "");
    } catch {
      setUserRole("");
    }
  }, []);

  const dashboardHref =
    roleDashboardPages[userRole] ?? "/dashboard";

  const visibleNavigation = useMemo(() => {
    if (userRole === "student") {
      return navigation.filter((item) =>
        [
          "/dashboard",
          "/dashboard/my-courses",
          "/dashboard/my-work",
        ].includes(item.href),
      );
    }

    if (userRole === "accountant") {
      return navigation.filter((item) =>
        [
          "/dashboard",
          "/dashboard/finance",
        ].includes(item.href),
      );
    }

    if (userRole === "teacher") {
      return navigation.filter((item) =>
        [
          "/dashboard",
          "/dashboard/academic",
          "/dashboard/teaching-materials",
          "/dashboard/attendance",
          "/dashboard/assessments",
          "/dashboard/marks",
        ].includes(item.href),
      );
    }

    return navigation.filter((item) => {
      if (!userRole) return true;

      if (
        item.allowedFor &&
        !item.allowedFor.includes(userRole)
      ) {
        return false;
      }

      return !item.hiddenFor?.includes(userRole);
    });
  }, [userRole]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#102a43] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link
            href={dashboardHref}
            onClick={onClose}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5">
              <Image
                src="/lo.png"
                alt="CGFK School logo"
                width={48}
                height={48}
                priority
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-bold">
                CGFK School
              </p>

              <p className="truncate text-xs text-slate-300">
                Management System
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Main menu
          </p>

          <nav className="space-y-1.5">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;

              const href =
                item.href === "/dashboard"
                  ? dashboardHref
                  : item.href;

              const active =
                item.href === "/dashboard"
                  ? pathname === dashboardHref
                  : pathname.startsWith(item.href);

              if (item.comingSoon) {
                return (
                  <div
                    key={item.href}
                    title="This feature is coming soon"
                    className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400"
                  >
                    <Icon
                      size={20}
                      className="shrink-0 text-slate-500"
                    />

                    <span className="min-w-0 flex-1">
                      {item.name}
                    </span>

                    <span className="shrink-0 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-300">
                      Coming soon
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    size={20}
                    className={
                      active
                        ? "text-white"
                        : "text-slate-400 transition group-hover:text-white"
                    }
                  />

                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {!["accountant", "teacher"].includes(userRole) && (
          <div className="border-t border-white/10 p-4">
            <Link
              href="/dashboard/settings"
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                pathname.startsWith("/dashboard/settings")
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Settings size={20} />
              School Settings
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
