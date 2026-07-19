import { NextResponse } from "next/server";
import { z } from "zod";
import { queryOne, DatabaseUnavailableError } from "@/lib/db";
import { notify } from "@/lib/data";

const schema = z.object({ email: z.string().email("Enter a valid email address") });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const user = await queryOne<{ id: string }>(`SELECT id FROM "User" WHERE email = $1`, [parsed.data.email]);
    if (user) {
      await notify(
        user.id,
        "Password reset requested",
        "A password reset was requested for your ProtoLab account. Contact your administrator if this was not you.",
        "SYSTEM",
        "/settings"
      );
    }

    return NextResponse.json({
      message: "If that account exists, a reset request has been recorded and the user will be notified in ProtoLab.",
    });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to request password reset." }, { status: 500 });
  }
}
