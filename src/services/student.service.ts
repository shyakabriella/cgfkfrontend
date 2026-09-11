export type RwandaLocation = {
  id: number;
  parent_id: number | null;
  name: string;
  type: "province" | "district" | "sector" | "cell" | "village";
};

export type SchoolClass = {
  id: number;
  name: string;
  code: string;
  level?: string | null;
  status: "active" | "inactive";
  program?: {
    id: number;
    name: string;
    code: string;
    type: "trade" | "option";
    department?: {
      id: number;
      name: string;
      code: string;
    };
  };
};

export type RegisteredStudent = {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  father_name?: string | null;
  mother_name?: string | null;
  parent_contact: string;
  guardian_name?: string | null;
  guardian_contact?: string | null;
  guardian_relationship?: string | null;
  previous_school_name?: string | null;
  school_class_id?: number;
  date_of_birth?: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  image_url?: string | null;
  status: string;
  school_class?: {
    id: number;
    name: string;
    code: string;
    level?: string | null;
    program?: {
      id: number;
      name: string;
      code: string;
      department?: {
        id: number;
        name: string;
        code: string;
      };
    };
  };
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("cgfk_auth_token") ??
    sessionStorage.getItem("cgfk_auth_token")
  );
}

async function request(url: string, options: RequestInit = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication token was not found.");
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const validationErrors = result?.errors
      ? Object.values(result.errors).flat().join(" ")
      : null;

    throw new Error(
      validationErrors ||
        result?.message ||
        "The request could not be completed.",
    );
  }

  return result;
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

export async function getClasses(): Promise<SchoolClass[]> {
  const result = await request(
    "/school-classes?status=active&per_page=100",
  );

  return extractList<SchoolClass>(result);
}

export async function getLocations(
  type: RwandaLocation["type"],
  parentId?: number,
): Promise<RwandaLocation[]> {
  const parameters = new URLSearchParams({ type });

  if (parentId) {
    parameters.set("parent_id", String(parentId));
  }

  const result = await request(
    `/rwanda-locations?${parameters.toString()}`,
  );

  return extractList<RwandaLocation>(result);
}


export async function getStudents(filters?: {
  search?: string;
  schoolClassId?: number;
}): Promise<RegisteredStudent[]> {
  const parameters = new URLSearchParams({
    status: "active",
    per_page: "100",
  });

  if (filters?.search) {
    parameters.set("search", filters.search);
  }

  if (filters?.schoolClassId) {
    parameters.set(
      "school_class_id",
      String(filters.schoolClassId),
    );
  }

  const result = await request(
    `/students?${parameters.toString()}`,
  );

  return extractList<RegisteredStudent>(result);
}

export async function registerStudent(
  formData: FormData,
): Promise<RegisteredStudent> {
  const result = await request("/students", {
    method: "POST",
    body: formData,
  });

  return result.data ?? result;
}

export async function updateStudent(
  studentId: number,
  formData: FormData,
): Promise<RegisteredStudent> {
  // Laravel handles multipart updates reliably through method spoofing.
  formData.set("_method", "PUT");

  const result = await request(`/students/${studentId}`, {
    method: "POST",
    body: formData,
  });

  return result.data ?? result;
}
