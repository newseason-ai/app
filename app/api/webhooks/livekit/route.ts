import { WebhookReceiver } from "livekit-server-sdk";
import { NextResponse } from "next/server";

import { SessionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import { generateFindings } from "@/lib/findings";

export const runtime = "nodejs";

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const receiver =
  apiKey && apiSecret ? new WebhookReceiver(apiKey, apiSecret) : null;

function ok() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function POST(request: Request) {
  if (!receiver) {
    console.error("[livekit webhook] LIVEKIT_API_KEY/SECRET not set");
    return ok();
  }

  let event;
  try {
    const body = await request.text();
    const auth = request.headers.get("authorization") ?? "";
    event = await receiver.receive(body, auth);
  } catch (err) {
    console.warn("[livekit webhook] signature verification failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  if (event.event !== "room_finished") {
    return ok();
  }

  const roomName = event.room?.name;
  if (!roomName) {
    console.warn("[livekit webhook] room_finished missing room.name");
    return ok();
  }

  const session = await db.session.findFirst({
    where: { vapiCallId: roomName },
  });
  if (!session) {
    console.warn("[livekit webhook] no Session for room", roomName);
    return ok();
  }

  const endedAt = new Date();
  const durationS = Math.round(
    (endedAt.getTime() - session.startedAt.getTime()) / 1000,
  );

  console.info("[livekit webhook] room_finished", {
    roomName,
    sessionId: session.id,
    durationS,
  });

  await db.session.update({
    where: { id: session.id },
    data: {
      status: SessionStatus.completed,
      endedAt,
      durationS,
    },
  });

  await generateFindings(session.id);

  return ok();
}
