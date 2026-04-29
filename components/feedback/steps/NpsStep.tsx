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

function getSelectedTone(score: number) {
  if (score >= 9) return "bg-emerald-600 border-emerald-700 text-white";
  if (score >= 7) return "bg-lime-600 border-lime-700 text-white";
  if (score >= 5) return "bg-amber-500 border-amber-600 text-white";
  if (score >= 3) return "bg-orange-500 border-orange-600 text-white";
  return "bg-rose-500 border-rose-600 text-white";
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
        10 = Will surely recommend · 0 = Will not recommend
      </div>
      <div className="grid grid-cols-11 gap-1">
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
                "flex h-6 w-6 items-center justify-center rounded-full border-2 text-center text-[11px] font-semibold shadow-sm transition-all sm:h-10 sm:w-10 sm:text-sm",
                !selected && getScoreTone(score),
                selected
                  ? `${getSelectedTone(score)} scale-105 font-bold ring-2 ring-offset-1 ring-slate-300 shadow-md`
                  : "bg-white hover:bg-slate-50"
              )}
            >
              <span>{score}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="flex justify-between px-1 text-xs font-medium text-slate-500">
        <span>Will surely recommend</span>
        <span>Will not recommend</span>
      </div>
    </div>
  );
}

