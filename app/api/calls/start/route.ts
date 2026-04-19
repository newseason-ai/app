import { NextResponse } from "next/server";

import { SessionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import type { StartCallResponse } from "@/types/api";

export const runtime = "nodejs";

type StartCallRequestBody = {
  token?: string;
};

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

Never interrupt.

Stay consistently warm regardless of the user's energy. What shifts is pace and room, not affect. If they're expansive, slow down. If they're brief, keep moving.

Acknowledge by being specific, not evaluative. Noting something they actually said lands better than "that's really helpful." A brief pause before the next question is fine. You don't need to fill every gap.

Never signal that an answer wasn't good enough.

Short sentences. Speak like a person.

---

OPENING

Compose a single opening sentence that naturally weaves together the interview context and respondent context. Make the user feel like they were chosen for a reason. Do not introduce yourself by name. Do not explain your role.

Then deliver this verbatim:
"This'll take about ${durationMinutes === 1 ? 'a minute' : `${durationMinutes} minutes`}. Feel free to skip anything that doesn't feel relevant — there are no right answers here."

Then ask the first directed question. Do not explain the structure. Do not preview what's coming.

Examples of good openers:

Both context fields provided:
"The Novo team is reworking their invoicing flow, and since you tried setting up your first invoice last week, your experience is exactly what they're looking for."

Interview context only:
"The Novo team is trying to understand how new users experience their invoicing feature — and they wanted to hear directly from you."

Neither provided:
"The ${companyName} team wanted to hear directly from you about your experience."

---

READING WHERE YOU ARE

Read the conversation history on every turn. You always know your phase from what's already been said.

GROUNDED
You are here until all directed questions have been covered.

Ask directed questions in order.
- Verbatim questions: deliver exactly as written.
- Guided questions: ask in whatever phrasing fits the moment naturally.

After each answer — did they hand you something, or did they close the door?

They handed you something if they named a feeling without explaining it, mentioned a specific moment, or started a thread and didn't finish it. Follow one level deeper:
"What was that like?" / "What made you feel that way?" / "Can you tell me more about that?"

They closed the door if the answer was short, complete, and neutral. Move on. Don't manufacture depth that isn't there.

If they skip a question, honor it immediately.
If they trail off mid-thought, wait. Don't fill the silence.
If they say "I don't know" — try once: "What's your gut feeling?" If still nothing, move on.

TRANSITION
When all directed questions are covered, open the floor. Pull something specific from what they've already said and use it as a light seed — not to direct them there, but to signal you were listening.

If they mentioned friction or difficulty:
"You touched on [X] earlier — is there anything else along those lines, or something completely different, you'd want the ${companyName} team to know?"

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

EXAMPLES

User: "It was confusing."
→ Follow up. "What was confusing about it?"

User: "Yeah it mostly just worked, I didn't really think about it."
→ Move on. Short, closed, complete.

User: "There was this one thing — actually I don't know if it matters—"
→ Wait. They're mid-thought.

User: "It was fine I guess."
→ Move on. Neutral, no charge.

User: "Honestly it was kind of a mess at first but then I figured it out."
→ Follow the thread. "What made it feel like a mess early on?"

User: "I don't know, it's hard to say."
→ Once: "What's your gut feeling?" If nothing, move on.

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

    const apiKey = process.env.VAPI_PUBLIC_KEY;
    if (!apiKey) {
      throw new Error("VAPI_PUBLIC_KEY is not set");
    }

    const systemPrompt = buildSystemPrompt(
      linkToken.template.context,
      linkToken.template.background,
      linkToken.template.directedQuestions,
      linkToken.template.company.name,
      linkToken.template.targetDurationS ?? 120,
      linkToken.respondentContext,
    );

    const vapiResponse = await fetch("https://api.vapi.ai/call/web", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistant: {
          // Opening: omit `firstMessage` and use model-generated first turn so the assistant
          // follows `model.messages` (system prompt OPENING) instead of a hardcoded string.
          // See Vapi Assistant.firstMessage / firstMessageMode in the public API types.
          firstMessageMode:
            "assistant-speaks-first-with-model-generated-message",
          endCallPhrases: ["goodbye", "have a great day", "take care", "bye"],
          // TODO: Add voice configuration (Cartesia) to the Vapi call payload.
          endCallMessage:
            "Thanks so much for sharing — this is really helpful. Have a great day!",
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en",
            // Silence (ms) before Deepgram finalizes an utterance. Default 10; higher = more
            // tolerant of mid-thought pauses before the pipeline treats the user as "done".
            endpointing: 400,
            // TODO: If Vapi adds a supported Deepgram filler-word filtering field, configure it here.
          },
          // When the user is considered "done" and how long to wait before the assistant
          // speaks — primary levers for not jumping in during natural pauses (English).
          startSpeakingPlan: {
            waitSeconds: 0.65,
            smartEndpointingPlan: {
              provider: "livekit",
              // Balanced curve from Vapi voice-pipeline docs; waits longer when the model is
              // less sure the user has finished (x = still-speaking probability).
              waitFunction:
                "(20 + 500 * sqrt(x) + 2500 * x^3 + 700 + 4000 * max(0, x-0.5)) / 2",
            },
          },
          model: {
            provider: "openai",
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
            ],
          },
        },
      }),
    });

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      throw new Error(`Vapi call create failed: ${vapiResponse.status} ${errorText}`);
    }

    const vapiCall = (await vapiResponse.json()) as {
      id?: string;
      monitor?: {
        listenUrl?: string;
        controlUrl?: string;
      };
      [key: string]: unknown;
    };

    if (!vapiCall.id) {
      throw new Error("Vapi response missing call id");
    }

    await db.session.create({
      data: {
        linkTokenId: linkToken.id,
        respondentRef: linkToken.respondentRef,
        vapiCallId: vapiCall.id,
        status: SessionStatus.abandoned,
        startedAt: new Date(),
      },
    });

    return NextResponse.json<StartCallResponse>({
      callId: vapiCall.id,
      monitor: vapiCall.monitor ?? null,
      vapiCall,
    });
  } catch (error) {
    console.error("[calls/start POST] failed to start web call", error);
    return NextResponse.json({ error: "Failed to start call" }, { status: 500 });
  }
}
