import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyStudentSubmissionState } from "@/lib/sheets";

const schema = z.object({
  identifier: z.string().trim().min(1)
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const result = await verifyStudentSubmissionState(body.identifier);

    if (!result.found) {
      return NextResponse.json(
        {
          found: false,
          already_submitted: false,
          message:
            "This email, student code, or phone number is not registered. Please use a registered identifier."
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

