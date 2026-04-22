import Link from "next/link";

export default function DemoPage() {
  const sampleEmail = "demo.student@example.com";

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">NPS Flow Demo</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use this page on localhost to quickly walk through the complete user flow.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/?demo=1"
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            1) Start: Email Gate (no verification)
          </Link>

          <Link
            href={`/feedback?demo=1&email=${encodeURIComponent(sampleEmail)}`}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            2) Feedback Wizard (prefilled email)
          </Link>

          <Link
            href="/success?name=Demo%20Student&month=April"
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            3) Success Screen
          </Link>
        </div>

        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-medium">Localhost URLs</p>
          <ul className="mt-2 space-y-1">
            <li>
              <span className="font-medium">Demo:</span> http://localhost:3000/demo
            </li>
            <li>
              <span className="font-medium">Entry:</span> http://localhost:3000/?demo=1
            </li>
            <li>
              <span className="font-medium">Feedback:</span>{" "}
              {`http://localhost:3000/feedback?demo=1&email=${sampleEmail}`}
            </li>
            <li>
              <span className="font-medium">Success:</span>{" "}
              http://localhost:3000/success?name=Demo%20Student&month=April
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
