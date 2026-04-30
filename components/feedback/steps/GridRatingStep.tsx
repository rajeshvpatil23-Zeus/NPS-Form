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

function getToneClass(value: number) {
  if (value === 5) return "border-emerald-500 text-emerald-700";
  if (value === 4 || value === 3) return "border-orange-400 text-orange-700";
  return "border-rose-300 text-rose-700";
}

function getSelectedBg(value: number) {
  if (value === 5) return "bg-emerald-200 border-emerald-700 text-emerald-900";
  if (value === 4 || value === 3) return "bg-orange-200 border-orange-600 text-orange-900";
  return "bg-rose-200 border-rose-500 text-rose-900";
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
        5 = Very Happy || 1 = Not Happy at All
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
                        getToneClass(c.value),
                        isSelected
                          ? `${getSelectedBg(c.value)} font-bold ring-2 ring-offset-1 ring-slate-300 shadow-md`
                          : "bg-white/80 hover:bg-white"
                      )}
                      aria-label={`${row} rating ${c.value}`}
                    >
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
        <div className="grid grid-cols-[1fr_repeat(5,52px)] items-center gap-x-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
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
                className="grid grid-cols-[1fr_repeat(5,52px)] items-center gap-x-2 px-3 py-3"
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
                        "mx-auto flex h-11 w-11 items-center justify-center rounded-xl border text-sm transition-colors",
                        getToneClass(c.value),
                        isSelected
                          ? `${getSelectedBg(c.value)} font-bold ring-2 ring-offset-1 ring-slate-300 shadow-md`
                          : "bg-white/80 hover:bg-white"
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

