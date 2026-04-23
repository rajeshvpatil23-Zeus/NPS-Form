import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentCycleResponseByEmail } from "@/lib/sheets";

const schema = z.object({
  email: z.string().email()
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = schema.parse({
      email: url.searchParams.get("email") ?? ""
    });

    const response = await getCurrentCycleResponseByEmail(parsed.email);
    if (!response) {
      return NextResponse.json(
        { found: false, error: "Response not found for current cycle." },
        { status: 404 }
      );
    }

    return NextResponse.json({ found: true, response }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Invalid request."
        : error instanceof Error
          ? error.message
          : "Unexpected error";
    return NextResponse.json({ found: false, error: message }, { status: 400 });
  }
}

