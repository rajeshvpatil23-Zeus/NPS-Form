import { EmailGate } from "@/components/EmailGate";

export default function Page({
  searchParams
}: {
  searchParams?: { message?: string; demo?: string };
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 py-10">
      <EmailGate
        message={searchParams?.message}
        demoMode={searchParams?.demo === "1"}
      />
    </main>
  );
}

