"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MailPlus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type PrototypeActionProps = {
  title: string;
  summary?: string;
  projectId?: string;
  variant?: "icon" | "button";
};

export function PrototypeShareButton({ title, summary, projectId, variant = "button" }: PrototypeActionProps) {
  const [copied, setCopied] = useState(false);
  const url = usePrototypeUrl(projectId);

  async function share() {
    const payload = {
      title,
      text: summary ?? "View this ProtoLab prototype.",
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  if (variant === "icon") {
    return (
      <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Share prototype" onClick={share}>
        {copied ? <Check aria-hidden="true" className="size-4" /> : <Share2 aria-hidden="true" className="size-4" />}
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" className="h-8 text-[11px]" onClick={share}>
      {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Share2 aria-hidden="true" className="size-3.5" />}
      {copied ? "Copied" : "Share"}
    </Button>
  );
}

export function PrototypeInviteButton({ title, projectId, variant = "button" }: PrototypeActionProps) {
  const [copied, setCopied] = useState(false);
  const url = usePrototypeUrl(projectId);

  async function invite() {
    const message = `Join my ProtoLab prototype review: ${title}\n${url}`;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button type="button" variant={variant === "icon" ? "ghost" : "outline"} size={variant === "icon" ? "icon" : "sm"} className={variant === "icon" ? "size-8" : "h-8 text-[11px]"} onClick={invite}>
      {copied ? <Check aria-hidden="true" className="size-3.5" /> : variant === "icon" ? <Copy aria-hidden="true" className="size-4" /> : <MailPlus aria-hidden="true" className="size-3.5" />}
      {variant === "button" && (copied ? "Invite copied" : "Invite")}
    </Button>
  );
}

function usePrototypeUrl(projectId?: string) {
  return useMemo(() => {
    if (typeof window === "undefined") return projectId ? `/projects/${projectId}` : "/projects";
    const origin = window.location.origin;
    return projectId ? `${origin}/projects/${projectId}` : window.location.href;
  }, [projectId]);
}
