import {
  BookOpenCheck,
  CalendarCheck,
  CircleDollarSign,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  LucideIcon,
  School,
  ShieldCheck,
  UserRoundCheck,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

export type DashboardRole =
  | "director_of_studies"
  | "discipline_master"
  | "accountant"
  | "teacher"
  | "matron"
  | "patron";

type DashboardCard = {
  label: string;
  value: string;
  icon: LucideIcon;
};

type QuickAction = {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type DashboardConfiguration = {
  title: string;
  roleName: string;
  description: string;
  cards: DashboardCard[];
  actions: QuickAction[];
  responsibilities: string[];
};

const dashboards: Record<
  DashboardRole,
  DashboardConfiguration
> = {
  director_of_studies: {
    title: "Academic Dashboard",
    roleName: "Director of Studies",
    description:
      "Manage the school academic structure, courses, teachers, marks and reports.",
    cards: [
      {
        label: "Departments",
        value: "View",
        icon: School,
      },
      {
        label: "Classes",
        value: "View",
        icon: GraduationCap,
      },
      {
        label: "Courses",
        value: "View",
        icon: BookOpenCheck,
      },
      {
        label: "Teacher Assignments",
        value: "Manage",
        icon: UserRoundCheck,
      },
    ],
    actions: [
      {
        name: "Academic Structure",
        description: "Manage departments, trades and classes.",
        href: "/dashboard/academic",
        icon: School,
      },
      {
        name: "Courses",
        description: "Create and manage school courses.",
        href: "/dashboard/courses",
        icon: BookOpenCheck,
      },
      {
        name: "Teacher Assignments",
        description: "Assign teachers to classes and courses.",
        href: "/dashboard/teacher-assignments",
        icon: UserRoundCheck,
      },
      {
        name: "Reports",
        description: "Review academic reports.",
        href: "/dashboard/reports",
        icon: ClipboardCheck,
      },
    ],
    responsibilities: [
      "Manage departments, trades, options and classes.",
      "Manage courses, module hours and periods.",
      "Assign teachers to classes and courses.",
      "Supervise marks and academic reports.",
    ],
  },

  discipline_master: {
    title: "Discipline Dashboard",
    roleName: "Discipline Master",
    description:
      "Monitor student attendance, discipline and daily school conduct.",
    cards: [
      {
        label: "Students",
        value: "View",
        icon: GraduationCap,
      },
      {
        label: "Attendance",
        value: "Monitor",
        icon: CalendarCheck,
      },
      {
        label: "Discipline Cases",
        value: "0",
        icon: ShieldCheck,
      },
      {
        label: "Pending Follow-up",
        value: "0",
        icon: ClipboardCheck,
      },
    ],
    actions: [
      {
        name: "Attendance",
        description: "Monitor student attendance records.",
        href: "/dashboard/attendance",
        icon: CalendarCheck,
      },
      {
        name: "Students",
        description: "Search and view registered students.",
        href: "/dashboard/students",
        icon: GraduationCap,
      },
    ],
    responsibilities: [
      "Monitor daily student attendance.",
      "Record and follow up discipline cases.",
      "Monitor student punctuality and conduct.",
      "Prepare discipline reports for school management.",
    ],
  },

  accountant: {
    title: "Finance Dashboard",
    roleName: "Accountant",
    description:
      "Manage student registration, school fees, payments and financial reports.",
    cards: [
      {
        label: "Registered Students",
        value: "View",
        icon: GraduationCap,
      },
      {
        label: "Fees Collected",
        value: "0 RWF",
        icon: CircleDollarSign,
      },
      {
        label: "Pending Fees",
        value: "0 RWF",
        icon: WalletCards,
      },
      {
        label: "Payments Today",
        value: "0",
        icon: ClipboardCheck,
      },
    ],
    actions: [
      {
        name: "Register Student",
        description: "Register and assign a student to a class.",
        href: "/dashboard/academic",
        icon: GraduationCap,
      },
      {
        name: "School Fees",
        description: "Record and manage student fee payments.",
        href: "/dashboard/fees",
        icon: WalletCards,
      },
      {
        name: "Students",
        description: "Search registered students.",
        href: "/dashboard/students",
        icon: Users,
      },
      {
        name: "Financial Reports",
        description: "Review fee collection reports.",
        href: "/dashboard/reports",
        icon: ClipboardCheck,
      },
    ],
    responsibilities: [
      "Register new students.",
      "Record school fee payments.",
      "Monitor unpaid and partially paid fees.",
      "Prepare school financial reports.",
    ],
  },

  teacher: {
    title: "Teacher Dashboard",
    roleName: "Teacher",
    description:
      "Access assigned classes, take attendance and manage student marks.",
    cards: [
      {
        label: "Assigned Classes",
        value: "View",
        icon: GraduationCap,
      },
      {
        label: "Assigned Courses",
        value: "View",
        icon: BookOpenCheck,
      },
      {
        label: "Attendance Today",
        value: "Open",
        icon: CalendarCheck,
      },
      {
        label: "Marks",
        value: "Manage",
        icon: ClipboardCheck,
      },
    ],
    actions: [
      {
        name: "Take Attendance",
        description: "Record attendance for your current lesson.",
        href: "/dashboard/attendance",
        icon: CalendarCheck,
      },
      {
        name: "Student Marks",
        description: "Record and update student marks.",
        href: "/dashboard/marks",
        icon: BookOpenCheck,
      },
      {
        name: "Students",
        description: "View students in your assigned classes.",
        href: "/dashboard/students",
        icon: GraduationCap,
      },
    ],
    responsibilities: [
      "Teach assigned courses and classes.",
      "Take attendance for every lesson.",
      "Record student marks and assessments.",
      "Monitor the progress of assigned students.",
    ],
  },

  matron: {
    title: "Matron Dashboard",
    roleName: "Matron",
    description:
      "Monitor the welfare, safety and conduct of female students.",
    cards: [
      {
        label: "Female Students",
        value: "View",
        icon: Users,
      },
      {
        label: "Welfare Cases",
        value: "0",
        icon: HeartHandshake,
      },
      {
        label: "Pending Follow-up",
        value: "0",
        icon: ClipboardCheck,
      },
      {
        label: "Attendance",
        value: "View",
        icon: CalendarCheck,
      },
    ],
    actions: [
      {
        name: "Students",
        description: "View and search student information.",
        href: "/dashboard/students",
        icon: Users,
      },
      {
        name: "Attendance",
        description: "Review student attendance.",
        href: "/dashboard/attendance",
        icon: CalendarCheck,
      },
    ],
    responsibilities: [
      "Monitor the welfare of female students.",
      "Record and follow up student welfare cases.",
      "Support student safety and wellbeing.",
      "Report important cases to school management.",
    ],
  },

  patron: {
    title: "Patron Dashboard",
    roleName: "Patron",
    description:
      "Monitor the welfare, safety and conduct of male students.",
    cards: [
      {
        label: "Male Students",
        value: "View",
        icon: Users,
      },
      {
        label: "Welfare Cases",
        value: "0",
        icon: HeartHandshake,
      },
      {
        label: "Pending Follow-up",
        value: "0",
        icon: ClipboardCheck,
      },
      {
        label: "Attendance",
        value: "View",
        icon: CalendarCheck,
      },
    ],
    actions: [
      {
        name: "Students",
        description: "View and search student information.",
        href: "/dashboard/students",
        icon: Users,
      },
      {
        name: "Attendance",
        description: "Review student attendance.",
        href: "/dashboard/attendance",
        icon: CalendarCheck,
      },
    ],
    responsibilities: [
      "Monitor the welfare of male students.",
      "Record and follow up student welfare cases.",
      "Support student safety and wellbeing.",
      "Report important cases to school management.",
    ],
  },
};

export function isDashboardRole(
  role: string,
): role is DashboardRole {
  return role in dashboards;
}

export default function RoleDashboard({
  role,
}: {
  role: DashboardRole;
}) {
  const dashboard = dashboards[role];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">
          {dashboard.roleName}
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          {dashboard.title}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {dashboard.description}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {card.label}
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">
            Quick actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Access the activities available for your role.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {dashboard.actions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.name}
                  href={action.href}
                  className="group rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-700 transition group-hover:bg-slate-200">
                      <Icon size={19} />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {action.name}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">
            Your responsibilities
          </h2>

          <div className="mt-4 space-y-3">
            {dashboard.responsibilities.map((responsibility) => (
              <div
                key={responsibility}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 rounded-full bg-emerald-50 p-1 text-emerald-600">
                  <ShieldCheck size={14} />
                </div>

                <p className="text-sm leading-5 text-slate-600">
                  {responsibility}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
