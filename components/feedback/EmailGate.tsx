"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Sparkles } from "lucide-react";

import { getMonthlyFeedbackTitle } from "@/lib/month";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VerifyResponse = {
  found: boolean;
  already_submitted: boolean;
  cycle: string;
  name?: string;
  batch_name?: string;
  student_code?: string;
  phone_number?: string;
  email?: string;
  message?: string;
};

export function EmailGate({
  message,
  demoMode = false
}: {
  message?: string;
  demoMode?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [inlineMessage, setInlineMessage] = React.useState<string | null>(
    message ?? null
  );
  const [isError, setIsError] = React.useState(false);
  const [viewResponseEmail, setViewResponseEmail] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInlineMessage(null);
    setIsError(false);
    setViewResponseEmail(null);
    setLoading(true);
    try {
      if (demoMode) {
        router.push(
          `/feedback?demo=1&email=${encodeURIComponent(email.trim().toLowerCase())}&batch=${encodeURIComponent(
            "Demo Batch"
          )}`
        );
        return;
      }

      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = (await res.json()) as VerifyResponse | { error: string };
      if (!res.ok || "error" in data) {
        setIsError(true);
        setInlineMessage(
          "This email is not registered. Please use your registered email ID."
        );
        return;
      }

      if (data.already_submitted) {
        const safeEmail = (data.email ?? email).trim().toLowerCase();
        setInlineMessage(
          `You have already submitted feedback for ${data.cycle}. Thank you!`
        );
        setViewResponseEmail(safeEmail);
        return;
      }

      router.push(
        `/feedback?email=${encodeURIComponent(data.email ?? email.trim().toLowerCase())}&cycle=${encodeURIComponent(
          data.cycle ?? ""
        )}&name=${encodeURIComponent(data.name ?? "")}&batch=${encodeURIComponent(
          data.batch_name ?? ""
        )}&student_code=${encodeURIComponent(data.student_code ?? "")}&phone_number=${encodeURIComponent(
          data.phone_number ?? ""
        )}`
      );
    } catch {
      setIsError(true);
      setInlineMessage(
        "Could not verify your email right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const title = getMonthlyFeedbackTitle();

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center justify-center gap-6">
      <Card className="w-full border-slate-200/80 bg-white/90 backdrop-blur">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-10 items-center">
            <img
              src="/masai-logo-final.png"
              alt="Masai"
              width={92}
              height={30}
              className="h-auto w-[92px]"
            />
          </div>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <GraduationCap className="h-3.5 w-3.5" />
            Monthly Student Pulse
          </div>
          <div className="text-2xl font-bold tracking-tight">{title}</div>
          <div className="text-sm text-slate-600">
            Your feedback gives us direction and helps improve your experience.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {inlineMessage ? (
            <div
              className={`rounded-xl border p-4 text-sm ${
                isError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-800"
              }`}
            >
              {inlineMessage}
            </div>
          ) : null}
          {viewResponseEmail ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                router.push(
                  `/my-response?email=${encodeURIComponent(viewResponseEmail)}`
                )
              }
            >
              <Sparkles className="h-4 w-4" />
              View your submitted response
            </Button>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Enter your registered email address</Label>
              <Input
                id="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={loading || email.trim().length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {demoMode ? "Continuing…" : "Verifying…"}
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-slate-500">
        {demoMode
          ? "Demo mode enabled: verification is skipped."
          : "Secure monthly verification for registered learners."}
      </div>
    </div>
  );
}

