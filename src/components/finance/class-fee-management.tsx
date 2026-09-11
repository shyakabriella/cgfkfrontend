"use client";

import {
  ArrowLeft,
  Banknote,
  CircleDollarSign,
  CreditCard,
  LoaderCircle,
  Pencil,
  ReceiptText,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getClasses,
  getStudents,
  RegisteredStudent,
  SchoolClass,
} from "@/services/student.service";

type PaymentStudent = RegisteredStudent & {
  fee_summary?: {
    total_required: number;
    total_paid: number;
    balance: number;
  };
};

type PaymentForm = {
  amount: string;
  payment_date: string;
  payment_method: "cash" | "bank" | "mobile_money";
  reference: string;
  notes: string;
};

const emptyPaymentForm: PaymentForm = {
  amount: "",
  payment_date: new Date().toISOString().split("T")[0],
  payment_method: "cash",
  reference: "",
  notes: "",
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function money(value?: number) {
  return `${Number(value ?? 0).toLocaleString()} RWF`;
}

function getErrorMessage(result: unknown, fallback: string) {
  if (!result || typeof result !== "object") return fallback;

  const response = result as {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (response.errors) {
    return Object.values(response.errors).flat().join(" ");
  }

  return response.message ?? fallback;
}

export default function ClassFeeManagement({
  classId,
}: {
  classId: number;
}) {
  const [schoolClass, setSchoolClass] =
    useState<SchoolClass | null>(null);
  const [students, setStudents] = useState<PaymentStudent[]>([]);
  const [selectedStudent, setSelectedStudent] =
    useState<PaymentStudent | null>(null);
  const [form, setForm] =
    useState<PaymentForm>(emptyPaymentForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [classList, studentList] = await Promise.all([
        getClasses(),
        getStudents({ schoolClassId: classId }),
      ]);

      setSchoolClass(
        classList.find((item) => item.id === classId) ?? null,
      );
      setStudents(studentList as PaymentStudent[]);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Class payment information could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [classId]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return students;

    return students.filter((student) =>
      [
        student.first_name,
        student.last_name,
        student.student_id,
        student.parent_contact,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [students, search]);

  const totals = useMemo(() => {
    return students.reduce(
      (result, student) => {
        result.required +=
          student.fee_summary?.total_required ?? 0;
        result.paid += student.fee_summary?.total_paid ?? 0;
        result.balance += student.fee_summary?.balance ?? 0;

        return result;
      },
      {
        required: 0,
        paid: 0,
        balance: 0,
      },
    );
  }, [students]);

  function openPayment(student: PaymentStudent) {
    setSelectedStudent(student);
    setForm(emptyPaymentForm);
    setError("");
    setSuccess("");
  }

  function closePayment() {
    if (submitting) return;

    setSelectedStudent(null);
    setForm(emptyPaymentForm);
    setError("");
  }

  async function savePayment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedStudent) return;

    const token = getToken();

    if (!token) {
      setError("Unauthenticated. Please log in again.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${apiUrl}/fee-payments`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            student_id: selectedStudent.id,
            school_class_id: classId,
            amount: Number(form.amount),
            payment_date: form.payment_date,
            payment_method: form.payment_method,
            reference: form.reference.trim() || null,
            notes: form.notes.trim() || null,
          }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            "The payment could not be recorded.",
          ),
        );
      }

      setSelectedStudent(null);
      setSuccess(
        `Payment recorded for ${selectedStudent.first_name} ${selectedStudent.last_name}.`,
      );

      await loadData();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "The payment could not be recorded.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
        <LoaderCircle size={20} className="animate-spin" />
        Loading class students...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/finance/school-fees"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Classes
        </Link>

        <p className="mt-5 text-sm font-medium text-slate-500">
          School Fees Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          {schoolClass?.name ?? "Class Payments"}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {schoolClass?.code} · Manage payments for students
          registered in this class.
        </p>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {error && !selectedStudent && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Required Fees"
          value={money(totals.required)}
          icon={ReceiptText}
        />

        <SummaryCard
          label="Total Collected"
          value={money(totals.paid)}
          icon={CircleDollarSign}
        />

        <SummaryCard
          label="Outstanding Balance"
          value={money(totals.balance)}
          icon={CreditCard}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student by name or student ID..."
              className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center">
            <ReceiptText
              size={34}
              className="mx-auto text-slate-400"
            />

            <h2 className="mt-3 font-semibold text-slate-900">
              No students found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              No active students are registered in this class.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Student ID</th>
                  <th className="px-5 py-3">Required</th>
                  <th className="px-5 py-3">Paid</th>
                  <th className="px-5 py-3">Balance</th>
                  <th className="px-5 py-3 text-right">
                    Payment
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {student.first_name} {student.last_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {student.parent_contact}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {student.student_id}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {money(
                        student.fee_summary?.total_required,
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-emerald-700">
                      {money(student.fee_summary?.total_paid)}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-red-600">
                      {money(student.fee_summary?.balance)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openPayment(student)}
                        title="Record payment"
                        aria-label={`Record payment for ${student.first_name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Pencil size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedStudent && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Record Payment
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedStudent.first_name}{" "}
                  {selectedStudent.last_name} ·{" "}
                  {selectedStudent.student_id}
                </p>
              </div>

              <button
                type="button"
                onClick={closePayment}
                disabled={submitting}
                aria-label="Close payment form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={savePayment}
              className="space-y-4 p-5"
            >
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Amount paid
                </span>

                <div className="relative">
                  <Banknote
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="number"
                    min="1"
                    required
                    value={form.amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="Enter amount in RWF"
                    className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Payment date
                  </span>

                  <input
                    type="date"
                    required
                    value={form.payment_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        payment_date: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Payment method
                  </span>

                  <select
                    value={form.payment_method}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        payment_method: event.target
                          .value as PaymentForm["payment_method"],
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="mobile_money">
                      Mobile Money
                    </option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Reference
                </span>

                <input
                  value={form.reference}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reference: event.target.value,
                    }))
                  }
                  placeholder="Receipt or transaction reference"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Notes
                </span>

                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
                />
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closePayment}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  {submitting ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Banknote size={17} />
                  )}

                  {submitting ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof ReceiptText;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}
