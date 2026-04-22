import { SuccessScreen } from "@/components/SuccessScreen";

export default function SuccessPage({
  searchParams
}: {
  searchParams?: { name?: string; month?: string };
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 py-10">
      <SuccessScreen
        name={searchParams?.name ?? "there"}
        month={searchParams?.month ?? ""}
      />
    </main>
  );
}

