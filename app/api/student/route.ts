import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyStudentSubmissionState } from "@/lib/sheets";

const schema = z.object({
  email: z.string().email()
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = schema.parse({
      email: url.searchParams.get("email") ?? ""
    });

    const result = await verifyStudentSubmissionState(parsed.email);
    if (!result.found) {
      return NextResponse.json(
        {
          found: false,
          already_submitted: false,
          message:
            "This email is not registered. Please use your registered email ID."
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        found: true,
        already_submitted: result.already_submitted,
        cycle: result.cycle,
        name: result.student.name,
        batch_name: result.student.batch_name,
        student_code: result.student.student_code,
        phone_number: result.student.phone_number,
        email: result.student.email
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Invalid request."
        : error instanceof Error
          ? error.message
          : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

