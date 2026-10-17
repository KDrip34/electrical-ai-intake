import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function SiteHeader({ showCta = true }: { showCta?: boolean }) {
  return (
    <header className="border-b-4 border-brand bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Image
            src="/brand/logo-mark.svg"
            alt=""
            width={44}
            height={44}
            priority
            className="h-11 w-auto"
          />
          <span className="leading-tight">
            <span className="block font-display text-sm uppercase tracking-wide text-ink min-[400px]:text-base sm:text-lg">
              {BRAND.name}
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.25em] text-brand sm:block">
              {BRAND.tagline}
            </span>
          </span>
        </Link>
        {showCta && (
          <Link
            href="/request"
            className="shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Request a visit
          </Link>
        )}
      </div>
    </header>
  );
}
