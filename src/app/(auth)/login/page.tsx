"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GitBranch, Mail, LockKeyhole, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const oauthError = searchParams.get("error");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not sign in.");
        return;
      }
      const next = searchParams.get("next");
      router.push(next ?? (data.user.role === "LECTURER" ? "/dashboard/lecturer" : "/dashboard/student"));
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pb-5">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription className="text-xs">Sign in to plan, build, review, and ship your next prototype.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Button
          type="button"
          variant="outline"
          className="mb-5 h-9 w-full rounded-lg border-foreground/10 bg-background/80 text-xs shadow-sm backdrop-blur hover:border-accent-foreground/30 hover:bg-muted"
          asChild
        >
          <Link href={`/api/auth/github${searchParams.get("next") ? `?next=${encodeURIComponent(searchParams.get("next") ?? "")}` : ""}`}>
            <GitBranch aria-hidden="true" />
            Continue with GitHub
          </Link>
        </Button>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail aria-hidden="true" className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                className="h-9 rounded-lg bg-background/80 pl-9 text-xs shadow-sm backdrop-blur"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="password"
                type="password"
                required
                placeholder="Enter your password"
                className="h-9 rounded-lg bg-background/80 pl-9 text-xs shadow-sm backdrop-blur"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="flex w-fit items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setRememberMe((value) => !value)}
            aria-pressed={rememberMe}
          >
            <span
              className={[
                "grid size-4 place-items-center rounded-full border transition-colors",
                rememberMe ? "border-accent-foreground bg-accent" : "border-foreground/20 bg-background/80",
              ].join(" ")}
              aria-hidden="true"
            >
              <span
                className={[
                  "size-1.5 rounded-full bg-accent-foreground transition-opacity",
                  rememberMe ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
            </span>
            Remember me
          </button>
          {(error || oauthError) && <p className="text-sm text-destructive">{error ?? oauthErrorMessage(oauthError)}</p>}
          <div className="mt-2 flex items-center justify-center gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="h-9 w-36 rounded-lg bg-accent text-xs font-semibold text-accent-foreground shadow-sm hover:bg-[#d8ff63]"
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight aria-hidden="true" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-lg px-3 text-xs text-primary hover:bg-muted"
              asChild
            >
              <Link href="/reset-password">Reset password</Link>
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function oauthErrorMessage(error: string | null) {
  if (error === "github_not_configured") return "GitHub sign-in is not configured yet. Add the OAuth client ID and secret to .env.";
  if (error === "github_email_unavailable") return "GitHub did not return a verified email address for this account.";
  if (error === "invalid_state") return "GitHub sign-in expired. Please try again.";
  if (error === "database_unavailable") return "Database is unavailable. Please check Postgres and try again.";
  return "GitHub sign-in failed. Please try again.";
}
