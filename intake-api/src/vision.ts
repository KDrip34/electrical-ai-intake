import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ELECTRICAL_TRIAGE_SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";
import { electricalAssessmentSchema } from "./schemas.js";
import { getSecret } from "./secrets.js";
import type { ElectricalAssessment, Job, Photo } from "./schemas.js";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

/**
 * Runs AI triage on the submitted photos.
 * Returns null when triage is not possible (no key, no photos, model or parse
 * failure). A null result must never block or reject a customer's intake;
 * the estimator simply reviews it manually.
 */
export async function assessPhotos(
  job: Job,
  photos: Photo[],
): Promise<ElectricalAssessment | null> {
  if (photos.length === 0) {
    return null;
  }
  const apiKey = await getSecret("anthropic_api_key");
  if (!apiKey) {
    return null;
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      system: ELECTRICAL_TRIAGE_SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(electricalAssessmentSchema) },
      messages: [
        {
          role: "user",
          content: [
            ...photos.map((photo) => ({
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: photo.contentType,
                data: photo.dataBase64,
              },
            })),
            { type: "text" as const, text: buildUserPrompt(job) },
          ],
        },
      ],
    });

    const parsed = electricalAssessmentSchema.safeParse(response.parsed_output);
    if (!parsed.success) {
      console.error("Vision output failed validation:", parsed.error.issues);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error("Vision triage failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
