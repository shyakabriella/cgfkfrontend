import {
  ArrowRight,
  Banknote,
  ReceiptText,
  Settings,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

const financeMenus = [
  {
    name: "School Fees",
    description: "Manage student fees and payments.",
    href: "/dashboard/finance/school-fees",
    icon: ReceiptText,
  },
  {
    name: "Payroll",
    description: "Manage staff salaries and payroll.",
    href: "/dashboard/finance/payroll",
    icon: Banknote,
  },
  {
    name: "Settings",
    description: "Configure fees and payroll settings.",
    href: "/dashboard/finance/settings",
    icon: Settings,
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
          Manage school fees, payroll and finance settings.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
            <WalletCards size={19} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Finance Management
            </h2>

            <p className="text-xs text-slate-500">
              Select an activity to continue.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {financeMenus.map((menu) => {
            const Icon = menu.icon;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-slate-200">
                  <Icon size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    {menu.name}
                  </h3>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {menu.description}
                  </p>
                </div>

                <ArrowRight
                  size={17}
                  className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700"
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
