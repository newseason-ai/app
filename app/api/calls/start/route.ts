import { NextResponse } from "next/server";

import { SessionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import type { StartCallResponse } from "@/types/api";

export const runtime = "nodejs";

type StartCallRequestBody = {
  token?: string;
};

function buildSystemPrompt(
  openingPrompt: string,
  directedQuestions: unknown,
  companyName: string,
): string {
  // TODO: Prompt engineering iteration point — tune based on partner feedback,
  // transcript quality, and completion rates. Consider A/B testing personas.

  let directedQuestionItems: string[] = [];
  if (Array.isArray(directedQuestions)) {
    directedQuestionItems = directedQuestions
      .map((q) => (typeof q === "string" ? q.trim() : ""))
      .filter(Boolean);
  } else if (typeof directedQuestions === "string" && directedQuestions.trim()) {
    directedQuestionItems = [directedQuestions.trim()];
  }

  const questionGuide = directedQuestionItems.length > 0
    ? [
        "Areas to explore (use as inspiration, not a script — if the conversation goes somewhere more interesting, follow it):",
        ...directedQuestionItems.map((q) => `- ${q}`),
      ].join("\n")
    : "No directed questions provided. Stay exploratory and follow whatever thread feels most revealing.";

  return [
    `You are a warm, curious product researcher conducting a short voice interview on behalf of ${companyName}. You sound like a thoughtful colleague who genuinely wants to understand someone's experience — not a call center agent running through a checklist.`,
    "",
    "Your goal is to surface honest, specific insights about what's working and what isn't. You're comfortable with silence. You follow threads. You don't rush.",
    "",
    "Interview structure:",
    "- Opening: introduce yourself briefly in one sentence, then ask the opening question exactly as written below.",
    "- Core: follow up naturally. If someone gives a short answer, probe one level deeper before moving on. Ask 'what made you say that?' or 'can you walk me through that?' rather than jumping to the next topic.",
    "- Close: around 2 minutes in, acknowledge what's been shared warmly and ask if they have anything else to add, or if they're happy to wrap up.",
    "",
    questionGuide,
    "",
    "Voice and style:",
    "- One question per turn, always. Never stack questions.",
    "- Short sentences. Natural pauses. Conversational, not formal.",
    "- Never interrupt.",
    "- Don't parrot their words back verbatim — it sounds hollow.",
    "- If they say 'I don't know', try 'what's your gut feeling?' or gently move on.",
    "- You sound genuinely interested, because you are.",
    "",
    `Opening question — ask this verbatim to start: "${openingPrompt}"`,
    "",
    "Call ending:",
    "- After the close, deliver a brief warm goodbye and naturally conclude. Something like 'This has been really helpful — thanks so much for your time.'",
    "- The platform handles technical call termination when the conversation is complete.",
  ].join("\n");
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

    // TODO: inject template.context and linkToken.respondentContext into system prompt
    // template.context → general background about the company/product (applies to all sessions)
    // linkToken.respondentContext → per-respondent context for this specific call
    // See handoff doc section 10 for details
    const systemPrompt = buildSystemPrompt(
      linkToken.template.openingPrompt,
      linkToken.template.directedQuestions,
      linkToken.template.company.name,
    );

    const vapiResponse = await fetch("https://api.vapi.ai/call/web", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistant: {
          firstMessage: `Hi! Thanks for taking a moment to share your feedback with ${linkToken.template.company.name}. I'd love to hear what you thought.`,
          endCallPhrases: ["goodbye", "have a great day", "take care", "bye"],
          // TODO: Add voice configuration (Cartesia) to the Vapi call payload.
          endCallMessage:
            "Thanks so much for sharing — this is really helpful. Have a great day!",
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en",
            // TODO: If Vapi adds a supported Deepgram filler-word filtering field, configure it here.
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
