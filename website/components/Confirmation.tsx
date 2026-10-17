import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import NextSteps from "@/components/NextSteps";
import { BRAND } from "@/lib/brand";

export default function Confirmation({ intakeId }: { intakeId: string }) {
  return (
    <div className="mx-auto max-w-xl space-y-6 text-center" role="status">
      <div className="space-y-3">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand text-white" aria-hidden>
          <CheckCircle2 className="size-8" />
        </span>
        <h2 className="font-display text-2xl uppercase text-ink">Thanks, we got your request</h2>
        <p className="text-neutral-700">
          A {BRAND.name} estimator will follow up {BRAND.followUp}.
        </p>
        <p className="inline-block rounded-md bg-neutral-100 px-3 py-1.5 text-sm text-neutral-600">
          Reference: <span className="font-mono font-semibold text-ink">{intakeId}</span>
        </p>
      </div>

      <NextSteps />

      <Link href="/" className="inline-block font-semibold text-brand underline hover:text-brand-dark">
        Back to home
      </Link>
    </div>
  );
}
