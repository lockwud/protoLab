import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/session";
import { featureFlags } from "@/lib/env";

export async function GET() {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ enabled: featureFlags.githubEnabled });
}
