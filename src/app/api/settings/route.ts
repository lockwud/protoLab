import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { getUserNotificationSettings, createOrUpdateUserNotificationSettings } from "@/lib/data";
import { DatabaseUnavailableError } from "@/lib/db";

const updateSchema = z.object({
  feedbackNotifications: z.boolean().optional(),
  milestoneNotifications: z.boolean().optional(),
  taskNotifications: z.boolean().optional(),
  githubIntegration: z.boolean().optional(),
  auditMode: z.boolean().optional(),
});

export async function GET() {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await getUserNotificationSettings(session.userId);
    
    // Return default settings if not yet created
    if (!settings) {
      return NextResponse.json({
        id: null,
        userId: session.userId,
        feedbackNotifications: true,
        milestoneNotifications: true,
        taskNotifications: false,
        githubIntegration: false,
        auditMode: false,
      });
    }
    
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const settings = await createOrUpdateUserNotificationSettings(session.userId, parsed.data);
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update settings." }, { status: 500 });
  }
}
