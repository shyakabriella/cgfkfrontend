"use client";

import {
  FinanceClass,
  getFinanceClasses,
} from "@/services/finance.service";
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  LoaderCircle,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function SchoolFeesPage() {
  const [classes, setClasses] = useState<FinanceClass[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClasses() {
      try {
        setClasses(await getFinanceClasses());
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : "Classes could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadClasses();
  }, []);

  const filteredClasses = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return classes;

    return classes.filter((schoolClass) =>
      [
        schoolClass.name,
        schoolClass.code,
        schoolClass.level,
        schoolClass.program?.name,
        schoolClass.program?.department?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [classes, search]);

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
          School Fees Management
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Select a class to view its students and manage their
          school-fee payments.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search classes by name, code, trade or department..."
            className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
          <LoaderCircle size={20} className="animate-spin" />
          Loading classes...
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <GraduationCap
            size={36}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-3 font-semibold text-slate-900">
            No classes found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create classes from the Academic page first.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredClasses.map((schoolClass) => (
            <Link
              key={schoolClass.id}
              href={`/dashboard/finance/school-fees/${schoolClass.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                  <GraduationCap size={22} />
                </div>

                <ArrowRight
                  size={19}
                  className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700"
                />
              </div>

              <h2 className="mt-4 font-bold text-slate-900">
                {schoolClass.name}
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {schoolClass.code}
                {schoolClass.level
                  ? ` · ${schoolClass.level}`
                  : ""}
              </p>

              <div className="mt-4 space-y-1 text-xs text-slate-500">
                <p>
                  Trade/Option:{" "}
                  <span className="font-medium text-slate-700">
                    {schoolClass.program?.name ?? "—"}
                  </span>
                </p>

                <p>
                  Department:{" "}
                  <span className="font-medium text-slate-700">
                    {schoolClass.program?.department?.name ?? "—"}
                  </span>
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-700">
                <Users size={17} />
                Open student payments
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
