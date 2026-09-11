import {
  ArrowRight,
  Banknote,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

const financeMenus = [
  {
    name: "School Fees Management",
    description:
      "Record student payments, monitor balances and manage school fee transactions.",
    href: "/dashboard/finance/school-fees",
    icon: ReceiptText,
  },
  {
    name: "Payroll",
    description:
      "Manage staff salaries, salary payments and monthly payroll records.",
    href: "/dashboard/finance/payroll",
    icon: Banknote,
  },
];

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Financial Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Finance
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage school fees and staff payroll from one place.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
            <WalletCards size={22} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Finance Management
            </h2>

            <p className="text-sm text-slate-500">
              Select the financial activity you want to manage.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {financeMenus.map((menu) => {
            const Icon = menu.icon;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-xl bg-slate-100 p-3 text-slate-700 transition group-hover:bg-slate-200">
                    <Icon size={24} />
                  </div>

                  <ArrowRight
                    size={20}
                    className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700"
                  />
                </div>

                <h3 className="mt-5 font-bold text-slate-900">
                  {menu.name}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {menu.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  Open management page
                  <ArrowRight
                    size={16}
                    className="transition group-hover:translate-x-1"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
