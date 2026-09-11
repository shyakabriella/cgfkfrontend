"use client";

import {
  ArrowLeft,
  Banknote,
  CircleDollarSign,
  CreditCard,
  Download,
  LoaderCircle,
  Pencil,
  ReceiptText,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  RegisteredStudent,
} from "@/services/student.service";
import {
  FinanceClass,
  getFinanceClassStudents,
} from "@/services/finance.service";

type PaymentStudent = RegisteredStudent & {
  fee_summary?: {
    total_required: number;
    total_paid: number;
    balance: number;
  };
};

type FeeItem = {
  id: number;
  school_class_id: number | null;
  name: string;
  code: string;
  amount: string;
  academic_year: string;
  term: number | null;
  is_required: boolean;
  status: "active" | "inactive";
};

type FeePayment = {
  id: number;
  student_id: number;
  school_class_id: number;
  fee_item_id: number;
  amount: string;
  payment_date: string;
  payment_method: "cash" | "bank" | "mobile_money";
  receipt_number: string;
  status: "completed" | "voided";
};

type PaymentForm = {
  fee_item_id: string;
  amount: string;
  payment_date: string;
  payment_method: "cash" | "bank" | "mobile_money";
  reference: string;
  notes: string;
};

const emptyPaymentForm: PaymentForm = {
  fee_item_id: "",
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

function extractList<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  if (!result || typeof result !== "object") {
    return [];
  }

  const response = result as {
    data?: T[] | { data?: T[] };
  };

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    Array.isArray(response.data.data)
  ) {
    return response.data.data;
  }

  return [];
}

