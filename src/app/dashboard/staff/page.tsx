"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Staff = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  must_change_password: boolean;
};

type Role = {
  value: string;
  label: string;
};

type StaffForm = {
  name: string;
  email: string;
  phone: string;
  role: string;
};

const emptyForm: StaffForm = {
  name: "",
  email: "",
  phone: "",
  role: "",
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function extractList<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  const response = result as {
    data?: T[] | { data?: T[] };
  };

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (response?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
}

function getErrorMessage(result: unknown, fallback: string) {
  if (!result || typeof result !== "object") {
    return fallback;
  }

  const response = result as {
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (response.errors) {
    return Object.values(response.errors).flat().join(" ");
  }

  return response.message || fallback;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [createdStaffEmail, setCreatedStaffEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadStaff = useCallback(async (searchValue = "") => {
    const token = getToken();

    if (!token) {
      setError("Authentication token was not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const parameters = new URLSearchParams({
      per_page: "100",
    });

    if (searchValue.trim()) {
      parameters.set("search", searchValue.trim());
    }

    try {
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [staffResponse, roleResponse] = await Promise.all([
        fetch(`${apiUrl}/staff?${parameters.toString()}`, {
          headers,
        }),
        fetch(`${apiUrl}/staff/roles`, {
          headers,
        }),
      ]);

      const staffResult = await staffResponse.json();
      const roleResult = await roleResponse.json();

      if (!staffResponse.ok) {
        throw new Error(
          getErrorMessage(staffResult, "Staff could not be loaded."),
        );
      }

      if (!roleResponse.ok) {
        throw new Error(
          getErrorMessage(roleResult, "Roles could not be loaded."),
        );
      }

      setStaff(extractList<Staff>(staffResult));
      setRoles(extractList<Role>(roleResult));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Staff could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  function openModal() {
    setForm(emptyForm);
    setCreatedStaffEmail("");
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (submitting) return;

    setShowModal(false);
    setCreatedStaffEmail("");
    setForm(emptyForm);
    setError("");
  }

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError("Authentication token was not found.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}/staff`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          role: form.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "Staff could not be created."),
        );
      }

      const createdStaff = result.data.user as Staff;

      setStaff((current) => [
        createdStaff,
        ...current.filter((member) => member.id !== createdStaff.id),
      ]);

      setCreatedStaffEmail(createdStaff.email);
      setForm(emptyForm);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Staff could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Staff Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Staff
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage teachers and other school employees.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          loadStaff(search);
        }}
        className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone or role..."
            className="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-5 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Search
        </button>
      </form>

      {error && !showModal && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Staff Members
            </h2>

            <p className="text-sm text-slate-500">
              {staff.length} staff members
            </p>
          </div>

          <Users size={21} className="text-blue-600" />
        </div>

        {loading ? (
          <div className="flex justify-center gap-2 py-16 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading staff...
          </div>
        ) : staff.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={40} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              No staff members found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {staff.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-3 py-4 font-medium text-slate-900">
                      {member.name}
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      {member.email}
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      {member.phone || "—"}
                    </td>

                    <td className="px-3 py-4 text-sm capitalize text-slate-600">
                      {member.role.replaceAll("_", " ")}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          member.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Add Staff
                </h2>

                <p className="text-sm text-slate-500">
                  A password setup email will be sent automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {createdStaffEmail ? (
              <div className="p-6">
                <CheckCircle2
                  size={40}
                  className="text-emerald-600"
                />

                <h3 className="mt-3 font-semibold text-slate-900">
                  Staff created successfully
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  A password setup email was sent to:
                </p>

                <p className="mt-3 rounded-lg bg-slate-100 px-4 py-3 font-semibold text-slate-800">
                  {createdStaffEmail}
                </p>

                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={createStaff} className="space-y-4 p-6">
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <FormInput
                  label="Full name"
                  value={form.name}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      name: value,
                    }))
                  }
                />

                <FormInput
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      email: value,
                    }))
                  }
                />

                <FormInput
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      phone: value,
                    }))
                  }
                />

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Role
                  </span>

                  <select
                    required
                    value={form.role}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        role: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select role</option>

                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {submitting && (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    {submitting ? "Creating..." : "Create Staff"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormInput({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}
