"use client";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

export function NotificationList({ initial }: { initial: Notification[] }) {
  const [notifications, setNotifications] = useState(initial);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  if (notifications.length === 0) {
    return <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">You&apos;re all caught up.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((n) => {
        const content = (
          <div
            className={cn(
              "flex items-start justify-between gap-3 rounded-md border border-border p-3 text-sm",
              !n.read && "bg-secondary/40"
            )}
          >
            <div>
              <div className="font-medium">{n.title}</div>
              <div className="text-muted-foreground">{n.message}</div>
            </div>
            <Badge variant={n.read ? "outline" : "default"}>{n.type}</Badge>
          </div>
        );
        return (
          <div key={n.id} onClick={() => !n.read && markRead(n.id)}>
            {n.link ? <Link href={n.link}>{content}</Link> : content}
          </div>
        );
      })}
    </div>
  );
}
