"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SuccessScreen({ name, month }: { name: string; month: string }) {
  React.useEffect(() => {
    const end = Date.now() + 900;
    const tick = () => {
      confetti({
        particleCount: 60,
        spread: 80,
        startVelocity: 35,
        origin: { y: 0.7 }
      });
      if (Date.now() < end) requestAnimationFrame(tick);
    };
    tick();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-6">
      <Card className="w-full">
        <CardHeader className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 16 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50"
          >
            <motion.div
              initial={{ rotate: -15, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white"
            >
              <Check className="h-7 w-7" />
            </motion.div>
          </motion.div>

          <div className="text-2xl font-semibold">
            Thank you, {name}!
          </div>
          <div className="text-sm text-slate-600">
            Your feedback{month ? ` for ${month}` : ""} has been recorded.
          </div>
        </CardHeader>
        <CardContent className="text-center text-sm text-slate-600">
          We truly value your input and will use it to improve your experience.
        </CardContent>
      </Card>
    </div>
  );
}

