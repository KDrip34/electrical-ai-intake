# AI Photo Intake & Triage for an Electrical Contractor

Homeowners upload photos of an electrical problem. Claude analyzes the photos, flags safety hazards, and drops a structured assessment into a HubSpot deal that a human estimator verifies before anyone quotes a price.

> **Portfolio version.** This is an anonymized copy of a production system I built for a real Northern California electrical contractor. The client's name, logo, license number, and live URLs have been replaced with a fictional brand ("Voltline Electric"). All application code is the same.

## What I built

- **Customer website** (Next.js, Tailwind v4, shadcn/ui on Base UI, Magic UI): service pages, a multi-step intake form, drag-and-drop photo upload, and a confirmation screen with a next-steps tracker.
- **Intake API** (Node.js + TypeScript): validates submissions, rate-limits by IP, caps daily AI spend, and calls Claude for vision + triage in one request.
- **CRM integration** (HubSpot Free): creates the contact and deal, attaches photos, posts the AI assessment as a deal note, and opens an "Estimator Verification Required" task.

## Architecture

```
website (Next.js, Vercel)
   │  POST /api/estimate/intake  (photos + job details)
   ▼
intake-api (Node/TypeScript, Render)
   │  validation · rate limit · daily AI cap · CORS allowlist
   ▼
Claude (vision + triage): visible issues, severity, urgent safety flags
   │
   ▼
HubSpot Free: contact + deal → note + photos → estimator task
```

## Design decisions

| Decision | Why |
|---|---|
| Customer never sees a price | AI output is a triage aid, not a quote. A licensed estimator signs off on every job. |
| One model for vision + reasoning | Fewer moving parts. The prompt restricts Claude to what is *visible* and forbids guessing about hidden wiring. |
| HubSpot Free, notes + tasks | No custom objects on the free tier, so assessments live as structured notes with an estimator task. |
| Spend and abuse controls | Per-IP rate limit, `MAX_AI_CALLS_PER_DAY`, trusted-proxy-aware client IPs, strict CORS origin list. |
| Secrets never in code | Loaded from the platform secret store, falling back to env vars. `.env*` is git-ignored. |

## Run it locally

Requires Node.js 20+.

```bash
# API
cd intake-api && npm install && npm run dev        # port 3000, reads intake-api/.env

# Website
cd website && npm install && npm run dev -- -p 3001
```

`intake-api/.env` (names only): `ANTHROPIC_API_KEY`, `HUBSPOT_TOKEN`; optional `ANTHROPIC_MODEL`, `ALLOWED_ORIGINS`, `INTAKE_RATE_LIMIT`, `MAX_AI_CALLS_PER_DAY`, `TRUSTED_PROXY_HOPS`, `HUBSPOT_DEAL_PIPELINE`, `HUBSPOT_DEAL_STAGE`.
Website env: `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`).

## Deployment

- **API on Render:** root `intake-api`, build `npm ci --include=dev && npm run build`, start `npm start`, health check `GET /health`.
- **Website on Vercel:** root `website`, set `NEXT_PUBLIC_API_URL` to the API URL (no trailing slash).

## Skills demonstrated

TypeScript · Next.js · REST API design · multimodal LLM integration · prompt design for safety-critical output · CRM automation · input validation · rate limiting · secrets management · CORS · cloud deployment (Vercel, Render)

## Author

**Kendrick Ekejiuba** · Engineering Technology (Computer Systems Network Management), San José State University
