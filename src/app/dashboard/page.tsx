"use client";

import AdminDashboard from "@/components/dashboard/admin-dashboard";
import StudentDashboard from "@/components/dashboard/student-dashboard";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("cgfk_user") ??
      sessionStorage.getItem("cgfk_user");

    if (!storedUser) {
      setRole("");
      return;
    }

    try {
      const user = JSON.parse(storedUser) as {
        role?: string;
      };

      setRole(user.role ?? "");
    } catch {
      setRole("");
    }
  }, []);

  if (role === null) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  if (role === "student") {
    return <StudentDashboard />;
  }

  return <AdminDashboard />;
}
