/**
 * Anchor date for "May 2026" vs "April 2026" when collecting a prior month's pulse.
 * Priority: NEXT_PUBLIC_FEEDBACK_CYCLE_DATE → FEEDBACK_CYCLE_FALLBACK_ISO → today.
 * Set fallback to null to use the live calendar month only.
 */
const FEEDBACK_CYCLE_FALLBACK_ISO: string | null = "2026-04-01";

export function getEffectiveFeedbackDate(): Date {
  const fromEnv = process.env.NEXT_PUBLIC_FEEDBACK_CYCLE_DATE?.trim();
  if (fromEnv) {
    const d = new Date(fromEnv);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (FEEDBACK_CYCLE_FALLBACK_ISO) {
    const d = new Date(FEEDBACK_CYCLE_FALLBACK_ISO);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function getMonthYearLabel(date?: Date) {
  const d = date ?? getEffectiveFeedbackDate();
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function getMonthlyFeedbackTitle(date?: Date) {
  return `Monthly Feedback – ${getMonthYearLabel(date)}`;
}

export function getCurrentMonthYear(date?: Date) {
  return getMonthYearLabel(date);
}

