import { BRAND } from "@/lib/brand";

export default function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="h-1 bg-brand-bright" />
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display uppercase tracking-wide">{BRAND.name}</p>
        <p className="text-white/70">
          {`${BRAND.contractorClass} · License #${BRAND.licenseNumber} · ${BRAND.region}`}
        </p>
      </div>
    </footer>
  );
}
