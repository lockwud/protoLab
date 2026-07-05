import { getCurrentUser } from "@/lib/session";
import { listNotificationsForUser } from "@/lib/data";
import { NotificationList } from "./notification-list";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const notifications = await listNotificationsForUser(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Module 12</p>
      <h1 className="font-display mt-1 text-3xl font-semibold">Notifications</h1>
      <div className="mt-8">
        <NotificationList initial={notifications} />
      </div>
    </div>
  );
}
