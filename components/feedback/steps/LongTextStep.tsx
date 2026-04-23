"use client";

import { Textarea } from "@/components/ui/textarea";

export function LongTextStep({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Your detailed feedback
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-32"
      />
    </div>
  );
}

