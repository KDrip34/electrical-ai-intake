import Link from "next/link";
import { SERVICE_OPTIONS, type ServiceType } from "@/lib/types";
import { BRAND } from "@/lib/brand";

const DESCRIPTIONS: Record<ServiceType, string> = {
  panel_upgrade:
    "Replace an outdated or overloaded electrical panel with a modern one that fits your home's needs.",
  subpanel:
    "Add a subpanel to bring power to a garage, workshop, addition, or other new space.",
  ev_charger:
    "Install a home EV charging station with the right circuit and a clean, code-compliant setup.",
  whole_house_rewiring: "Rewire an older home with new, safe wiring throughout.",
  adu: "Electrical service and wiring for a new accessory dwelling unit or conversion.",
  other:
    "Have a different electrical project in mind? Tell us about it and we'll take a look.",
};

export default function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-20 bg-ink px-4 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="mb-3 font-display text-3xl uppercase sm:text-4xl">
            Our <span className="text-brand-bright">services</span>
          </h2>
          <p className="text-white/70">
            {"Tell us about your project and we'll follow up " + BRAND.followUp + "."}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_OPTIONS.map((o) => (
            <Link
              key={o.value}
              href={`/request?service=${o.value}`}
              className="group flex flex-col rounded-xl border-t-4 border-brand bg-white p-6 text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <h3 className="mb-2 font-display text-lg uppercase">{o.label}</h3>
              <p className="mb-4 text-neutral-600">{DESCRIPTIONS[o.value]}</p>
              <span className="mt-auto text-sm font-semibold text-brand group-hover:text-brand-dark">
                Request a visit →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
