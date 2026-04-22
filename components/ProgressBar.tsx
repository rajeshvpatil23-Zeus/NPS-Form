"use client";

import { Progress } from "@/components/ui/progress";

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="space-y-2">
      <Progress value={value} />
      <div className="text-right text-xs text-slate-500">{value}% complete</div>
    </div>
  );
}

