"use client";

import {
  ArrowLeft,
  LoaderCircle,
  Pencil,
  Plus,
  ReceiptText,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getClasses,
  SchoolClass,
} from "@/services/student.service";

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
  school_class?: {
    id: number;
    name: string;
    code: string;
  } | null;
};

type FeeForm = {
  school_class_id: string;
  name: string;
  code: string;
  amount: string;
  academic_year: string;
  term: string;
  is_required: boolean;
  status: "active" | "inactive";
};

const emptyForm: FeeForm = {
  school_class_id: "",
  name: "",
  code: "",
  amount: "",
  academic_year: "2026-2027",
  term: "1",
  is_required: true,
  status: "active",
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

function token() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function extractList<T>(result: unknown): T[] {
  if (
    result &&
    typeof result === "object" &&
    "data" in result
  ) {
    const data = (result as { data: unknown }).data;

    if (Array.isArray(data)) return data as T[];
  }

  return Array.isArray(result) ? (result as T[]) : [];
}

function errorMessage(result: unknown, fallback: string) {
  if (!result || typeof result !== "object") return fallback;

  const response = result as {
    message?: string;
    errors?: Record<string, string[]>;
  };

  return response.errors
    ? Object.values(response.errors).flat().join(" ")
    : response.message ?? fallback;
}

export default function FinanceSettingsPage() {
  const [items, setItems] = useState<FeeItem[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [form, setForm] = useState<FeeForm>(emptyForm);
  const [editing, setEditing] = useState<FeeItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    const authToken = token();

    if (!authToken) {
      setError("Unauthenticated. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const [classList, response] = await Promise.all([
        getClasses(),
        fetch(`${apiUrl}/fee-items`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }),
      ]);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          errorMessage(result, "Fee items could not be loaded."),
        );
      }

      setClasses(classList);
      setItems(extractList<FeeItem>(result));
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Fee items could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return items;

    return items.filter((item) =>
      [
        item.name,
        item.code,
        item.academic_year,
        item.school_class?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [items, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEdit(item: FeeItem) {
    setEditing(item);
    setForm({
      school_class_id: String(item.school_class_id ?? ""),
      name: item.name,
      code: item.code,
      amount: String(item.amount),
      academic_year: item.academic_year,
      term: String(item.term ?? ""),
      is_required: item.is_required,
      status: item.status,
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const authToken = token();

    if (!authToken) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        editing
          ? `${apiUrl}/fee-items/${editing.id}`
          : `${apiUrl}/fee-items`,
        {
          method: editing ? "PUT" : "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            school_class_id: form.school_class_id
              ? Number(form.school_class_id)
              : null,
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            amount: Number(form.amount),
            academic_year: form.academic_year.trim(),
            term: form.term ? Number(form.term) : null,
            is_required: form.is_required,
            status: form.status,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          errorMessage(result, "Fee item could not be saved."),
        );
      }

      setShowModal(false);
      setSuccess(
        editing
          ? "Fee item updated successfully."
          : "Fee item created successfully.",
      );
      await loadData();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Fee item could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteItem(item: FeeItem) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;

    const authToken = token();

    if (!authToken) return;

    const response = await fetch(
      `${apiUrl}/fee-items/${item.id}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(
        errorMessage(result, "Fee item could not be deleted."),
      );
      return;
    }

    setItems((current) =>
      current.filter((value) => value.id !== item.id),
    );
    setSuccess("Fee item deleted successfully.");
  }

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

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Financial Management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Payment Items
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Define what students are required to pay.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            <Plus size={17} />
            Add Payment Item
          </button>
        </div>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search payment items..."
              className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center gap-2 py-16 text-sm text-slate-500">
            <LoaderCircle size={19} className="animate-spin" />
            Loading payment items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <ReceiptText
              size={34}
              className="mx-auto text-slate-400"
            />
            <p className="mt-3 font-semibold text-slate-900">
              No payment items created
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Requirement</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.code}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {Number(item.amount).toLocaleString()} RWF
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {item.school_class?.name ?? "All classes"}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {item.academic_year} ·{" "}
                      {item.term ? `Term ${item.term}` : "All terms"}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {item.is_required ? "Required" : "Optional"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                          aria-label="Edit payment item"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => void deleteItem(item)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          aria-label="Delete payment item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-bold">
                  {editing ? "Edit Payment Item" : "Add Payment Item"}
                </h2>
                <p className="text-sm text-slate-500">
                  Example: School Feeding, Uniform or Insurance.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveItem} className="space-y-4 p-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Item name"
                  value={form.name}
                  placeholder="School Feeding"
                  onChange={(value) =>
                    setForm({ ...form, name: value })
                  }
                />

                <Input
                  label="Code"
                  value={form.code}
                  placeholder="FEED"
                  uppercase
                  onChange={(value) =>
                    setForm({ ...form, code: value })
                  }
                />
              </div>

              <Input
                label="Amount (RWF)"
                value={form.amount}
                type="number"
                placeholder="50000"
                onChange={(value) =>
                  setForm({ ...form, amount: value })
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Academic year"
                  value={form.academic_year}
                  placeholder="2026-2027"
                  onChange={(value) =>
                    setForm({ ...form, academic_year: value })
                  }
                />

                <Select
                  label="Term"
                  value={form.term}
                  onChange={(value) =>
                    setForm({ ...form, term: value })
                  }
                >
                  <option value="">All terms</option>
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </Select>
              </div>

              <Select
                label="Applicable class"
                value={form.school_class_id}
                onChange={(value) =>
                  setForm({ ...form, school_class_id: value })
                }
              >
                <option value="">All classes</option>

                {classes.map((schoolClass) => (
                  <option
                    key={schoolClass.id}
                    value={schoolClass.id}
                  >
                    {schoolClass.name} ({schoolClass.code})
                  </option>
                ))}
              </Select>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Requirement"
                  value={form.is_required ? "1" : "0"}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      is_required: value === "1",
                    })
                  }
                >
                  <option value="1">Required</option>
                  <option value="0">Optional</option>
                </Select>

                <Select
                  label="Status"
                  value={form.status}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      status: value as "active" | "inactive",
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
                >
                  {submitting ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  placeholder,
  type = "text",
  uppercase = false,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  uppercase?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-sm font-medium">
        {label}
      </span>
      <input
        required
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            uppercase
              ? event.target.value.toUpperCase()
              : event.target.value,
          )
        }
        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none"
      />
    </label>
  );
}

function Select({
  label,
  value,
  children,
  onChange,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-sm font-medium">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none"
      >
        {children}
      </select>
    </label>
  );
}
