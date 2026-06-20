# New Season AI

Voice customer research for startups. Operators create short interview templates, send unique links to respondents, and review transcripts, findings, and synthesized insights in a dashboard. Respondents talk for ~90 seconds in the browser — no app install, no scheduling.

## Architecture

```
Operator (dashboard)          Respondent (/r/[token])
        │                              │
        ▼                              ▼
   Next.js app  ◄──── transcripts ──── LiveKit agent worker
        │         (signed POST)              │
        │                                    ▼
        ├──── Postgres (Prisma)         OpenAI Realtime
        ├──── Supabase Auth
        └──── LiveKit (rooms + webhooks)
```

1. **Next.js app** — marketing site, operator dashboard, respondent flow, and API routes.
2. **LiveKit agent** (`agent/`) — joins interview rooms, runs the OpenAI Realtime voice model, and streams transcript turns back to the app.
3. **Post-call processing** — when LiveKit fires a `room_finished` webhook, the app marks the session complete and generates per-session findings and template-level insights via OpenAI.

## Repo layout

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router pages and API routes |
| `lib/` | Database, Supabase, queries, findings/insights generation |
| `prisma/` | Postgres schema |
| `agent/` | LiveKit Cloud agent worker (separate Node package) |
| `proxy.ts` | Auth gate — protects `/dashboard` and `/onboarding` via Supabase |

## Prerequisites

- Node.js 20+
- Postgres database
- [Supabase](https://supabase.com) project (auth)
- [LiveKit Cloud](https://livekit.io) project with an agent named `interviewer`
- OpenAI API key with Realtime access

## Environment variables

Copy the example files and fill in your credentials:

```bash
cp .env.example .env
cp agent/.env.example agent/.env
```

| File | Purpose |
|------|---------|
| `.env.example` → `.env` | Next.js app (database, auth, LiveKit, OpenAI) |
| `agent/.env.example` → `agent/.env` | LiveKit voice worker |

`TRANSCRIPT_CALLBACK_SECRET` must be identical in both files. In production, set `TRANSCRIPT_CALLBACK_URL` to your deployed app origin and configure a LiveKit webhook for `room_finished` → `https://your-app/api/webhooks/livekit`.

## Local development

Install dependencies for both packages:

```bash
npm install
cd agent && npm install && cd ..
```

Sync the database schema:

```bash
npx prisma db push
```

Run the app and agent in separate terminals:

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — LiveKit agent worker
cd agent && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in at `/login`, complete onboarding, then create an interview and send a link from the dashboard. The respondent opens `/r/[token]` to start a voice session.

## Scripts

**Root (Next.js)**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

**Agent**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start agent worker in dev mode |
| `npm run start` | Start agent worker in production |
| `npm run typecheck` | TypeScript check |

## Key routes

| Route | Who | Description |
|-------|-----|-------------|
| `/` | Public | Marketing landing page |
| `/login` | Public | Supabase magic-link sign-in |
| `/onboarding` | Operator | First-time company + interview setup |
| `/dashboard` | Operator | Sessions, interviews, insights |
| `/r/[token]` | Respondent | Branded voice interview flow |
| `/api/calls/start` | Respondent | Creates LiveKit room and dispatches agent |
| `/api/calls/transcript` | Agent | Receives signed transcript turns |
| `/api/webhooks/livekit` | LiveKit | Handles `room_finished`, triggers findings |

## Stack

- **Next.js 16** + React 19 + Tailwind CSS 4
- **Prisma 7** + Postgres
- **Supabase** (SSR auth)
- **LiveKit** (WebRTC rooms, agent dispatch, webhooks)
- **OpenAI Realtime** (voice interviews) and chat completions (findings/insights)
