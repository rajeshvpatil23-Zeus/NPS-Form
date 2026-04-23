"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const SCALE = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

function getScoreTone(score: number) {
  if (score >= 9) return "border-emerald-500 text-emerald-700";
  if (score >= 7) return "border-lime-500 text-lime-700";
  if (score >= 5) return "border-amber-500 text-amber-700";
  if (score >= 3) return "border-orange-500 text-orange-700";
  return "border-rose-500 text-rose-700";
}

export function NpsStep({
  value,
  onChange
}: {
  value: number | null;
  onChange: (score: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 text-sm font-medium text-slate-700">
        10 = Extremely likely · 0 = Not at all
      </div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
        {SCALE.map((score) => {
          const selected = value === score;
          return (
            <motion.button
              key={score}
              type="button"
              whileTap={{ scale: 0.98 }}
              animate={selected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
              onClick={() => onChange(score)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border-2 text-center text-base font-semibold shadow-sm transition-all",
                getScoreTone(score),
                selected
                  ? "bg-current/10 ring-2 ring-offset-1 ring-slate-300"
                  : "bg-white hover:bg-slate-50"
              )}
            >
              <span>{score}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="flex justify-between px-1 text-xs font-medium text-slate-500">
        <span>Extremely likely</span>
        <span>Not likely</span>
      </div>
    </div>
  );
}

