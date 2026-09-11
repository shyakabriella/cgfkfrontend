import {
  RegisteredStudent,
  SchoolClass,
} from "@/services/student.service";

export type FinanceClass = SchoolClass & {
  students_count?: number;
};

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

function getMessage(result: unknown, fallback: string) {
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

  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getMessage(
        result,
        "Finance information could not be loaded.",
      ),
    );
  }

  return result;
}

export async function getFinanceClasses(): Promise<
  FinanceClass[]
> {
  const result = await request("/finance/classes");

  return Array.isArray(result?.data)
    ? result.data
    : [];
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
