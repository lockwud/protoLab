"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/types";

const STUDENT_NAV = [
  { href: "/dashboard/student", label: "Overview" },
  { href: "/courses", label: "Courses" },
  { href: "/assignments", label: "Assignments" },
  { href: "/projects", label: "Prototypes" },
  { href: "/repository", label: "Innovation Repository" },
  { href: "/notifications", label: "Notifications" },
];

const LECTURER_NAV = [
  { href: "/dashboard/lecturer", label: "Overview" },
  { href: "/courses", label: "Courses" },
  { href: "/assignments", label: "Assignments" },
  { href: "/projects", label: "Student Prototypes" },
  { href: "/analytics", label: "Analytics" },
  { href: "/repository", label: "Innovation Repository" },
  { href: "/notifications", label: "Notifications" },
];

export function DashboardShell({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = user.role === "LECTURER" ? LECTURER_NAV : STUDENT_NAV;

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6">
        <Link href="/" className="font-display px-2 text-lg font-semibold">
          ProtoLab
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-md border border-border p-3">
          <Avatar>{user.name.slice(0, 1).toUpperCase()}</Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="font-mono text-[11px] uppercase text-muted-foreground">{user.role}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="mt-2" onClick={signOut}>
          Sign out
        </Button>
      </aside>
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
