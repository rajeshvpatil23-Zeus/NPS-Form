import { SuccessScreen } from "@/components/feedback/SuccessScreen";

export default function SuccessPage({
  searchParams
}: {
  searchParams?: { name?: string; month?: string };
}) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-14 top-10 h-60 w-60 rounded-full bg-blue-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-14 -top-4 h-64 w-64 rounded-full bg-emerald-200/25 blur-3xl" />
      <SuccessScreen
        name={searchParams?.name ?? "there"}
        month={searchParams?.month ?? ""}
      />
    </main>
  );
}

