"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const SCALE = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

function getMood(score: number) {
  if (score >= 9) return "😍";
  if (score >= 7) return "🙂";
  return "😕";
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
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        How do you feel about your experience? <span className="ml-1">😊</span>{" "}
        Tap a score (10 = Extremely Happy, 1 = Unhappy)
      </div>
      <div className="grid grid-cols-5 gap-2">
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
                "flex min-h-14 w-full flex-col items-center justify-center rounded-2xl border px-2 py-2 text-center text-sm font-semibold shadow-sm transition-all",
                selected
                  ? "border-green-600 bg-gradient-to-b from-green-50 to-emerald-50 text-green-700 ring-2 ring-green-200"
                  : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
              )}
            >
              <span className="text-base leading-none">{getMood(score)}</span>
              <span>{score}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

