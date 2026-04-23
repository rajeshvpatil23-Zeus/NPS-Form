import { EmailGate } from "@/components/feedback/EmailGate";

export default function Page({
  searchParams
}: {
  searchParams?: { message?: string; demo?: string };
}) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-emerald-200/30 blur-3xl" />
      <EmailGate
        message={searchParams?.message}
        demoMode={searchParams?.demo === "1"}
      />
    </main>
  );
}

