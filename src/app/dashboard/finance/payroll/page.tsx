import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Plus,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";

const cards = [
  {
    name: "Active Staff",
    value: "0",
    icon: Users,
  },
  {
    name: "Monthly Payroll",
    value: "0 RWF",
    icon: CircleDollarSign,
  },
  {
    name: "Pending Payments",
    value: "0",
    icon: CalendarDays,
  },
];

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/finance"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Finance
        </Link>

        <p className="mt-5 text-sm font-medium text-slate-500">
          Financial Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Payroll
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage staff salaries and monthly salary payments.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.name}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {card.name}
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

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Staff Payroll
            </h2>

            <p className="text-sm text-slate-500">
              Staff salary and payment records.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
          >
            <Plus size={17} />
            Create Payroll
          </button>
        </div>

        <div className="p-5">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              placeholder="Search staff by name, email or role..."
              className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="py-16 text-center">
            <Banknote
              size={36}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-3 font-semibold text-slate-900">
              No payroll records
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Created salary and payroll records will appear here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
