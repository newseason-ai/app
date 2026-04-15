import { NextResponse } from "next/server";

import { SessionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";

/** Prisma + `pg` require Node (not Edge). */
export const runtime = "nodejs";

/**
 * Vapi Server URL POST body shape (see https://docs.vapi.ai/server-url/events):
 * `{ "message": { "type": "<server-message-type>", "call": { ... }, ... } }`
 *
 * End-of-call payload (docs): `message.type === "end-of-call-report"` with
 * `message.endedReason`, `message.call` (Call object, includes `id`),
 * `message.artifact.transcript` (string) and `message.artifact.messages`
 * (`{ "role": "assistant" | "user", "message": string }[]`).
 * Some stacks use `call-ended`; we treat that the same for compatibility.
 */
const CALL_END_MESSAGE_TYPES = new Set(["end-of-call-report", "call-ended"]);

function ok() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function messageTextFromArtifactEntry(entry: Record<string, unknown>): string {
  if (typeof entry.message === "string") return entry.message;
  const content = entry.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (isRecord(part) && typeof part.text === "string") return part.text;
        return "";
      })
      .join("");
  }
  return "";
}

function extractTurnsFromArtifact(artifact: unknown): {
  speaker: string;
  content: string;
  turnIndex: number;
}[] {
  if (!isRecord(artifact)) return [];
  const raw = artifact.messages;
  if (!Array.isArray(raw)) return [];

  const turns: { speaker: string; content: string; turnIndex: number }[] = [];
  let turnIndex = 0;
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const role = item.role;
    const speaker = typeof role === "string" ? role : "unknown";
    const content = messageTextFromArtifactEntry(item).trim();
    if (!content) continue;
    turns.push({ speaker, content, turnIndex });
    turnIndex += 1;
  }
  return turns;
}

function callDurationSeconds(call: Record<string, unknown> | undefined): number | null {
  if (!call) return null;
  const d = call.duration;
  if (typeof d === "number" && Number.isFinite(d)) return Math.round(d);
  if (typeof d === "string" && d.trim() !== "") {
    const n = Number(d);
    if (Number.isFinite(n)) return Math.round(n);
  }
  const startedAt = call.startedAt;
  const endedAt = call.endedAt;
  if (typeof startedAt === "string" && typeof endedAt === "string") {
    const a = Date.parse(startedAt);
    const b = Date.parse(endedAt);
    if (Number.isFinite(a) && Number.isFinite(b) && b >= a) {
      return Math.round((b - a) / 1000);
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    // TODO: Verify Vapi webhook signature (e.g. compare cryptographic signature
    // from raw request body against `VAPI_WEBHOOK_SECRET` / Vapi’s documented header).

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      console.warn("[vapi webhook] invalid JSON body");
      return ok();
    }

    if (!isRecord(body)) {
      return ok();
    }

    const message = isRecord(body.message) ? body.message : body;
    const eventType = message.type;

    if (typeof eventType !== "string" || !CALL_END_MESSAGE_TYPES.has(eventType)) {
      return ok();
    }

    const call = isRecord(message.call) ? message.call : undefined;
    const callId = call && typeof call.id === "string" ? call.id : undefined;
    if (!callId) {
      console.warn("[vapi webhook] call-ended report missing call.id");
      return ok();
    }

    const endedReason =
      (typeof message.endedReason === "string" && message.endedReason) ||
      (call && typeof call.endedReason === "string" && call.endedReason) ||
      "unknown";

    const durationS = callDurationSeconds(call);

    const turns = extractTurnsFromArtifact(message.artifact);

    console.info("[vapi webhook] call end", {
      callId,
      endedReason,
      durationS,
      turnCount: turns.length,
    });

    const session = await db.session.findFirst({
      where: { vapiCallId: callId },
    });

    if (!session) {
      console.warn(
        "[vapi webhook] no Session for vapiCallId — skipping persist",
        callId,
      );
      return ok();
    }

    const endedAt = new Date();

    await db.$transaction(async (tx) => {
      await tx.session.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.completed,
          endedAt,
          durationS,
        },
      });

      // Replace turns so a redelivered webhook does not duplicate rows.
      await tx.transcriptTurn.deleteMany({ where: { sessionId: session.id } });

      if (turns.length > 0) {
        await tx.transcriptTurn.createMany({
          data: turns.map((t) => ({
            sessionId: session.id,
            speaker: t.speaker,
            content: t.content,
            turnIndex: t.turnIndex,
            startedAtS: 0,
          })),
        });
      }
    });

    return ok();
  } catch (err) {
    console.error("[vapi webhook] error", err);
    return ok();
  }
}
