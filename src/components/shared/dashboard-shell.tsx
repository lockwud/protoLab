"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarClock,
  Check,
  CircuitBoard,
  ClipboardCheck,
  FileImage,
  FolderKanban,
  GraduationCap,
  HardDriveUpload,
  LayoutDashboard,
  Library,
  LogOut,
  Moon,
  Package,
  Palette,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./search-bar";
import { cn } from "@/lib/utils";
import type { Notification, PublicUser } from "@/types";

const STUDENT_NAV = [
  { href: "/dashboard/student", label: "Overview", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/assignments", label: "Project Tasks", icon: FolderKanban },
  { href: "/build-lab", label: "Build Lab", icon: CircuitBoard },
  { href: "/projects", label: "Prototypes", icon: Rocket },
  { href: "/repository", label: "Innovation Repository", icon: Library },
];

const LECTURER_NAV = [
  { href: "/dashboard/lecturer", label: "Overview", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/assignments", label: "Project Tasks", icon: FolderKanban },
  { href: "/build-lab", label: "Build Lab", icon: CircuitBoard },
  { href: "/projects", label: "Student Prototypes", icon: GraduationCap },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/repository", label: "Innovation Repository", icon: Library },
];

const RESOURCE_NAV = [
  { href: "/resources/media-assets", label: "Media Assets", icon: FileImage },
  { href: "/resources/lab-templates", label: "Lab Templates", icon: HardDriveUpload },
  { href: "/resources/circuit-parts", label: "Circuit Parts", icon: Package },
  { href: "/resources/design-systems", label: "Design Systems", icon: Palette },
  { href: "/resources/guides", label: "Guides", icon: ClipboardCheck },
];

export function DashboardShell({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = user.role === "LECTURER" ? LECTURER_NAV : STUDENT_NAV;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [auditMode, setAuditMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const unread = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    let cancelled = false;
    async function loadNotifications() {
      setNotificationsLoading(true);
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setNotifications(data.notifications ?? []);
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    }
    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function markRead(id: string) {
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-card/92 px-4 py-6 backdrop-blur">
        <Link href="/" className="font-display px-2 text-lg font-semibold">
          ProtoLab
        </Link>
        <div className="mt-8 px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Main menu</div>
        <nav className="mt-2 flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-7 flex items-center justify-between px-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Resources</div>
          <Link href="/resources/media-assets" className="text-muted-foreground hover:text-foreground" aria-label="Add resource">
            +
          </Link>
        </div>
        <nav className="mt-2 flex flex-col gap-1">
          {RESOURCE_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-medium transition-colors",
                  active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">System</div>
          <div className="mt-2 flex flex-col gap-1">
            <button
              type="button"
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                auditMode ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => setAuditMode((value) => !value)}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                Audit mode
              </span>
              <span className={cn("h-4 w-7 rounded-full p-0.5 transition-colors", auditMode ? "bg-accent" : "bg-muted")}>
                <span className={cn("block size-3 rounded-full bg-card transition-transform", auditMode && "translate-x-3")} />
              </span>
            </button>
            <Link href="/settings" className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-medium transition-colors",
              pathname === "/settings" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
              <Settings aria-hidden="true" className="size-3.5" />
              Settings
            </Link>
            <Link href="/quiet-display" className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-medium transition-colors",
              pathname === "/quiet-display" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
              <Moon aria-hidden="true" className="size-3.5" />
              Quiet display
            </Link>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pl-64">
        <header className="sticky top-0 z-10 border-b border-border/70 bg-background/82 px-6 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {user.role === "LECTURER" ? "Lecturer command center" : "Student build desk"}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles aria-hidden="true" className="size-4 text-accent-foreground" />
                Ship prototypes, track feedback, and keep momentum visible.
                {auditMode && (
                  <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase text-secondary-foreground">
                    Audit
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SearchBar />
              <Button asChild size="sm" variant="outline" className="h-8 bg-card text-[11px]">
                <Link href="/assignments">
                  <CalendarClock aria-hidden="true" />
                  Project Tasks
                </Link>
              </Button>
              {user.role === "LECTURER" ? (
                <Button asChild size="sm" className="h-8 bg-foreground text-[11px] text-background hover:bg-foreground/90">
                  <Link href="/courses">
                    <BookOpen aria-hidden="true" />
                    Create course
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" className="h-8 bg-foreground text-[11px] text-background hover:bg-foreground/90">
                  <Link href="/projects/new">
                    <Rocket aria-hidden="true" />
                    New prototype
                  </Link>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="relative size-8 rounded-full bg-card/80"
                aria-label="Notifications"
                onClick={() => setNotificationsOpen(true)}
              >
                <Bell aria-hidden="true" className="size-4" />
                {unread > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />}
              </Button>
              <div className="relative">
                <button
                  type="button"
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Open profile menu"
                  onClick={() => setProfileOpen((open) => !open)}
                >
                  <Avatar className="size-8">{user.name.slice(0, 1).toUpperCase()}</Avatar>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-11 z-30 w-56 rounded-md border border-border bg-card p-2 shadow-xl">
                    <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                      <Avatar className="size-8">{user.name.slice(0, 1).toUpperCase()}</Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">{user.name}</div>
                        <div className="font-mono text-[10px] uppercase text-muted-foreground">{user.role}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 w-full justify-start text-[11px]" onClick={signOut}>
                      <LogOut aria-hidden="true" className="size-3.5" />
                      Sign out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-5">{children}</main>
      </div>

      {notificationsOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/18 backdrop-blur-sm"
            aria-label="Close notifications"
            onClick={() => setNotificationsOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-xs flex-col border-l border-border bg-card/92 shadow-2xl shadow-foreground/20 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 border-b border-border p-3">
              <div>
                <h2 className="font-display text-sm font-semibold">Notifications</h2>
              </div>
              <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => setNotificationsOpen(false)}>
                <X aria-hidden="true" className="size-3.5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {notificationsLoading && <p className="text-xs text-muted-foreground">Loading notifications...</p>}
              {!notificationsLoading && notifications.length === 0 && (
                <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-muted-foreground">
                  You&apos;re all caught up.
                </div>
              )}
              <div className="flex flex-col gap-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-md border border-border bg-background/70 p-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium">{notification.title}</div>
                        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{notification.message}</p>
                      </div>
                      {!notification.read && <span className="mt-1 size-2 rounded-full bg-accent" />}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">{formatNotificationDate(notification.createdAt)}</span>
                      <div className="flex gap-2">
                        {notification.link && (
                          <Button asChild variant="outline" size="sm" className="h-7 rounded-md px-2 text-[10px]">
                            <Link href={notification.link} onClick={() => setNotificationsOpen(false)}>
                              Open
                            </Link>
                          </Button>
                        )}
                        {!notification.read && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 rounded-md px-2 text-[10px]"
                            onClick={() => markRead(notification.id)}
                          >
                            <Check aria-hidden="true" className="size-3" />
                            Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function formatNotificationDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
