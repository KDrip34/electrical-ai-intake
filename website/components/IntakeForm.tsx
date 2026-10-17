"use client";

import { useState } from "react";
import { SERVICE_OPTIONS, type ServiceType } from "@/lib/types";
import { validateJob, type JobErrors } from "@/lib/validate";
import { ALLOWED_TYPES, MAX_PHOTOS, fileToPhoto } from "@/lib/photos";
import Confirmation from "@/components/Confirmation";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import PhotoDropzone from "@/components/PhotoDropzone";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type FormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  zip: string;
  serviceType: ServiceType;
  preferredAppointmentWindow: string;
  description: string;
};

const INITIAL: FormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  zip: "",
  serviceType: "panel_upgrade",
  preferredAppointmentWindow: "",
  description: "",
};

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";

export default function IntakeForm({ initialService }: { initialService?: ServiceType }) {
  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    serviceType: initialService ?? INITIAL.serviceType,
  });
  const [errors, setErrors] = useState<JobErrors>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [intakeId, setIntakeId] = useState<string | null>(null);

  // Accessible error wiring for a validated field: red border, aria-invalid, and a link to its message.
  function fieldProps(key: keyof JobErrors) {
    const invalid = Boolean(errors[key]);
    return {
      "aria-invalid": invalid || undefined,
      "aria-describedby": invalid ? `${key}-error` : undefined,
      className: invalid ? `${inputClass} border-brand` : inputClass,
    };
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addPhotos(picked: File[]) {
    const allowed = (ALLOWED_TYPES as readonly string[]);
    const rejected = picked.filter((f) => !allowed.includes(f.type));
    const accepted = picked.filter((f) => allowed.includes(f.type));
    const merged = [...photos, ...accepted];
    const messages: string[] = [];
    if (rejected.length > 0) {
      messages.push(`Not a JPEG, PNG, or WebP image: ${rejected.map((f) => f.name).join(", ")}.`);
    }
    if (merged.length > MAX_PHOTOS) {
      messages.push(`You can attach up to ${MAX_PHOTOS} photos.`);
    }
    setPhotoError(messages.join(" "));
    setPhotos(merged.slice(0, MAX_PHOTOS));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateJob(form);
    setErrors(found);
    const firstInvalid = (["name", "phone", "email", "address", "zip"] as const).find((k) => found[k]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const windowText = form.preferredAppointmentWindow.trim();
      const descriptionText = form.description.trim();
      const job = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        zip: form.zip,
        serviceType: form.serviceType,
        ...(windowText ? { preferredAppointmentWindow: windowText } : {}),
        ...(descriptionText ? { description: descriptionText } : {}),
      };
      const payloads = await Promise.all(photos.map(fileToPhoto));
      if (DEMO_MODE) {
        // Portfolio demo: no API call, no CRM write, no AI spend.
        await new Promise((r) => setTimeout(r, 1200));
        setIntakeId(`demo-${Date.now().toString(36)}`);
        return;
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/api/estimate/intake`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job, photos: payloads }),
        },
      );
      if (res.status === 202) {
        const data = (await res.json()) as { intakeId: string };
        setIntakeId(data.intakeId);
      } else if (res.status === 429) {
        setSubmitError("We're getting a lot of requests right now. Please try again in a few minutes.");
      } else {
        setSubmitError("Something went wrong sending your request. Please try again.");
      }
    } catch {
      setSubmitError("Something went wrong sending your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (intakeId) return <Confirmation intakeId={intakeId} />;

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-xl space-y-4">
      {DEMO_MODE && (
        <p role="note" className="rounded-md border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-ink">
          Portfolio demo: submissions are not sent anywhere. Try the form and photo upload freely.
        </p>
      )}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">Full name</label>
        <input id="name" {...fieldProps("name")} value={form.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" />
        {errors.name && <p id="name-error" className="mt-1 text-sm text-brand">{errors.name}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">Phone</label>
          <input id="phone" type="tel" {...fieldProps("phone")} value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" />
          {errors.phone && <p id="phone-error" className="mt-1 text-sm text-brand">{errors.phone}</p>}
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="email" type="email" {...fieldProps("email")} value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" />
          {errors.email && <p id="email-error" className="mt-1 text-sm text-brand">{errors.email}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="address" className="mb-1 block text-sm font-medium">Job address</label>
          <input id="address" {...fieldProps("address")} value={form.address} onChange={(e) => update("address", e.target.value)} autoComplete="street-address" />
          {errors.address && <p id="address-error" className="mt-1 text-sm text-brand">{errors.address}</p>}
        </div>
        <div>
          <label htmlFor="zip" className="mb-1 block text-sm font-medium">ZIP</label>
          <input id="zip" inputMode="numeric" maxLength={5} {...fieldProps("zip")} value={form.zip} onChange={(e) => update("zip", e.target.value)} autoComplete="postal-code" />
          {errors.zip && <p id="zip-error" className="mt-1 text-sm text-brand">{errors.zip}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="serviceType" className="mb-1 block text-sm font-medium">What do you need?</label>
        <select id="serviceType" className={inputClass} value={form.serviceType} onChange={(e) => update("serviceType", e.target.value as ServiceType)}>
          {SERVICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="window" className="mb-1 block text-sm font-medium">Preferred appointment window (optional)</label>
        <input id="window" className={inputClass} placeholder="e.g. weekday mornings" value={form.preferredAppointmentWindow} onChange={(e) => update("preferredAppointmentWindow", e.target.value)} />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">Tell us about the job (optional)</label>
        <textarea id="description" rows={4} className={inputClass} value={form.description} onChange={(e) => update("description", e.target.value)} />
      </div>

      <PhotoDropzone
        photos={photos}
        onAdd={addPhotos}
        onRemove={removePhoto}
        error={photoError}
        disabled={submitting}
      />

      {submitError && <p role="alert" className="text-sm text-brand">{submitError}</p>}
      <ShimmerButton
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        background="#1d4ed8"
        shimmerColor="#ffffff"
        borderRadius="0.375rem"
        className="w-full py-3.5 font-semibold tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:[&_*]:animate-none"
      >
        {submitting ? "Sending..." : "Request a visit"}
      </ShimmerButton>
      <p className="text-center text-sm text-neutral-600">We follow up within 24 business hours.</p>
    </form>
  );
}
