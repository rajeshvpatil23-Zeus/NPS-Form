import { getCurrentCycleResponseByEmail } from "@/lib/sheets";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-900">{value || "-"}</div>
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
    <main className="min-h-dvh bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader className="space-y-1">
            <div className="text-xl font-semibold">Your Submitted Response</div>
            <div className="text-sm text-slate-600">
              {response
                ? `${response.name} - ${response.cycle}`
                : "No submitted response found for this email in the current cycle."}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {response ? (
              <>
                <Row label="Email" value={response.email} />
                <Row label="Batch" value={response.batch_name} />
                <Row label="Submitted At" value={response.submitted_at} />
                <Row label="NPS Score" value={String(response.nps_score)} />
                <Row label="Faculty Rating" value={String(response.faculty_rating)} />
                <Row label="TA Rating" value={String(response.ta_rating)} />
                <Row
                  label="Coordinator Rating"
                  value={String(response.coordinator_rating)}
                />
                <Row label="LMS Rating" value={String(response.lms_rating)} />
                <Row label="Ticketing Rating" value={String(response.ticketing_rating)} />
                <Row label="Challenges" value={response.challenges_selected} />
                <Row label="Open Feedback" value={response.open_text_answer} />
              </>
            ) : (
              <Row
                label="Next Step"
                value="Go back and use your registered email to check your submission."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

