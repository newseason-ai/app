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
  // TODO: Replace this with structured prompt engineering and phase-aware instructions.
  const directedQuestionsText =
    typeof directedQuestions === "string"
      ? directedQuestions
      : JSON.stringify(directedQuestions);

  return [
    `You are a voice interviewer collecting product feedback for ${companyName}.`,
    "",
    `Opening prompt: ${openingPrompt}`,
    `Directed questions: ${directedQuestionsText ?? "[]"}`,
    "",
    "Keep the conversation concise, natural, and empathetic.",
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

    const apiKey = process.env.VAPI_API_KEY;
    if (!apiKey) {
      throw new Error("VAPI_API_KEY is not set");
    }

    const systemPrompt = buildSystemPrompt(
      linkToken.template.openingPrompt,
      linkToken.template.directedQuestions,
      linkToken.template.company.name,
    );

    const vapiResponse = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "webCall",
        assistant: {
          // TODO: Add voice configuration (Cartesia) to the Vapi call payload.
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
