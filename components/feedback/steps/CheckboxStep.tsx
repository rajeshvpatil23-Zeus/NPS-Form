"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const OPTIONS = [
  "Faculty/Mentor Sessions",
  "Teaching Assistant Support",
  "Program Coordinator Support",
  "LMS Platform",
  "Ticketing Support",
  "Other"
] as const;

export type ChallengesValue = {
  selected: string[];
  otherText?: string;
};

export function CheckboxStep({
  value,
  onChange
}: {
  value: ChallengesValue;
  onChange: (next: ChallengesValue) => void;
}) {
  function toggle(opt: string) {
    const selected = new Set(value.selected);
    if (selected.has(opt)) selected.delete(opt);
    else selected.add(opt);
    const next = { ...value, selected: Array.from(selected) };
    if (!next.selected.includes("Other")) next.otherText = "";
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 text-sm font-medium text-slate-700">
        Select all challenge areas you faced during the month.
      </div>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const active = value.selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                "min-h-12 rounded-full border px-4 py-2 text-sm transition-colors",
                active
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {value.selected.includes("Other") ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">Other (please specify)</div>
          <Input
            value={value.otherText ?? ""}
            onChange={(e) => onChange({ ...value, otherText: e.target.value })}
            placeholder="Type here…"
          />
        </div>
      ) : null}
    </div>
  );
}

