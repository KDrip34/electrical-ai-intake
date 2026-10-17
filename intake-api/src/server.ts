import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { Code, FileStorageFactory } from "anbaric";
import { intakeSchema } from "./schemas.js";
import { assessPhotos } from "./vision.js";
import { syncIntakeToHubSpot } from "./hubspot.js";
import { handleCors } from "./cors.js";
import { clientIp, createDailyCap, createRateLimiter } from "./limits.js";

const port = Number(process.env.PORT ?? 3000);
const MAX_BODY_BYTES = 25_000_000;

const files = FileStorageFactory.instance();
const intakeActor = new Code("intake-api");

// Abuse controls. These never reject a legitimate lead: a blocked visitor is
// told to retry or call, and the AI cap only skips the paid triage step.
const intakeLimiter = createRateLimiter(Number(process.env.INTAKE_RATE_LIMIT ?? 5), 10 * 60 * 1000);
const aiBudget = createDailyCap(Number(process.env.MAX_AI_CALLS_PER_DAY ?? 50));

class BodyTooLargeError extends Error {}

// Reads with events rather than `for await`: breaking out of that loop would
// destroy the socket before we could send the 413. On overflow we pause the
// stream and stop buffering; the caller answers, then closes the connection.
function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (Number(req.headers["content-length"]) > MAX_BODY_BYTES) {
      reject(new BodyTooLargeError());
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        chunks.length = 0;
        req.pause();
        req.removeAllListeners("data");
        reject(new BodyTooLargeError());
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

// A storage failure must never lose a lead: log a generic line (intake id and
// file name only, never request contents) and let the request carry on.
async function storeFile(intakeId: string, name: string, data: Uint8Array, contentType: string): Promise<void> {
  try {
    await files.put(intakeActor, `intake/${intakeId}/${name}`, data, contentType);
  } catch {
    console.error(`Storage write failed for intake ${intakeId}, file ${name}`);
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && req.url === "/api/estimate/intake") {
      if (!intakeLimiter.allow(clientIp(req))) {
        res.setHeader("retry-after", "600");
        sendJson(res, 429, {
          error: "too many requests",
          message: "We received several requests from your connection. Please try again in a few minutes or call our office.",
        });
        return;
      }
      const result = intakeSchema.safeParse(await readJson(req));
      if (!result.success) {
        sendJson(res, 400, { error: "invalid intake", details: result.error.issues });
        return;
      }

      const intakeId = randomUUID();
      for (const [i, photo] of result.data.photos.entries()) {
        await storeFile(intakeId, `photo-${i}`, Buffer.from(photo.dataBase64, "base64"), photo.contentType);
      }
      await storeFile(
        intakeId,
        "job.json",
        new TextEncoder().encode(JSON.stringify(result.data.job)),
        "application/json",
      );

      // Background work: AI triage, then CRM sync. The customer never waits on
      // it, and a failure here never rejects or loses their request.
      void (async () => {
        let assessment = null;
        if (aiBudget.take()) {
          try {
            assessment = await assessPhotos(result.data.job, result.data.photos);
          } catch {
            console.error(`AI triage failed for intake ${intakeId}`);
          }
        } else {
          console.warn("Daily AI triage cap reached; skipping AI for", intakeId);
        }
        if (assessment) {
          await storeFile(
            intakeId,
            "assessment.json",
            new TextEncoder().encode(JSON.stringify(assessment)),
            "application/json",
          );
        }
        try {
          const ids = await syncIntakeToHubSpot(result.data.job, intakeId, assessment, result.data.photos);
          console.log(`HubSpot sync ok for ${intakeId}: deal ${ids.dealId}`);
        } catch (error) {
          console.error("HubSpot sync failed:", error instanceof Error ? error.message : error);
        }
      })().catch(() => {
        console.error(`Background processing failed for intake ${intakeId}`);
      });

      // Customer-facing response: never include prices or estimates.
      sendJson(res, 202, {
        intakeId,
        status: "received",
        message:
          "Thank you for requesting a project assessment. To ensure dedicated oversight and tailored project planning, our electrical team personally reviews every request and will follow up within 24 business hours.",
      });
      return;
    }

    sendJson(res, 404, { error: "not found" });
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      // Stop the upload: close the connection once the 413 has been flushed.
      res.setHeader("connection", "close");
      res.once("finish", () => req.destroy());
      sendJson(res, 413, { error: "request too large" });
      return;
    }
    sendJson(res, 400, { error: "invalid request body" });
  }
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
