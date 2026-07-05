import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
