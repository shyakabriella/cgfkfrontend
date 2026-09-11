export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "excused";

export type AttendanceAssignment = {
  id: number;
  teacher_id: number;
  school_class_id: number;
  course_id: number;
  status: "active" | "inactive";
  school_class?: {
    id: number;
    name: string;
    code: string;
  };
  course?: {
    id: number;
    name: string;
    code: string;
  };
};

export type AttendanceStudent = {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  image?: string | null;
};

export type StudentAttendance = {
  student_id: number;
  status: AttendanceStatus;
  remarks: string;
};

export type SaveAttendancePayload = {
  teacher_assignment_id: number;
  school_class_id: number;
  course_id: number;
  attendance_date: string;
  students: StudentAttendance[];
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
    throw new Error("Unauthenticated. Please log in again.");
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
      extractError(
        result,
        `Request failed with status ${response.status}.`,
      ),
    );
  }

  return result;
}

export async function getMyTeachingAssignments() {
  const result = await apiRequest(
    "/teacher-assignments?status=active&per_page=100",
  );

  return extractList<AttendanceAssignment>(result);
}

export async function getClassStudents(schoolClassId: number) {
  const result = await apiRequest(
    `/students?school_class_id=${schoolClassId}&per_page=200`,
  );

  return extractList<AttendanceStudent>(result);
}

export async function saveAttendance(
  payload: SaveAttendancePayload,
) {
  const result = await apiRequest("/attendances", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return extractData(result);
}
