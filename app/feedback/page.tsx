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
    <main className="relative min-h-dvh overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-20 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" />
      <FeedbackWizard
        email={searchParams?.email ?? ""}
        demoMode={searchParams?.demo === "1"}
        initialStudent={initialStudent}
      />
    </main>
  );
}

