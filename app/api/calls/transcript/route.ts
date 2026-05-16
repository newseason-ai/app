import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";

type TurnPayload = {
  sessionId: string;
  speaker: "assistant" | "user";
  content: string;
  turnIndex: number;
  startedAtS: number;
};

function isValidPayload(v: unknown): v is TurnPayload {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.sessionId === "string" &&
    (o.speaker === "assistant" || o.speaker === "user") &&
    typeof o.content === "string" &&
    typeof o.turnIndex === "number" &&
    typeof o.startedAtS === "number"
  );
}

export async function POST(request: Request) {
  const secret = process.env.TRANSCRIPT_CALLBACK_SECRET;
  if (!secret) {
    console.error("[transcript] TRANSCRIPT_CALLBACK_SECRET is not set");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const provided = request.headers.get("x-newseason-signature") ?? "";
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    console.warn("[transcript] invalid signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!isValidPayload(payload)) {
    console.warn("[transcript] invalid payload", payload);
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  console.info("[transcript] turn received", {
    sessionId: payload.sessionId,
    speaker: payload.speaker,
    turnIndex: payload.turnIndex,
    contentLen: payload.content.length,
  });

  await db.transcriptTurn.create({
    data: {
      sessionId: payload.sessionId,
      speaker: payload.speaker,
      content: payload.content,
      turnIndex: payload.turnIndex,
      startedAtS: payload.startedAtS,
    },
  });

  return NextResponse.json({ ok: true });
}
