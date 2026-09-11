export type Teacher = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
};

export type SchoolClass = {
  id: number;
  name: string;
  code: string;
  representative_teacher_id?: number | null;
  representative_teacher?: Teacher | null;
};

export type Course = {
  id: number;
  name: string;
  code: string;
  hours?: number;
  periods?: number;
};

export type TeacherAssignment = {
  id: number;
  teacher_id: number;
  school_class_id: number;
  course_id: number;
  status: "active" | "inactive";
  teacher?: Teacher;
  school_class?: SchoolClass;
  course?: Course;
};

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

function getToken() {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function extractData<T>(result: unknown): T {
  if (
    result &&
    typeof result === "object" &&
    "data" in result
  ) {
    return (result as { data: T }).data;
  }

  return result as T;
}

function extractList<T>(result: unknown): T[] {
  const data = extractData<unknown>(result);

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: T[] }).data;
  }

  return [];
}

function extractError(result: unknown, fallback: string) {
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

async function apiRequest(
  path: string,
  options: RequestInit = {},
) {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication token was not found. Please log in again.");
  }

  let response: Response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Failed to connect to the backend. Confirm that Laravel is running.",
    );
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthenticated. Please log in again.");
    }

    throw new Error(
      extractError(result, `Request failed with status ${response.status}.`),
    );
  }

  return result;
}

export async function getTeacherAssignments() {
  const result = await apiRequest("/teacher-assignments?per_page=100");

  return extractList<TeacherAssignment>(result);
}

export async function getTeachers() {
  const result = await apiRequest("/teachers");

  return extractList<Teacher>(result).filter(
    (staff) => staff.role === "teacher",
  );
}

export async function getAssignmentClasses() {
  const result = await apiRequest("/school-classes?per_page=100");

  return extractList<SchoolClass>(result);
}

export async function getAssignmentCourses() {
  const result = await apiRequest("/courses?per_page=100");

  return extractList<Course>(result);
}

export async function createTeacherAssignment(payload: {
  teacher_id: number;
  school_class_id: number;
  course_id: number;
}) {
  const result = await apiRequest("/teacher-assignments", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      status: "active",
    }),
  });

  return extractData<TeacherAssignment>(result);
}

export async function deleteTeacherAssignment(id: number) {
  await apiRequest(`/teacher-assignments/${id}`, {
    method: "DELETE",
  });
}

export async function assignClassRepresentative(
  schoolClassId: number,
  teacherId: number,
) {
  const result = await apiRequest(
    `/school-classes/${schoolClassId}/representative`,
    {
      method: "PUT",
      body: JSON.stringify({
        representative_teacher_id: teacherId,
      }),
    },
  );

  return extractData<SchoolClass>(result);
}
