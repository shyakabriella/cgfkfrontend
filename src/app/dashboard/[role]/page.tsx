import RoleDashboard, {
  isDashboardRole,
} from "@/components/dashboard/role-dashboard";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    role: string;
  }>;
};

export default async function DashboardRolePage({
  params,
}: Props) {
  const { role } = await params;

  if (!isDashboardRole(role)) {
    notFound();
  }

  return <RoleDashboard role={role} />;
}
