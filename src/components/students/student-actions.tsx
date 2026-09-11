"use client";

import {
  LoaderCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  RegisteredStudent,
} from "@/services/student.service";

type Props = {
  student: RegisteredStudent;
  onEdit: (student: RegisteredStudent) => void;
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

export default function StudentActions({
  student,
  onEdit,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  async function deleteStudent() {
    const confirmed = window.confirm(
      `Delete ${student.first_name} ${student.last_name}?`,
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
        `${apiUrl}/students/${student.id}`,
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
            "Student could not be deleted.",
          ),
        );
      }

      window.location.reload();
    } catch (exception) {
      window.alert(
        exception instanceof Error
          ? exception.message
          : "Student could not be deleted.",
      );

      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(student)}
        title="Edit student"
        aria-label={`Edit ${student.first_name}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <Pencil size={16} />
      </button>

      <button
        type="button"
        onClick={deleteStudent}
        disabled={deleting}
        title="Delete student"
        aria-label={`Delete ${student.first_name}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
      >
        {deleting ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <Trash2 size={16} />
        )}
      </button>
    </div>
  );
}
