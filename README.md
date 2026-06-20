# New Season AI

Voice customer research for startups. Operators create short interview templates, send unique links to respondents, and review transcripts, findings, and synthesized insights in a dashboard. Respondents talk for ~90 seconds in the browser — no app install, no scheduling.

## Architecture

```
Operator (dashboard)          Respondent (/r/[token])
        │                              │
        ▼                              ▼
   Next.js app  ◄──── webhook ────── Vapi (voice AI)
        │         (end-of-call)            │
        │                                  ▼
        ├──── Postgres (Prisma)      Browser WebRTC
        ├──── Supabase Auth          (@vapi-ai/web SDK)
        └──── OpenAI (findings/insights)
```

1. **Next.js app** — marketing site, operator dashboard, respondent flow, and API routes.
2. **Vapi** — hosts the voice conversation in the browser. The app creates a web call via the Vapi API and connects the respondent with the Vapi Web SDK.
3. **Post-call processing** — when Vapi sends an `end-of-call-report` webhook, the app saves the transcript, marks the session complete, and generates per-session findings and template-level insights via OpenAI.

There is no separate agent worker on this branch — voice is fully managed by Vapi.

## Repo layout

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router pages and API routes |
| `lib/` | Database, Supabase, queries, findings/insights generation |
| `prisma/` | Postgres schema |
| `proxy.ts` | Auth gate — protects `/dashboard` and `/onboarding` via Supabase |

## Prerequisites

- Node.js 20+
- Postgres database
- [Supabase](https://supabase.com) project (auth)
- [Vapi](https://vapi.ai) account with web call access
- OpenAI API key (findings and insights generation)

## Environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Where used | Description |
|----------|------------|-------------|
| `DATABASE_URL` | Server | Postgres connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Supabase anon key |
| `NEXT_PUBLIC_BASE_URL` | Server | Public app URL (for respondent links) |
| `VAPI_PUBLIC_KEY` | Server | Vapi API key — creates web calls in `/api/calls/start` |
| `NEXT_PUBLIC_VAPI_KEY` | Client | Vapi public key — connects browser to calls |
| `OPENAI_API_KEY` | Server | Generates findings and insights after calls |

In the [Vapi dashboard](https://dashboard.vapi.ai), set the **Server URL** to your app's webhook endpoint:

- Local dev (with a tunnel): `https://your-tunnel.example/api/webhooks/vapi`
- Production: `https://your-domain/api/webhooks/vapi`

Vapi must be able to reach this URL to deliver end-of-call transcripts.

## Local development

Install dependencies:

```bash
npm install
```

Sync the database schema:

```bash
npx prisma db push
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in at `/login`, complete onboarding, then create an interview and send a link from the dashboard. The respondent opens `/r/[token]` to start a voice session.

**Note:** Vapi webhooks require a publicly reachable URL. For local testing, use a tunnel (e.g. ngrok, Cloudflare Tunnel) and point Vapi's Server URL at it.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Key routes

| Route | Who | Description |
|-------|-----|-------------|
| `/` | Public | Marketing landing page |
| `/login` | Public | Supabase magic-link sign-in |
| `/onboarding` | Operator | First-time company + interview setup |
| `/dashboard` | Operator | Sessions, interviews, insights |
| `/r/[token]` | Respondent | Branded voice interview flow |
| `/api/calls/start` | Respondent | Creates a Vapi web call with the interview prompt |
| `/api/webhooks/vapi` | Vapi | Handles `end-of-call-report`, saves transcript, triggers findings |

## Stack

- **Next.js 16** + React 19 + Tailwind CSS 4
- **Prisma 7** + Postgres
- **Supabase** (SSR auth)
- **Vapi** (browser voice calls via `@vapi-ai/web`)
- **OpenAI** (post-call findings and insights)
