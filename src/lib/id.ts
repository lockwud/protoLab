import { randomBytes } from "crypto";

// Lightweight cuid-like id generator (no extra dependency needed).
export function createId(prefix = ""): string {
  const time = Date.now().toString(36);
  const rand = randomBytes(8).toString("hex");
  return `${prefix}${time}${rand}`;
}
