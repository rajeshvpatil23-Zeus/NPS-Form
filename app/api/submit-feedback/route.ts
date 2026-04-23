import { NextResponse } from "next/server";
import { z } from "zod";

import {
  appendResponse,
  appendSubmitted,
  getCurrentCycle,
  getStudentByEmail,
  hasSubmitted
} from "@/lib/sheets";

const ratingsSchema = z.object({
  faculty: z.number().int().min(1).max(5),
  ta: z.number().int().min(1).max(5),
  coordinator: z.number().int().min(1).max(5),
  lms: z.number().int().min(1).max(5),
  ticketing: z.number().int().min(1).max(5)
});

const bodySchema = z.object({
  demo: z.boolean().optional().default(false),
  email: z.string().email(),
  nps_score: z.number().int().min(0).max(10),
  grid_ratings: ratingsSchema,
  challenges: z.array(z.string()).default([]),
  open_text: z.string().default("")
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const cycle = getCurrentCycle();
    if (body.demo) {
      return NextResponse.json(
        { success: true, name: "Demo Student", cycle },
        { status: 200 }
      );
    }

    const student = await getStudentByEmail(body.email);

    if (!student) {
      return NextResponse.json(
        { error: "This email is not registered." },
        { status: 404 }
      );
    }

    if (await hasSubmitted(student.email, cycle)) {
      return NextResponse.json(
        { error: `You have already submitted feedback for ${cycle}.` },
        { status: 409 }
      );
    }

    await appendResponse(student.batch_name, cycle, {
      submitted_at: new Date().toISOString(),
      email: student.email,
      student_code: student.student_code,
      name: student.name,
      batch_name: student.batch_name,
      phone_number: student.phone_number,
      nps_score: body.nps_score,
      faculty_rating: body.grid_ratings.faculty,
      ta_rating: body.grid_ratings.ta,
      coordinator_rating: body.grid_ratings.coordinator,
      lms_rating: body.grid_ratings.lms,
      ticketing_rating: body.grid_ratings.ticketing,
      challenges_selected: body.challenges.join(", "),
      open_text_answer: body.open_text
    });

    await appendSubmitted(student.email, student.batch_name, cycle);

    return NextResponse.json(
      { success: true, name: student.name, cycle },
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

