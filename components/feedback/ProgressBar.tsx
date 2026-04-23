"use client";

import { Progress } from "@/components/ui/progress";

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white/80 p-3">
      <Progress value={value} />
      <div className="text-right text-xs font-medium text-slate-500">
        {value}% complete
      </div>
    </div>
  );
}

