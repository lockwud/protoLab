import Link from "next/link";
import { ArrowUpRight, BookOpen, GraduationCap, Plus, Search, UsersRound } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { listAllCourses, listCoursesForLecturer, listCoursesForStudent } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { CreateCourseForm } from "./create-course-form";
import { EnrollForm } from "./enroll-form";

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ q?: string; view?: string }> }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const allCourses =
    user.role === "LECTURER"
      ? await listCoursesForLecturer(user.id)
      : user.role === "ADMIN"
        ? await listAllCourses()
        : await listCoursesForStudent(user.id);
  const query = params.q?.trim().toLowerCase() ?? "";
  const view = params.view ?? "atlas";
  const courses = query
    ? allCourses.filter((course) =>
        [course.title, course.code, course.description ?? ""].some((value) => value.toLowerCase().includes(query))
      )
    : allCourses;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-5 border-b border-border p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Link href="/dashboard/student" className="hover:text-foreground">Workspace</Link>
                <span>/</span>
                <span className="font-medium text-foreground">Course Atlas</span>
              </div>
              <h1 className="font-display text-2xl font-semibold">Courses Atlas</h1>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
                Manage project-based learning spaces for software, IoT, Arduino, networking, and future engineering departments.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-md">{courses.length} active</Badge>
              <Badge variant="outline" className="rounded-md">{user.role.toLowerCase()}</Badge>
            </div>
          </div>

          <div className="grid gap-3 text-xs text-muted-foreground md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="space-y-3">
              <MetaRow label="Status" value="Active semester" />
              <MetaRow label="Description" value="Department-ready course spaces" />
              <MetaRow label="Assigned to" value={user.role === "STUDENT" ? user.name : "Lecturer cohort"} />
              <MetaRow label="Timeline" value="Course to repository" />
            </div>
            <div>
              <div>
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-foreground">Course workflow</span>
                  <span>{courses.length}/{allCourses.length} spaces connected</span>
                </div>
                <div className="flex h-2 gap-1">
                  {[0, 1, 2, 3, 4, 5].map((step) => (
                    <span key={step} className={`h-full flex-1 rounded-full ${courses.length > step ? "bg-accent" : "bg-muted"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid border-b border-border lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col justify-between gap-3 px-5 py-3 lg:flex-row lg:items-center">
            <div className="flex rounded-md border border-border bg-muted/30 p-1 text-[11px] font-medium">
              {["table", "atlas", "timeline"].map((tab) => (
                <Link
                  key={tab}
                  href={`/courses?view=${tab}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className={view === tab ? "rounded bg-card px-3 py-1 capitalize shadow-sm" : "px-3 py-1 capitalize text-muted-foreground hover:text-foreground"}
                >
                  {tab}
                </Link>
              ))}
            </div>
            <div className="flex gap-2">
              <form action="/courses" className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground">
                <Search aria-hidden="true" className="size-3.5" />
                <input name="q" defaultValue={query} placeholder="Search courses" className="w-32 bg-transparent outline-none placeholder:text-muted-foreground" />
                <input type="hidden" name="view" value={view} />
                <button type="submit" className="font-medium text-foreground">Go</button>
              </form>
              {query && <Link href={`/courses?view=${view}`} className="flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs hover:bg-muted">Clear</Link>}
            </div>
          </div>

          <aside className="border-t border-border p-4 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-md bg-accent text-accent-foreground">
                {user.role === "STUDENT" ? <GraduationCap aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}
              </span>
              <div>
                <h2 className="text-sm font-semibold">{user.role === "STUDENT" ? "Join a course" : "Create course space"}</h2>
                <p className="text-[11px] text-muted-foreground">Connected to the course backend.</p>
              </div>
            </div>
            {user.role === "LECTURER" && <CreateCourseForm />}
            {user.role === "STUDENT" && <EnrollForm />}
            {user.role === "ADMIN" && <p className="text-xs text-muted-foreground">Admins can monitor all course spaces from this view.</p>}
          </aside>
        </div>

        <div className="grid gap-3 p-4 lg:grid-cols-3">
          {courses.length === 0 && (
            <div className="lg:col-span-3 rounded-md border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
              No courses yet. Create or enroll in a course to unlock project tasks, prototype briefs, and supervised build work.
            </div>
          )}
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="rounded-md border border-border bg-background p-4 transition-colors hover:bg-muted/45">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">{course.title}</h2>
                  <p className="font-mono text-[11px] text-muted-foreground">{course.code}</p>
                </div>
                <ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-4 line-clamp-3 text-xs leading-5 text-muted-foreground">{course.description ?? "Project-based course workspace."}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <UsersRound aria-hidden="true" className="size-3.5" />
                  Cohort workspace
                </span>
                <Badge variant="outline">Open</Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[86px_minmax(0,1fr)] gap-3">
      <span className="flex items-center gap-1.5">
        <BookOpen aria-hidden="true" className="size-3" />
        {label}
      </span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </div>
  );
}
