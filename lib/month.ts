export function getMonthYearLabel(date = new Date()) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function getMonthlyFeedbackTitle(date = new Date()) {
  return `Monthly Feedback – ${getMonthYearLabel(date)}`;
}

export function getCurrentMonthYear(date = new Date()) {
  return getMonthYearLabel(date);
}

