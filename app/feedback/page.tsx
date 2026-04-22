import { FeedbackWizard } from "@/components/feedback/FeedbackWizard";

export default function FeedbackPage({
  searchParams
}: {
  searchParams?: {
    email?: string;
    batch?: string;
    demo?: string;
    cycle?: string;
    name?: string;
    student_code?: string;
    phone_number?: string;
  };
}) {
  const initialStudent =
    searchParams?.email &&
    searchParams?.name &&
    searchParams?.batch &&
    searchParams?.student_code
      ? {
          found: true as const,
          already_submitted: false as const,
          cycle: searchParams.cycle ?? "",
          name: searchParams.name,
          batch_name: searchParams.batch,
          student_code: searchParams.student_code,
          phone_number: searchParams.phone_number ?? "",
          email: searchParams.email
        }
      : null;

  return (
    <main className="min-h-dvh bg-white px-4 py-8">
      <FeedbackWizard
        email={searchParams?.email ?? ""}
        demoMode={searchParams?.demo === "1"}
        initialStudent={initialStudent}
      />
    </main>
  );
}

