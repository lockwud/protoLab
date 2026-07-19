import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(user.role === "LECTURER" ? "/dashboard/lecturer" : "/dashboard/student");
}