export default function ClassFeeManagement({
  classId,
}: {
  classId: number;
}) {
  const [schoolClass, setSchoolClass] =
    useState<FinanceClass | null>(null);
  const [students, setStudents] = useState<PaymentStudent[]>([]);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [selectedStudent, setSelectedStudent] =
    useState<PaymentStudent | null>(null);
  const [form, setForm] =
    useState<PaymentForm>(emptyPaymentForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const authToken = getToken();

      if (!authToken) {
        throw new Error("Unauthenticated. Please log in again.");
      }

      const [
        classInformation,
        feeResponse,
        paymentResponse,
      ] = await Promise.all([
        getFinanceClassStudents(classId),
        fetch(`${apiUrl}/fee-items`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }),
        fetch(
          `${apiUrl}/fee-payments?school_class_id=${classId}&status=completed&per_page=100`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          },
        ),
      ]);

      const [feeResult, paymentResult] =
        await Promise.all([
          feeResponse.json(),
          paymentResponse.json(),
        ]);

      if (!feeResponse.ok) {
        throw new Error(
          getErrorMessage(
            feeResult,
            "Payment items could not be loaded.",
          ),
        );
      }

      if (!paymentResponse.ok) {
        throw new Error(
          getErrorMessage(
            paymentResult,
            "Paid fees could not be loaded.",
          ),
        );
      }

      const applicableItems = extractList<FeeItem>(
        feeResult,
      ).filter(
        (item) =>
          item.status === "active" &&
          (
            item.school_class_id === null ||
            item.school_class_id === classId
          ),
      );

      setSchoolClass(classInformation.schoolClass);
      setStudents(
        classInformation.students as PaymentStudent[],
      );
      setFeeItems(applicableItems);
      setPayments(
        extractList<FeePayment>(paymentResult).filter(
          (payment) => payment.status === "completed",
        ),
      );
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

  const requiredFeeTotal = useMemo(
    () =>
      feeItems
        .filter((item) => item.is_required)
        .reduce(
          (total, item) => total + Number(item.amount),
          0,
        ),
    [feeItems],
  );

  const selectedFeeItem = feeItems.find(
    (item) => item.id === Number(form.fee_item_id),
  );

  const requiredFeeItemIds = useMemo(
    () =>
      new Set(
        feeItems
          .filter((item) => item.is_required)
          .map((item) => item.id),
      ),
    [feeItems],
  );

  const paidByStudent = useMemo(() => {
    const result = new Map<number, number>();

    payments.forEach((payment) => {
      result.set(
        payment.student_id,
        (result.get(payment.student_id) ?? 0) +
          Number(payment.amount),
      );
    });

    return result;
  }, [payments]);

  const requiredPaidByStudent = useMemo(() => {
    const result = new Map<number, number>();

    payments.forEach((payment) => {
      if (!requiredFeeItemIds.has(payment.fee_item_id)) {
        return;
      }

      result.set(
        payment.student_id,
        (result.get(payment.student_id) ?? 0) +
          Number(payment.amount),
      );
    });

    return result;
  }, [payments, requiredFeeItemIds]);

  const paidByStudentAndItem = useMemo(() => {
    const result = new Map<string, number>();

    payments.forEach((payment) => {
      const key = `${payment.student_id}:${payment.fee_item_id}`;

      result.set(
        key,
        (result.get(key) ?? 0) + Number(payment.amount),
      );
    });

    return result;
  }, [payments]);

  function studentPaid(studentId: number) {
    return paidByStudent.get(studentId) ?? 0;
  }

  function studentRequiredPaid(studentId: number) {
    return requiredPaidByStudent.get(studentId) ?? 0;
  }

  function studentItemPaid(
    studentId: number,
    feeItemId: number,
  ) {
    return (
      paidByStudentAndItem.get(
        `${studentId}:${feeItemId}`,
      ) ?? 0
    );
  }

  const selectedItemPaid =
    selectedStudent && selectedFeeItem
      ? studentItemPaid(
          selectedStudent.id,
          selectedFeeItem.id,
        )
      : 0;

  const selectedItemRemaining = selectedFeeItem
    ? Math.max(
        Number(selectedFeeItem.amount) - selectedItemPaid,
        0,
      )
    : 0;

  const totals = useMemo(() => {
    const paid = payments.reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0,
    );

    const required = requiredFeeTotal * students.length;

    const requiredPaid = students.reduce(
      (total, student) =>
        total +
        (requiredPaidByStudent.get(student.id) ?? 0),
      0,
    );

    return {
      required,
      paid,
      balance: Math.max(required - requiredPaid, 0),
    };
  }, [
    payments,
    requiredFeeTotal,
    requiredPaidByStudent,
    students,
  ]);

  async function exportPdf() {
    if (!schoolClass) return;

    setExportingPdf(true);
    setError("");

    try {
      const [{ jsPDF }, autoTableModule] =
        await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);

      const autoTable = autoTableModule.default;
      const document = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const logoResponse = await fetch("/lo.png");
      const logoBlob = await logoResponse.blob();

      const logoData = await new Promise<string>(
        (resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () =>
            resolve(String(reader.result));
          reader.onerror = () =>
            reject(new Error("Logo could not be loaded."));
          reader.readAsDataURL(logoBlob);
        },
      );

      document.addImage(
        logoData,
        "PNG",
        14,
        10,
        20,
        20,
      );

      document.setTextColor(30, 41, 59);
      document.setFont("helvetica", "bold");
      document.setFontSize(15);
      document.text("CGFK SCHOOL", 40, 16);

      document.setFont("helvetica", "normal");
      document.setFontSize(9);
      document.setTextColor(100, 116, 139);
      document.text(
        "School Fees Management Report",
        40,
        22,
      );

      document.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        40,
        27,
      );

      document.setDrawColor(203, 213, 225);
      document.line(14, 34, 283, 34);

      document.setFont("helvetica", "bold");
      document.setFontSize(12);
      document.setTextColor(30, 41, 59);
      document.text(
        `${schoolClass.name} (${schoolClass.code})`,
        14,
        42,
      );

      document.setFont("helvetica", "normal");
      document.setFontSize(9);
      document.setTextColor(71, 85, 105);

      document.text(
        `Required: ${money(totals.required)}`,
        14,
        49,
      );

      document.text(
        `Collected: ${money(totals.paid)}`,
        80,
        49,
      );

      document.text(
        `Outstanding: ${money(totals.balance)}`,
        146,
        49,
      );

      document.text(
        `Students: ${students.length}`,
        220,
        49,
      );

      autoTable(document, {
        startY: 56,
        head: [[
          "No.",
          "Student ID",
          "Student",
          "Required",
          "Paid",
          "Balance",
        ]],
        body: students.map((student, index) => {
          const paid = studentPaid(student.id);
          const requiredPaid =
            studentRequiredPaid(student.id);

          const balance = Math.max(
            requiredFeeTotal - requiredPaid,
            0,
          );

          return [
            index + 1,
            student.student_id,
            `${student.first_name} ${student.last_name}`,
            money(requiredFeeTotal),
            money(paid),
            money(balance),
          ];
        }),
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8.5,
          cellPadding: 3,
          textColor: [51, 65, 85],
          lineColor: [203, 213, 225],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: {
            cellWidth: 14,
            halign: "center",
          },
          1: {
            cellWidth: 38,
          },
          2: {
            cellWidth: 70,
          },
          3: {
            cellWidth: 45,
            halign: "right",
          },
          4: {
            cellWidth: 45,
            halign: "right",
          },
          5: {
            cellWidth: 45,
            halign: "right",
          },
        },
        didDrawPage: (data) => {
          const pageNumber =
            document.getNumberOfPages();

          document.setFontSize(8);
          document.setTextColor(100, 116, 139);

          document.text(
            `Page ${pageNumber}`,
            276,
            document.internal.pageSize.height - 7,
            {
              align: "right",
            },
          );

          document.text(
            "CGFK School Management System",
            14,
            document.internal.pageSize.height - 7,
          );
        },
      });

      const filename = `${schoolClass.code
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-fee-report.pdf`;

      document.save(filename);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "The PDF report could not be generated.",
      );
    } finally {
      setExportingPdf(false);
    }
  }

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
            fee_item_id: Number(form.fee_item_id),
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

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              School Fees Management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              {schoolClass?.name ?? "Class Payments"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {schoolClass?.code} · Manage payments for
              students registered in this class.
            </p>
          </div>

          <button
            type="button"
            onClick={exportPdf}
            disabled={
              exportingPdf ||
              students.length === 0
            }
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingPdf ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Download size={17} />
            )}

            {exportingPdf
              ? "Creating PDF..."
              : "Export PDF"}
          </button>
        </div>
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
                  <th className="px-5 py-3">Student ID</th>
                  <th className="px-5 py-3">Student</th>
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
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {student.student_id}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {student.first_name} {student.last_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {student.parent_contact}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {money(requiredFeeTotal)}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-emerald-700">
                      {money(studentPaid(student.id))}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-red-600">
                      {money(
                        Math.max(
                          requiredFeeTotal -
                            studentRequiredPaid(student.id),
                          0,
                        ),
                      )}
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
                  Payment item
                </span>

                <select
                  required
                  value={form.fee_item_id}
                  onChange={(event) => {
                    const item = feeItems.find(
                      (feeItem) =>
                        feeItem.id ===
                        Number(event.target.value),
                    );

                    const alreadyPaid =
                      item && selectedStudent
                        ? studentItemPaid(
                            selectedStudent.id,
                            item.id,
                          )
                        : 0;

                    const remaining = item
                      ? Math.max(
                          Number(item.amount) - alreadyPaid,
                          0,
                        )
                      : 0;

                    setForm((current) => ({
                      ...current,
                      fee_item_id: event.target.value,
                      amount:
                        remaining > 0
                          ? String(remaining)
                          : "",
                    }));
                  }}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">
                    Select what the student is paying for
                  </option>

                  {feeItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.code}) —{" "}
                      {money(Number(item.amount))}
                    </option>
                  ))}
                </select>

                {feeItems.length === 0 && (
                  <p className="mt-1.5 text-xs text-red-600">
                    No payment items are configured for this
                    class. Create them from Finance Settings.
                  </p>
                )}
              </label>

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
                    max={
                      selectedFeeItem
                        ? selectedItemRemaining
                        : undefined
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {selectedFeeItem && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Configured amount:{" "}
                    {money(Number(selectedFeeItem.amount))}
                  </p>
                )}
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
                  disabled={
                    submitting || !form.fee_item_id
                  }
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
