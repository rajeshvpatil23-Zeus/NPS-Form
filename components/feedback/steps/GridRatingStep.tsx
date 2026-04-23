"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const COLUMNS: Array<{ value: number; label: string }> = [
  { value: 5, label: "5" },
  { value: 4, label: "4" },
  { value: 3, label: "3" },
  { value: 2, label: "2" },
  { value: 1, label: "1" }
];

function getEmoji(value: number) {
  if (value === 5) return "😍";
  if (value === 4) return "😊";
  if (value === 3) return "🙂";
  if (value === 2) return "😐";
  return "😕";
}

const ROWS = [
  "Faculty/Mentor Sessions",
  "Teaching Assistant Support",
  "Program Coordinator Support",
  "LMS Platform",
  "Ticketing Support"
] as const;

export type GridRating = Record<(typeof ROWS)[number], number>;

export function GridRatingStep({
  value,
  onChange
}: {
  value: Partial<GridRating>;
  onChange: (next: Partial<GridRating>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-2 text-sm font-medium text-slate-700">
        Rate each area with one tap <span className="ml-1">⭐</span> (5 = Extremely
        Happy, 1 = Unhappy)
      </div>

      <div className="space-y-2 sm:hidden">
        {ROWS.map((row) => {
          const selected = value[row];
          return (
            <div
              key={row}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="mb-2 text-sm font-medium text-slate-900">{row}</div>
              <div className="grid grid-cols-5 gap-2">
                {COLUMNS.map((c) => {
                  const isSelected = selected === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => onChange({ ...value, [row]: c.value })}
                      className={cn(
                        "flex min-h-12 w-full flex-col items-center justify-center rounded-xl border text-xs font-semibold transition-all",
                        isSelected
                          ? "border-green-600 bg-gradient-to-b from-green-50 to-emerald-50 text-green-700 ring-2 ring-green-200"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                      aria-label={`${row} rating ${c.value}`}
                    >
                      <span className="text-sm leading-none">{getEmoji(c.value)}</span>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 sm:block">
        <div className="grid grid-cols-[1fr_repeat(5,48px)] items-center gap-0 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          <div>Component</div>
          {COLUMNS.map((c) => (
            <div key={c.value} className="text-center">
              {c.label}
            </div>
          ))}
        </div>

        <div className="divide-y divide-slate-200">
          {ROWS.map((row) => {
            const selected = value[row];
            return (
              <div
                key={row}
                className="grid grid-cols-[1fr_repeat(5,48px)] items-center gap-0 px-3 py-3"
              >
                <div className="pr-2 text-sm font-medium text-slate-900">
                  {row}
                </div>
                {COLUMNS.map((c) => {
                  const isSelected = selected === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => onChange({ ...value, [row]: c.value })}
                      className={cn(
                        "mx-auto flex h-12 w-12 items-center justify-center rounded-xl border text-sm transition-colors",
                        isSelected
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                      aria-label={`${row} rating ${c.value}`}
                    >
                      {c.value}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const GRID_ROWS = ROWS;

