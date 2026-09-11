import {
  RegisteredStudent,
  SchoolClass,
} from "@/services/student.service";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

function getToken() {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function message(result: unknown, fallback: string) {
  if (!result || typeof result !== "object") return fallback;

  const response = result as {
    message?: string;
    errors?: Record<string, string[]>;
  };

  return response.errors
    ? Object.values(response.errors).flat().join(" ")
    : response.message ?? fallback;
}

async function request(path: string) {
  const token = getToken();

  if (!token) {
    throw new Error("Unauthenticated. Please log in again.");
  }

  let response: Response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error(
      "Failed to connect to the backend server.",
    );
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      message(result, "Finance information could not be loaded."),
    );
  }

  return result;
}

export type FinanceClass = SchoolClass & {
  students_count?: number;
};

export async function getFinanceClasses(): Promise<
  FinanceClass[]
> {
  const result = await request("/finance/classes");

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  return [];
}

export async function getFinanceClassStudents(
  classId: number,
): Promise<{
  schoolClass: FinanceClass;
  students: RegisteredStudent[];
}> {
  const result = await request(
    `/finance/classes/${classId}/students`,
  );

  return {
    schoolClass: result.data.school_class,
    students: result.data.students ?? [],
  };
}
