"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInlineMessage(null);
    setIsError(false);
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
        setInlineMessage(
          `You have already submitted feedback for ${data.cycle}. Thank you!`
        );
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
      setInlineMessage("Could not verify your email right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const title = getMonthlyFeedbackTitle();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-6">
      <Card className="w-full">
        <CardHeader className="space-y-2 text-center">
          <div className="text-2xl font-semibold">{title}</div>
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
              className="w-full"
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
          : "Protected by a secure monthly verification link."}
      </div>
    </div>
  );
}

