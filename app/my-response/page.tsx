import { getCurrentCycleResponseByEmail } from "@/lib/sheets";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatSubmittedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value || "-"}</div>
    </div>
  );
}

function RatingCard({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 5
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : value >= 3
        ? "border-orange-200 bg-orange-50 text-orange-800"
        : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className={`rounded-2xl border p-4 text-center shadow-sm ${tone}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold">{value || "-"}</div>
    </div>
  );
}

export default async function MyResponsePage({
  searchParams
}: {
  searchParams?: { email?: string };
}) {
  const email = (searchParams?.email ?? "").trim().toLowerCase();
  const response = email ? await getCurrentCycleResponseByEmail(email) : null;

  return (
    <main className="relative min-h-dvh overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-6 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-5">
        <div className="flex justify-center">
          <img
            src="/masai-logo-final.png"
            alt="Masai"
            width={96}
            height={31}
            className="h-auto w-24"
          />
        </div>

        <Card className="border-slate-200/80 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Submitted Feedback
            </div>
            <div className="text-2xl font-bold tracking-tight">
              Your Submitted Response
            </div>
            <div className="text-sm text-slate-600">
              {response
                ? `${response.name} - ${response.cycle}`
                : "No submitted response found for this email in the current cycle."}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {response ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailCard label="Email" value={response.email} />
                  <DetailCard label="Batch" value={response.batch_name} />
                  <DetailCard
                    label="Submitted At"
                    value={formatSubmittedAt(response.submitted_at)}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Recommendation Score
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-5xl font-bold text-emerald-700">
                      {response.nps_score}
                    </div>
                    <div className="pb-2 text-sm font-medium text-slate-600">
                      out of 10
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-5">
                  <RatingCard label="Faculty" value={response.faculty_rating} />
                  <RatingCard label="TA" value={response.ta_rating} />
                  <RatingCard
                    label="Coordinator"
                    value={response.coordinator_rating}
                  />
                  <RatingCard label="LMS" value={response.lms_rating} />
                  <RatingCard label="Ticketing" value={response.ticketing_rating} />
                </div>

                <DetailCard
                  label="Challenges Selected"
                  value={response.challenges_selected}
                />
                <DetailCard
                  label="Open Feedback"
                  value={response.open_text_answer}
                />
              </>
            ) : (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                <div className="text-sm text-slate-600">
                  Please go back and use your registered email to check your
                  submission.
                </div>
                <Button asChild>
                  <a href="/">Back to feedback page</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

