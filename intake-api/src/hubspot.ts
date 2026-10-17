import { getSecret } from "./secrets.js";
import type { ElectricalAssessment, Job, Photo } from "./schemas.js";

const BASE_URL = "https://api.hubapi.com";
// First stage of the default deal pipeline. Override with HUBSPOT_DEAL_STAGE
// if the account's stage ids differ.
const DEAL_STAGE = process.env.HUBSPOT_DEAL_STAGE ?? "appointmentscheduled";
const DEAL_PIPELINE = process.env.HUBSPOT_DEAL_PIPELINE ?? "default";

// HubSpot-defined association type ids (from object to deal / contact).
const ASSOC_DEAL_TO_CONTACT = 3;
const ASSOC_NOTE_TO_DEAL = 214;
const ASSOC_TASK_TO_DEAL = 216;

type HubSpotObject = { id: string };

async function hubspot<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getSecret("hubspot_token");
  if (!token) {
    throw new Error("hubspot_token secret is not set");
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`HubSpot ${method} ${path} failed: ${response.status} ${detail.slice(0, 300)}`);
  }
  return (await response.json()) as T;
}

function splitName(fullName: string): { firstname: string; lastname: string } {
  const parts = fullName.trim().split(/\s+/);
  return { firstname: parts[0] ?? "", lastname: parts.slice(1).join(" ") };
}

function association(toId: string, typeId: number) {
  return {
    to: { id: toId },
    types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: typeId }],
  };
}

export async function upsertContact(job: Job): Promise<string> {
  const properties = {
    email: job.email,
    ...splitName(job.name),
    phone: job.phone,
    address: job.address,
    zip: job.zip,
  };

  const found = await hubspot<{ results: HubSpotObject[] }>("POST", "/crm/v3/objects/contacts/search", {
    filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: job.email }] }],
    limit: 1,
  });
  const existing = found.results[0];
  if (existing) {
    await hubspot("PATCH", `/crm/v3/objects/contacts/${existing.id}`, { properties });
    return existing.id;
  }
  const created = await hubspot<HubSpotObject>("POST", "/crm/v3/objects/contacts", { properties });
  return created.id;
}

export async function createDeal(job: Job, intakeId: string, contactId: string): Promise<string> {
  const deal = await hubspot<HubSpotObject>("POST", "/crm/v3/objects/deals", {
    properties: {
      dealname: `${job.name} - ${job.serviceType} (${intakeId.slice(0, 8)})`,
      pipeline: DEAL_PIPELINE,
      dealstage: DEAL_STAGE,
    },
    associations: [association(contactId, ASSOC_DEAL_TO_CONTACT)],
  });
  return deal.id;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildNoteBody(job: Job, intakeId: string, assessment: ElectricalAssessment | null): string {
  const lines = [
    `Intake ID: ${intakeId}`,
    `Service requested: ${job.serviceType}`,
    `Address: ${job.address} ${job.zip}`,
    `Panel amperage (customer stated): ${job.panelAmperage ?? "not provided"}`,
    `Preferred appointment window: ${job.preferredAppointmentWindow ?? "not provided"}`,
    `Customer description: ${job.description || "none"}`,
    "",
  ];
  if (assessment) {
    lines.push(
      "AI PHOTO TRIAGE (internal draft, unverified)",
      `Overall severity: ${assessment.overallSeverity}`,
      `Confidence: ${assessment.confidence}`,
      `Rough labor hours (internal): ${assessment.estimatedLaborHours}`,
      `Summary: ${assessment.summary}`,
      `Issues: ${assessment.issues.map((i) => `${i.area} [${i.severity}] ${i.notes}`).join("; ") || "none"}`,
      `Risk flags: ${assessment.riskFlags.map((r) => `${r.hazard} (${r.reason})`).join("; ") || "none"}`,
    );
  } else {
    lines.push("No AI triage available. Manual photo review required.");
  }
  return lines.map(escapeHtml).join("<br>");
}

async function uploadPhoto(intakeId: string, index: number, photo: Photo): Promise<string> {
  const token = await getSecret("hubspot_token");
  if (!token) {
    throw new Error("hubspot_token secret is not set");
  }
  const ext = photo.contentType === "image/png" ? "png" : photo.contentType === "image/webp" ? "webp" : "jpg";
  const form = new FormData();
  form.append(
    "file",
    new Blob([Buffer.from(photo.dataBase64, "base64")], { type: photo.contentType }),
    `photo-${index + 1}.${ext}`,
  );
  form.append("folderPath", `/electrical-intake/${intakeId}`);
  form.append("options", JSON.stringify({ access: "PRIVATE" }));
  const response = await fetch(`${BASE_URL}/files/v3/files`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    throw new Error(`HubSpot photo upload failed: ${response.status}`);
  }
  return ((await response.json()) as HubSpotObject).id;
}

export async function createNote(dealId: string, body: string, attachmentIds: string[] = []): Promise<string> {
  const properties: Record<string, string> = { hs_note_body: body, hs_timestamp: new Date().toISOString() };
  if (attachmentIds.length > 0) {
    properties.hs_attachment_ids = attachmentIds.join(";");
  }
  const note = await hubspot<HubSpotObject>("POST", "/crm/v3/objects/notes", {
    properties,
    associations: [association(dealId, ASSOC_NOTE_TO_DEAL)],
  });
  return note.id;
}

export async function createVerificationTask(dealId: string, urgent: boolean): Promise<string> {
  const task = await hubspot<HubSpotObject>("POST", "/crm/v3/objects/tasks", {
    properties: {
      hs_task_subject: "Estimator Verification Required",
      hs_task_body: "Review the intake note and photos, verify the assessment, and call the customer within 24 business hours.",
      hs_task_status: "NOT_STARTED",
      hs_task_priority: urgent ? "HIGH" : "MEDIUM",
      hs_timestamp: new Date().toISOString(),
    },
    associations: [association(dealId, ASSOC_TASK_TO_DEAL)],
  });
  return task.id;
}

/** Contact, then Deal, then Note, then Task. Throws on the first failure. */
export async function syncIntakeToHubSpot(
  job: Job,
  intakeId: string,
  assessment: ElectricalAssessment | null,
  photos: Photo[] = [],
): Promise<{ contactId: string; dealId: string }> {
  const contactId = await upsertContact(job);
  const dealId = await createDeal(job, intakeId, contactId);
  const ids: string[] = [];
  for (const [i, photo] of photos.entries()) {
    try {
      ids.push(await uploadPhoto(intakeId, i, photo));
    } catch {
      console.error(`HubSpot photo ${i + 1} upload failed for intake ${intakeId}`);
    }
  }
  let body = buildNoteBody(job, intakeId, assessment);
  if (photos.length > 0) {
    body += `<br>Photos attached to this note: ${ids.length} of ${photos.length}`;
  }
  await createNote(dealId, body, ids);
  await createVerificationTask(dealId, assessment?.overallSeverity === "urgent_safety");
  return { contactId, dealId };
}
