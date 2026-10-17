import { z } from "zod";

export const serviceTypeSchema = z.enum([
  "panel_upgrade",
  "subpanel",
  "ev_charger",
  "whole_house_rewiring",
  "adu",
  "other",
]);

export const jobSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email(),
  address: z.string().min(1),
  zip: z.string().min(1).max(10),
  serviceType: serviceTypeSchema,
  panelAmperage: z.string().max(20).optional(),
  preferredAppointmentWindow: z.string().max(200).optional(),
  description: z.string().max(2000).default(""),
});

export type Job = z.infer<typeof jobSchema>;

export const photoSchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  // ~3 MB decoded. The website downsizes photos to <1600px JPEG, so real
  // photos are far smaller. The character check is a single linear-time class
  // scan (no nested quantifiers), safe on multi-MB strings.
  dataBase64: z
    .string()
    .min(1)
    .max(4_000_000, "photo is too large (max about 3 MB)")
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, "photo data must be base64"),
});

export type Photo = z.infer<typeof photoSchema>;

export const intakeSchema = z.object({
  job: jobSchema,
  photos: z.array(photoSchema).max(8).default([]),
});

export type Intake = z.infer<typeof intakeSchema>;

export const severitySchema = z.enum([
  "routine",
  "needs_repair",
  "urgent_safety",
]);

export type Severity = z.infer<typeof severitySchema>;

export const issueSchema = z.object({
  area: z.string().min(1),
  severity: severitySchema,
  notes: z.string(),
});

export const riskFlagSchema = z.object({
  hazard: z.string().min(1),
  reason: z.string().min(1),
});

export const electricalAssessmentSchema = z.object({
  issues: z.array(issueSchema),
  riskFlags: z.array(riskFlagSchema),
  overallSeverity: severitySchema,
  estimatedLaborHours: z.number().min(0),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
});

export type ElectricalAssessment = z.infer<typeof electricalAssessmentSchema>;
