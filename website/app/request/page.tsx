import type { Metadata } from "next";
import { Suspense } from "react";
import IntakeForm from "@/components/IntakeForm";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { BRAND } from "@/lib/brand";
import { SERVICE_OPTIONS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Request a visit | Voltline Electric",
};

type SearchParams = Promise<{ service?: string }>;

async function RequestForm({ searchParams }: { searchParams: SearchParams }) {
  const { service } = await searchParams;
  const initialService = SERVICE_OPTIONS.find((o) => o.value === service)?.value;
  return <IntakeForm initialService={initialService} />;
}

export default function RequestPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <SiteHeader showCta={false} />
      <main className="flex-1 bg-neutral-50 px-4 py-12">
        <div className="mx-auto max-w-xl">
          <h1 className="mb-2 text-center font-display text-3xl uppercase text-ink sm:text-4xl">
            Request a <span className="text-brand">visit</span>
          </h1>
          <p className="mb-8 text-center text-neutral-600">
            Tell us about your project. We follow up {BRAND.followUp}.
          </p>
          <div className="rounded-xl border-t-4 border-brand bg-white p-5 shadow-md sm:p-8">
            <Suspense
              fallback={
                <div className="h-96 animate-pulse rounded-md bg-neutral-100" aria-hidden />
              }
            >
              <RequestForm searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
