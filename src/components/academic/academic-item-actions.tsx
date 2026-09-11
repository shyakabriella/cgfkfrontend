"use client";

import {
  LoaderCircle,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";

type Resource =
  | "departments"
  | "department-programs"
  | "school-classes";

type AcademicItem = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  status?: "active" | "inactive";
  is_active?: boolean;
  type?: "trade" | "option";
  level?: string | null;
  department_id?: number;
  department_program_id?: number;
};

type Props = {
  resource: Resource;
  item: AcademicItem;
};

type EditForm = {
  name: string;
  code: string;
  description: string;
  status: "active" | "inactive";
  type: "trade" | "option";
  level: string;
};

const resourceNames: Record<Resource, string> = {
  departments: "Department",
  "department-programs": "Trade / Option",
  "school-classes": "Class",
};

function getToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
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

  return response.message ?? fallback;
}

export default function AcademicItemActions({
  resource,
  item,
}: Props) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<EditForm>({
    name: item.name,
    code: item.code,
    description: item.description ?? "",
    status:
      item.status ??
      (item.is_active === false ? "inactive" : "active"),
    type: item.type ?? "trade",
    level: item.level ?? "",
  });

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:8000/api";

  const resourceName = resourceNames[resource];

  function closeModal() {
    if (saving) return;

    setShowEditModal(false);
    setError("");
  }

  async function updateItem(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError("Unauthenticated. Please log in again.");
      return;
    }

    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      status: form.status,
    };

    if (resource === "department-programs") {
      payload.department_id = item.department_id;
      payload.type = form.type;
    }

    if (resource === "school-classes") {
      payload.department_program_id =
        item.department_program_id;
      payload.level = form.level.trim() || null;
    }

    try {
      const response = await fetch(
        `${apiUrl}/${resource}/${item.id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            `${resourceName} could not be updated.`,
          ),
        );
      }

      setShowEditModal(false);
      window.location.reload();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : `${resourceName} could not be updated.`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"?`,
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      window.alert("Unauthenticated. Please log in again.");
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `${apiUrl}/${resource}/${item.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            `${resourceName} could not be deleted.`,
          ),
        );
      }

      window.location.reload();
    } catch (exception) {
      window.alert(
        exception instanceof Error
          ? exception.message
          : `${resourceName} could not be deleted.`,
      );

      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => {
            setError("");
            setShowEditModal(true);
          }}
          title={`Edit ${resourceName.toLowerCase()}`}
          aria-label={`Edit ${item.name}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Pencil size={16} />
        </button>

        <button
          type="button"
          onClick={deleteItem}
          disabled={deleting}
          title={`Delete ${resourceName.toLowerCase()}`}
          aria-label={`Delete ${item.name}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
          {deleting ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Edit {resourceName}
                </h2>

                <p className="text-sm text-slate-500">
                  Update the information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close edit modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={updateItem}
              className="space-y-4 p-5"
            >
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <EditInput
                label="Name"
                value={form.name}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    name: value,
                  }))
                }
              />

              <EditInput
                label="Code"
                value={form.code}
                uppercase
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    code: value,
                  }))
                }
              />

              {resource === "department-programs" && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Type
                  </span>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value as
                          | "trade"
                          | "option",
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="trade">Trade</option>
                    <option value="option">Option</option>
                  </select>
                </label>
              )}

              {resource === "school-classes" && (
                <EditInput
                  label="Level"
                  value={form.level}
                  required={false}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      level: value,
                    }))
                  }
                />
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </span>

                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Status
                </span>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as
                        | "active"
                        | "inactive",
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={16} />
                  )}

                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function EditInput({
  label,
  value,
  uppercase = false,
  required = true,
  onChange,
}: {
  label: string;
  value: string;
  uppercase?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        required={required}
        value={value}
        onChange={(event) =>
          onChange(
            uppercase
              ? event.target.value.toUpperCase()
              : event.target.value,
          )
        }
        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}
