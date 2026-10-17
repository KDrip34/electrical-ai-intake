import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import ServicesSection from "@/components/ServicesSection";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-[1.1fr_1fr] md:py-20">
            <div className="text-center md:text-left">
              <p className="mb-4 inline-block rounded-md bg-ink px-3 py-1.5 text-[11px] font-semibold uppercase leading-snug tracking-[0.15em] text-white sm:text-xs">
                {`${BRAND.contractorClass} · Lic. #${BRAND.licenseNumber}`}
              </p>
              <h1 className="mb-5 font-display text-4xl uppercase leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
                Licensed electricians for{" "}
                <span className="text-brand">{BRAND.region}</span>
              </h1>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-brand">
                {BRAND.tagline}
              </p>
              <p className="mb-8 text-lg text-neutral-700">
                {"Panel upgrades, EV chargers, ADUs, and whole-house rewiring. Send us your project and photos and an estimator will follow up " +
                  BRAND.followUp +
                  "."}
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row md:justify-start">
                <Link
                  href="/request"
                  className="w-full rounded-md bg-brand px-7 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:w-auto"
                >
                  Request a visit
                </Link>
                <Link
                  href="#services"
                  className="w-full rounded-md border-2 border-ink px-7 py-3 text-center font-semibold text-ink transition hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:w-auto"
                >
                  See our services
                </Link>
              </div>
            </div>
            <div className="order-first flex justify-center md:order-none">
              <Image
                src="/brand/logo-mark.svg"
                alt={`${BRAND.name} logo. ${BRAND.tagline}.`}
                width={512}
                height={512}
                priority
                className="h-auto w-full max-w-[220px] sm:max-w-xs md:max-w-md"
              />
            </div>
          </div>
        </section>
        <ServicesSection />
      </main>
      <SiteFooter />
    </>
  );
}
