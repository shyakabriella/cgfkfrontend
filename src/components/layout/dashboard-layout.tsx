"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import DashboardFooter from "./dashboard-footer";
import DashboardHeader from "./dashboard-header";
import DashboardSidebar from "./dashboard-sidebar";

export type DashboardUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  must_change_password: boolean;
  last_login_at: string | null;
};

type CurrentUserResponse = {
  success: boolean;
  message: string;
  data?: {
    user: DashboardUser;
  };
};

type DashboardLayoutProps = {
  children: ReactNode;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

function getAuthenticationToken() {
  return (
    localStorage.getItem("cgfk_auth_token") ||
    sessionStorage.getItem("cgfk_auth_token")
  );
}

function saveCurrentUser(currentUser: DashboardUser) {
  const storage = localStorage.getItem("cgfk_auth_token")
    ? localStorage
    : sessionStorage;

  storage.setItem("cgfk_user", JSON.stringify(currentUser));
}

function clearAuthentication() {
  localStorage.removeItem("cgfk_auth_token");
  localStorage.removeItem("cgfk_user");

  sessionStorage.removeItem("cgfk_auth_token");
  sessionStorage.removeItem("cgfk_user");
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const router = useRouter();

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      const token = getAuthenticationToken();

      if (!token) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/me`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const result: CurrentUserResponse = await response.json();

        if (!response.ok || !result.success || !result.data?.user) {
          throw new Error(
            result.message || "Your session is no longer valid."
          );
        }

        const currentUser = result.data.user;

        if (currentUser.status !== "active") {
          clearAuthentication();
          router.replace("/login");
          return;
        }

        if (currentUser.must_change_password) {
          router.replace("/change-password");
          return;
        }

        if (active) {
          saveCurrentUser(currentUser);
          setUser(currentUser);
          setLoading(false);
        }
      } catch {
        clearAuthentication();

        if (active) {
          setLoading(false);
        }

        router.replace("/login");
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef3fb]">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg">
            <Image
              src="/lo.png"
              alt="CGFK School logo"
              width={80}
              height={80}
              priority
              className="h-full w-full object-contain"
            />
          </div>

          <div className="mx-auto mt-6 h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-screen flex-col transition-all duration-300 lg:pl-72">
        <DashboardHeader
          user={user}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 px-4 py-7 sm:px-6 lg:px-8">
          {children}
        </main>

        <DashboardFooter />
      </div>
    </div>
  );
}
