"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, GraduationCap, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Role } from "@/types";

const roleOptions = [
  { value: "STUDENT" as Role, label: "Student", description: "Build coursework prototypes" },
  { value: "LECTURER" as Role, label: "Lecturer", description: "Review and guide teams" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");
  const [roleOpen, setRoleOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedRole = roleOptions.find((option) => option.value === role) ?? roleOptions[0];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create account.");
        return;
      }
      router.push(data.user.role === "LECTURER" ? "/dashboard/lecturer" : "/dashboard/student");
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
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription className="text-xs">Join ProtoLab and start shipping demo-ready coursework.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="name">Full name</Label>
            <div className="relative">
              <UserRound
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="name"
                required
                placeholder="Your name"
                className="h-9 rounded-lg bg-background/80 pl-9 text-xs shadow-sm backdrop-blur"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
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
                minLength={8}
                required
                placeholder="At least 8 characters"
                className="h-9 rounded-lg bg-background/80 pl-9 text-xs shadow-sm backdrop-blur"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="role">I am a</Label>
            <div className="relative">
              <button
                id="role"
                type="button"
                className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background/80 px-3 text-left text-xs shadow-sm backdrop-blur transition-colors hover:border-accent-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setRoleOpen((value) => !value)}
                aria-haspopup="listbox"
                aria-expanded={roleOpen}
              >
                <span className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    <GraduationCap aria-hidden="true" className="size-3.5" />
                  </span>
                  <span>
                    <span className="block font-medium">{selectedRole.label}</span>
                    <span className="block text-[10px] text-muted-foreground">{selectedRole.description}</span>
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={[
                    "size-4 text-muted-foreground transition-transform",
                    roleOpen ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>

              {roleOpen && (
                <div
                  className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl shadow-foreground/10"
                  role="listbox"
                  aria-labelledby="role"
                >
                  {roleOptions.map((option) => {
                    const active = option.value === role;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={[
                          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors",
                          active ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                        ].join(" ")}
                        onClick={() => {
                          setRole(option.value);
                          setRoleOpen(false);
                        }}
                        role="option"
                        aria-selected={active}
                      >
                        <span>
                          <span className="block font-medium">{option.label}</span>
                          <span className="block text-[10px] opacity-70">{option.description}</span>
                        </span>
                        <span className="grid size-5 place-items-center rounded-full border border-current/20">
                          {active && <Check aria-hidden="true" className="size-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="mx-auto mt-2 h-9 w-40 rounded-lg bg-accent text-xs font-semibold text-accent-foreground shadow-sm hover:bg-[#d8ff63]"
          >
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight aria-hidden="true" />}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
