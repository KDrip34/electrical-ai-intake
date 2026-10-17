"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { CheckCircle2, ClipboardCheck, PhoneCall } from "lucide-react";
import { AnimatedListItem } from "@/components/ui/animated-list";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

const STEPS = [
  {
    icon: CheckCircle2,
    title: "Request received",
    body: "Your details and photos are in. Keep your reference number handy.",
    status: "Done",
  },
  {
    icon: ClipboardCheck,
    title: "A licensed estimator reviews it",
    body: "We look over your photos and project details before we call.",
    status: "Up next",
  },
  {
    icon: PhoneCall,
    title: "We call you",
    body: `Expect a call ${BRAND.followUp} to schedule your visit.`,
    status: "Soon",
  },
] as const;

const STEP_DELAY_MS = 600;

// Uses Magic UI's AnimatedListItem animation, but reveals steps top-to-bottom in order
// (AnimatedList itself stacks newest-on-top, which reads backwards for a timeline).
export default function NextSteps() {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(reduceMotion ? STEPS.length : 1);

  useEffect(() => {
    if (reduceMotion) {
      setShown(STEPS.length);
      return;
    }
    if (shown >= STEPS.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), STEP_DELAY_MS);
    return () => clearTimeout(t);
  }, [shown, reduceMotion]);

  return (
    <section aria-labelledby="next-steps-heading" className="text-left">
      <h3 id="next-steps-heading" className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-neutral-500">
        What happens next
      </h3>
      <ol className="space-y-3">
        {STEPS.slice(0, shown).map((step, i) => {
          const Icon = step.icon;
          const done = i === 0;
          return (
            <li key={step.title}>
              <AnimatedListItem>
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-lg border bg-white p-4 shadow-sm",
                    done ? "border-brand/40" : "border-neutral-200",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      done ? "bg-brand text-white" : "bg-ink text-white",
                    )}
                    aria-hidden
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-ink">
                        <span className="sr-only">Step {i + 1}: </span>
                        {step.title}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                          done ? "bg-brand/10 text-brand-dark" : "bg-neutral-100 text-neutral-600",
                        )}
                      >
                        {step.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{step.body}</p>
                  </div>
                </div>
              </AnimatedListItem>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
