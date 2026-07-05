import * as React from "react";
import { cn } from "@/lib/utils";

function Avatar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-secondary text-secondary-foreground font-display text-sm font-semibold",
        className
      )}
    >
      {children}
    </div>
  );
}
export { Avatar };
