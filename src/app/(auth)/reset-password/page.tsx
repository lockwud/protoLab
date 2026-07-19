"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to request password reset.");
        return;
      }
      setMessage(data.message);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pb-5">
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription className="text-xs">Enter your email and we&apos;ll help you get back into ProtoLab.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
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
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="mx-auto mt-2 h-9 w-36 rounded-lg bg-accent text-xs font-semibold text-accent-foreground shadow-sm hover:bg-[#d8ff63]"
          >
            {loading ? "Sending..." : "Continue"}
          </Button>
        </form>
        <Link href="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
