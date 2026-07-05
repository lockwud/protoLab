import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "LECTURER" ? "/dashboard/lecturer" : "/dashboard/student");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-24">
      <div className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-accent" />
        Innovation Learning &amp; Prototype Development
      </div>
      <h1 className="font-display max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
        Turn coursework into things that actually ship.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        ProtoLab is where students plan prototypes, get lecturer feedback, track milestones, and
        push real code to GitHub — all in one workspace.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button size="lg" asChild>
          <Link href="/register">Get started</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>

      <div className="mt-20 grid grid-cols-2 gap-6 border-t border-border pt-10 sm:grid-cols-4">
        {[
          ["01", "Plan", "AI-assisted prototype planning"],
          ["02", "Build", "Milestones + GitHub integration"],
          ["03", "Review", "Structured lecturer feedback"],
          ["04", "Ship", "Publish to the innovation repository"],
        ].map(([n, title, desc]) => (
          <div key={n}>
            <div className="font-mono text-xs text-accent-foreground/70">{n}</div>
            <div className="font-display mt-1 font-semibold">{title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
