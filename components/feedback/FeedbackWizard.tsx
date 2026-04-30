"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/feedback/ProgressBar";
import { toast } from "@/components/ui/use-toast";
import { NpsStep } from "@/components/feedback/steps/NpsStep";
import {
  GridRatingStep,
  GRID_ROWS,
  type GridRating
} from "@/components/feedback/steps/GridRatingStep";
import {
  CheckboxStep,
  type ChallengesValue
} from "@/components/feedback/steps/CheckboxStep";
import { LongTextStep } from "@/components/feedback/steps/LongTextStep";
import { getMonthYearLabel } from "@/lib/month";

function getPath(score: number) {
  if (score >= 9) return "happy";
  if (score >= 7) return "neutral";
  return "critical";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

type StudentPayload = {
  found: boolean;
  already_submitted: boolean;
  cycle: string;
  name: string;
  batch_name: string;
  student_code: string;
  phone_number: string;
  email: string;
};

type StepDef = {
  key: "core" | "challenges" | "happy_text" | "improve" | "more";
  section?: string;
  question: string;
  subtext?: string;
};

export function FeedbackWizard({
  email,
  demoMode = false,
  initialStudent = null
}: {
  email: string;
  demoMode?: boolean;
  initialStudent?: StudentPayload | null;
}) {
  const router = useRouter();
  const idempotencyKeyRef = React.useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const [loadingStudent, setLoadingStudent] = React.useState(!initialStudent);
  const [student, setStudent] = React.useState<StudentPayload | null>(initialStudent);

  React.useEffect(() => {
    let mounted = true;
    if (!email) {
      router.replace("/?message=Please%20enter%20your%20registered%20email.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (
      initialStudent &&
      normalizeEmail(initialStudent.email) === normalizeEmail(normalizedEmail)
    ) {
      setLoadingStudent(false);
      return;
    }

    (async () => {
      setLoadingStudent(true);
      try {
        if (demoMode) {
          const safeEmail = email.trim().toLowerCase();
          if (!safeEmail) {
            router.replace("/?demo=1&message=Please%20enter%20an%20email.");
            return;
          }
          if (mounted) {
            setStudent({
              found: true,
              already_submitted: false,
              cycle: getMonthYearLabel(),
              name: "Demo Student",
              batch_name: "Demo Batch",
              student_code: "DEMO001",
              phone_number: "NA",
              email: safeEmail
            });
          }
          return;
        }

        const res = await fetch(`/api/student?email=${encodeURIComponent(normalizedEmail)}`);
        const data = await res.json();
        if (!res.ok || !data.found) {
          router.replace(
            "/?message=This%20email%20is%20not%20registered.%20Please%20use%20your%20registered%20email%20ID."
          );
          return;
        }
        if (data.already_submitted) {
          router.replace(
            `/?message=${encodeURIComponent(`You have already submitted feedback for ${data.cycle}. Thank you!`)}`
          );
          return;
        }
        if (mounted) setStudent(data);
      } catch {
        router.replace("/?message=Unable%20to%20load%20student%20details.");
      } finally {
        if (mounted) setLoadingStudent(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [demoMode, email, initialStudent, router]);

  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [index, setIndex] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);

  const [npsScore, setNpsScore] = React.useState<number | null>(null);
  const [grid, setGrid] = React.useState<Partial<GridRating>>({});
  const [challenges, setChallenges] = React.useState<ChallengesValue>({
    selected: [],
    otherText: ""
  });
  const [textHappy, setTextHappy] = React.useState("");
  const [textImprove, setTextImprove] = React.useState("");
  const [textMore, setTextMore] = React.useState("");

  const steps: StepDef[] = React.useMemo(() => {
    const base: StepDef[] = [
      {
        key: "core",
        section: "Rate Your Experience Across Key Areas ✨",
        question:
          "Please rate the following touchpoints of your learning journey based on your experience so far.",
        // subtext:
        //   "Based on your learning experience and support provided, how likely are you to recommend this programs to your friends and family ?"
      }
    ];

    if (npsScore === null) return base;
    if (!gridComplete()) return base;

    const path = getPath(npsScore);

    if (path === "happy") {
      base.push({
        key: "happy_text",
        section: "Share Your Experience",
        question:
          "What did you like most about your experience with BITSoM CEPD x Masai School, and what is one thing we could improve further?"
      });
    } else if (path === "neutral") {
      base.push({
        key: "challenges",
        section: "Help Us Understand Your Challenges",
        question: "Please select the areas where you faced challenges"
      });
      base.push({
        key: "improve",
        section: "Help Us Improve",
        question: "What is one thing we could improve to make your experience a 10/10?"
      });
    } else {
      base.push({
        key: "challenges",
        section: "Identifying Gaps in Your Experience",
        question: "Please select the areas where you faced challenges"
      });
      base.push({
        key: "more",
        section: "Tell Us More",
        question:
          "What challenges did you face during your experience, and what could we have done differently?"
      });
    }

    return base;
  }, [npsScore]);

  React.useEffect(() => {
    if (index > steps.length - 1) setIndex(steps.length - 1);
  }, [steps.length, index]);

  const current = steps[index]!;

  function gridComplete() {
    return GRID_ROWS.every((r) => typeof grid[r] === "number");
  }

  function challengesComplete() {
    if (challenges.selected.length < 1) return false;
    if (challenges.selected.includes("Other")) {
      return (challenges.otherText ?? "").trim().length >= 2;
    }
    return true;
  }

  function minCharsComplete(val: string, min?: number) {
    if (!min) return val.trim().length > 0;
    return val.trim().length >= min;
  }

  function stepAnswered(stepKey: string) {
    switch (stepKey) {
      case "core":
        return npsScore !== null && gridComplete();
      case "challenges":
        return challengesComplete();
      case "happy_text":
        return true;
      case "improve":
        return true;
      case "more":
        return true;
      default:
        return false;
    }
  }

  const answeredCount = steps.filter((s) => stepAnswered(s.key)).length;
  const progress = Math.round((answeredCount / steps.length) * 100);

  const canGoBack = index > 0;
  const isLast = index === steps.length - 1;
  const canNext = stepAnswered(current.key);

  const [submitting, setSubmitting] = React.useState(false);

  const goNext = React.useCallback(() => {
    if (!canNext || isLast || submitting) return;
    setDirection(1);
    setIndex((i) => Math.min(steps.length - 1, i + 1));
  }, [canNext, isLast, submitting, steps.length]);

  const goBack = React.useCallback(() => {
    if (!canGoBack || submitting) return;
    setDirection(-1);
    setIndex((i) => Math.max(0, i - 1));
  }, [canGoBack, submitting]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      goBack();
      return;
    }
    if (e.key === "Enter") {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "textarea") return;
      e.preventDefault();
      if (isLast) submit();
      else goNext();
    }
  }

  async function submit() {
    if (!student) return;
    if (npsScore === null) return;
    if (!gridComplete()) return;

    setSubmitting(true);
    const savingToast = toast({
      title: "Saving…",
      description: "Submitting your feedback securely."
    });

    try {
      const path = getPath(npsScore);
      const challengesSelected =
        path === "happy"
          ? []
          : challenges.selected.includes("Other") && challenges.otherText?.trim()
            ? [...challenges.selected.filter((s) => s !== "Other"), `Other: ${challenges.otherText.trim()}`]
            : challenges.selected;
      const openText =
        path === "happy" ? textHappy.trim() : path === "neutral" ? textImprove.trim() : textMore.trim();
      const res = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          demo: demoMode,
          idempotency_key: idempotencyKeyRef.current,
          email: student.email,
          nps_score: npsScore,
          grid_ratings: {
            faculty: grid["Faculty/Mentor Sessions"],
            ta: grid["Teaching Assistant Support"],
            coordinator: grid["Program Coordinator Support"],
            lms: grid["LMS Platform"],
            ticketing: grid["Ticketing Support"]
          },
          challenges: challengesSelected,
          open_text: openText
        })
      });
      const data = (await res.json()) as
        | { success: true; name: string; cycle: string }
        | { success?: false; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(("error" in data ? data.error : undefined) ?? "Submission failed.");
      }

      savingToast.dismiss?.();
      router.replace(
        `/success?name=${encodeURIComponent(data.name)}&month=${encodeURIComponent(data.cycle)}`
      );
    } catch (err) {
      savingToast.dismiss?.();
      toast({
        variant: "destructive",
        title: "Could not submit",
        description: err instanceof Error ? err.message : "Please try again."
      });
      setSubmitting(false);
    }
  }

  if (loadingStudent) {
    return (
      <div className="mx-auto flex min-h-[60dvh] w-full max-w-2xl items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (!student) return null;

  const cycle = student.cycle || getMonthYearLabel();

  return (
    <div
      className="relative z-10 mx-auto w-full max-w-2xl space-y-4 rounded-2xl outline-none focus:outline-none focus-visible:outline-none sm:space-y-5"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onTouchStart={(e) => {
        touchStartX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
        const diff = endX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(diff) < 50) return;
        if (diff < 0) goNext();
        else goBack();
      }}
    >
      <div className="flex flex-col gap-1">
        <div className="w-fit flex h-10 items-center">
          <img
            src="/masai-logo-final.png"
            alt="Masai"
            width={92}
            height={30}
            className="h-auto w-[92px]"
          />
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" />
          Monthly Learner Feedback
        </div>
        <div className="pt-2 text-sm font-semibold text-green-700">
          {student.batch_name} Monthly Feedback - {cycle}
        </div>
        <div className="text-xl font-bold tracking-tight">Hi {student.name}</div>
        <div className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Student Code: {student.student_code}
        </div>
      </div>

      <ProgressBar value={progress} />

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader className="space-y-2 p-4 pb-3 sm:p-6 sm:pb-3">
          {current.section ? (
            <div className="text-sm font-medium text-slate-700">
              {current.section}
            </div>
          ) : null}
          <div className="text-lg font-semibold leading-relaxed">{current.question}</div>
          {current.subtext ? (
            <div className="text-sm text-slate-600">{current.subtext}</div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5 p-4 pt-3 sm:space-y-6 sm:p-6 sm:pt-3">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={current.key}
              custom={direction}
              initial={{ opacity: 0, x: direction === 1 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction === 1 ? -40 : 40 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              {current.key === "core" ? (
                <>
                  <GridRatingStep value={grid} onChange={setGrid} />
                  <div className="space-y-3 border-t border-slate-100 pt-5 sm:pt-6">
                    <div className="text-base font-semibold leading-relaxed">
                      Based on your learning experience and support provided, how likely are you to recommend this programs to your friends and family ?
                    </div>
                    <NpsStep
                      value={npsScore}
                      onChange={(v) => {
                        setNpsScore(v);
                      }}
                    />
                  </div>
                </>
              ) : null}

              {current.key === "challenges" ? (
                <CheckboxStep value={challenges} onChange={setChallenges} />
              ) : null}

              {current.key === "happy_text" ? (
                <LongTextStep
                  value={textHappy}
                  onChange={setTextHappy}
                  placeholder="Please share your experience…"
                />
              ) : null}

              {current.key === "improve" ? (
                <LongTextStep
                  value={textImprove}
                  onChange={setTextImprove}
                  placeholder="One improvement that would make it 10/10…"
                />
              ) : null}

              {current.key === "more" ? (
                <LongTextStep
                  value={textMore}
                  onChange={setTextMore}
                  placeholder="Tell us what happened and what we could do differently…"
                />
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div
            className="flex items-center justify-between gap-3 pb-[max(12px,env(safe-area-inset-bottom))]"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={!canGoBack || submitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {isLast ? (
              <motion.div
                animate={
                  canNext && !submitting
                    ? { scale: [1, 1.02, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 1.2, repeat: Infinity }}
                className="flex-1"
              >
                <Button
                  type="button"
                  className="w-full"
                  onClick={submit}
                  disabled={!canNext || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </motion.div>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                disabled={!canNext || submitting}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

