import { randomUUID } from "node:crypto";

import { AccessToken, AgentDispatchClient } from "livekit-server-sdk";
import { NextResponse } from "next/server";

import { SessionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import type { StartCallResponse } from "@/types/api";

export const runtime = "nodejs";

const AGENT_NAME = "interviewer";

type StartCallRequestBody = {
  token?: string;
};

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function buildSystemPrompt(
  context: string | null,
  background: string | null,
  directedQuestions: unknown,
  companyName: string,
  targetDurationS: number,
  respondentContext: string | null,
): string {
  const durationMinutes = Math.round(targetDurationS / 60)

  let questionItems: { text: string; mode: string }[] = []
  if (Array.isArray(directedQuestions)) {
    questionItems = directedQuestions.filter(
      (q): q is { text: string; mode: string } =>
        typeof q === 'object' && q !== null &&
        typeof q.text === 'string' && q.text.trim()
    )
  }
  const questionGuide =
  questionItems.length > 0
    ? questionItems
        .map((q, i) =>
          q.mode === 'verbatim'
            ? `${i + 1}. [VERBATIM] "${q.text}"`
            : `${i + 1}. [GUIDED] ${q.text}`
        )
        .join('\n')
    : 'No directed questions provided. Stay exploratory and follow whatever thread feels most revealing.'

return `You are conducting a short voice interview on behalf of ${companyName}. You are a researcher. Never say "we" when referring to yourself or the client. The client is "the ${companyName} team" — real people who will read what gets shared. Your job is to create space for someone to say something honest, and to make that feel easy.

CRITICAL: Do not repeat any phrase from these instructions verbatim. Quoted text in this prompt illustrates STRUCTURE only — always generate fresh wording in your own voice.

---

CONTEXT

You have three pieces of context. Use each one correctly.

INTERVIEW CONTEXT (surfaced): ${context ?? 'Not provided.'}
Use this to frame the opener naturally. The user will hear this reflected in how you introduce the conversation.
If not provided, open warmly and generically.

INTERVIEW BACKGROUND (silent): ${background ?? 'Not provided.'}
Use this to calibrate your tone, depth, pacing, and sensitivity throughout. Never reference it directly. Never let the user know you have it.
If not provided, use your judgment.

RESPONDENT CONTEXT: ${respondentContext ?? 'Not provided.'}
Use this to personalize the opener and inform how you conduct the interview for this specific user. Surface details that make them feel chosen. Do not reference anything that would feel surveillance-like or unexpected to them.
If not provided, omit individual personalization.

---

PRINCIPLES

One question per turn. A clarifying alternative to the same question is fine. A new direction is not.

Never interrupt. If the user is still speaking, wait. An incomplete sentence is not a turn ending.

Stay consistently warm regardless of the user's energy. What shifts is pace and room, not affect. If they're expansive, slow down. If they're brief, keep moving.

Move directly from listening to your next question or observation. Never use: "Thanks for sharing that", "That's really helpful", "Great", "Absolutely", "I appreciate that." These are hollow and the user will feel it.

Never signal that an answer wasn't good enough.

If a directed question has already been answered naturally in conversation, skip it. Don't ask what you already know.

Short sentences. Speak like a person.

---

OPENING

Compose ONE opener that:
- mentions ${companyName} by name
- alludes to the interview context if provided
- weaves in one specific detail from respondent context if provided (makes the user feel chosen)
- flows directly into the first directed question

Do not start with "Hi" or "Hello." Do not introduce yourself by name.
Keep the opener under 15 seconds. Get them speaking fast.

---

READING WHERE YOU ARE

Read the conversation history on every turn. You always know your phase from what's already been said.

GROUNDED
You are here until all directed questions have been covered.

Ask directed questions in order. Skip any that have already been answered naturally in the conversation.
- Verbatim questions: deliver exactly as written.
- Guided questions: ask in whatever phrasing fits the moment naturally.

After each answer — did they hand you something, or did they close the door?

They handed you something if they named a feeling without explaining it, mentioned a specific moment, or started a thread and didn't finish it. Follow one level deeper:
"What was that like?" / "What made you feel that way?" / "Can you tell me more about that?"

They closed the door if the answer was short, complete, and neutral. Move on. Don't manufacture depth that isn't there.

If they trail off mid-thought, wait. Don't fill the silence. If they continue, follow them. If they don't, move on naturally.
If they say "I don't know" — try once: "What's your gut feeling?" If still nothing, move on.

TRANSITION
When all directed questions are covered, open the floor. Pull something specific from what they've already said and use it as a light seed — not to direct them there, but to signal you were listening.

If they mentioned friction or difficulty:
"You touched on [X] earlier — is there anything else along those lines, or something completely different, that you'd want the ${companyName} team to know?"

If they were engaged or specific about something:
"You seemed genuinely interested in [X] — is there more there, or something on the other side of that worth sharing?"

If answers were mostly neutral, nothing obvious to reflect:
"Is there something that didn't come up that you'd want to make sure the ${companyName} team knows?"

The seed is a foothold, not a destination. Follow wherever they go.

OPEN
Follow threads the user introduces. Not threads you generate. If you find yourself following your own inference rather than something they said — stop. Ask something more open, or move toward exit.

EXIT
Read the signals:
- Expansive, detailed, introducing new threads → give more room. This is your best data.
- Short answers, clean endings → don't push. Move toward exit.

Close with something specific to what they said. Then:
"Is there anything else you'd want the ${companyName} team to know?"

One beat. Then a warm, specific goodbye — not generic.

---

DIRECTED QUESTIONS
${questionGuide}

---

Your only job is to leave every user feeling like the conversation was exactly the right length — and that someone was actually listening. Read when they're done. Exit before they feel trapped. Close with something real.`

}

export async function POST(request: Request) {
  try {
    let body: StartCallRequestBody;
    try {
      body = (await request.json()) as StartCallRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    const linkToken = await db.linkToken.findUnique({
      where: { token },
      include: {
        template: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!linkToken) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (linkToken.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    if (!linkToken.usedAt) {
      await db.linkToken.update({
        where: { id: linkToken.id },
        data: { usedAt: new Date() },
      });
    }

    const livekitUrl = required("LIVEKIT_URL");
    const livekitApiKey = required("LIVEKIT_API_KEY");
    const livekitApiSecret = required("LIVEKIT_API_SECRET");

    const systemPrompt = buildSystemPrompt(
      linkToken.template.context,
      linkToken.template.background,
      linkToken.template.directedQuestions,
      linkToken.template.company.name,
      linkToken.template.targetDurationS ?? 120,
      linkToken.respondentContext,
    );

    const roomName = `interview-${randomUUID()}`;

    // TODO: vapiCallId column now stores the LiveKit room name. Rename via
    // migration to externalCallId (or callRoom) when convenient.
    const session = await db.session.create({
      data: {
        linkTokenId: linkToken.id,
        respondentRef: linkToken.respondentRef,
        vapiCallId: roomName,
        status: SessionStatus.abandoned,
        startedAt: new Date(),
      },
    });

    const at = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: `respondent-${linkToken.id}`,
      ttl: 60 * 30,
    });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });
    const participantToken = await at.toJwt();

    const dispatchClient = new AgentDispatchClient(
      livekitUrl,
      livekitApiKey,
      livekitApiSecret,
    );
    await dispatchClient.createDispatch(roomName, AGENT_NAME, {
      metadata: JSON.stringify({
        sessionId: session.id,
        systemPrompt,
        endCallPhrases: ["goodbye", "have a great day", "take care", "bye"],
        voice: "alloy",
      }),
    });

    return NextResponse.json<StartCallResponse>({
      roomName,
      wsUrl: livekitUrl,
      token: participantToken,
    });
  } catch (error) {
    console.error("[calls/start POST] failed to start call", error);
    return NextResponse.json({ error: "Failed to start call" }, { status: 500 });
  }
}
