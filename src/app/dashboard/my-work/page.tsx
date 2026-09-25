"use client";

import {
  ClipboardList,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

type StudentWork = {
  id: number;
  title: string;
  type: "assignment" | "quiz" | "exam";
  course_name: string;
  due_date?: string | null;
  status: "pending" | "submitted" | "closed";
};

export default function MyWorkPage() {
  const [search, setSearch] = useState("");
  const [work] = useState<StudentWork[]>([]);

  const filteredWork = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return work;

    return work.filter((item) =>
      [
        item.title,
        item.type,
        item.course_name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [search, work]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm text-slate-500">
          Student Portal
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          My Work
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View assignments, quizzes and examinations assigned
          to you.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search assignments, quizzes or exams..."
            className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {filteredWork.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <ClipboardList
            size={34}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-4 font-semibold text-slate-900">
            No work assigned
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Assignments, quizzes and examinations published for
            your class will appear here.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-200">
            {filteredWork.map((item) => (
              <article
                key={item.id}
                className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">
                      {item.title}
                    </h2>

                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-600">
                      {item.type}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {item.course_name}
                  </p>
                </div>

                <span className="self-start text-sm capitalize text-slate-500 sm:self-center">
                  {item.status}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
