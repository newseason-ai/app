import { createHmac } from "node:crypto";

export type TurnPayload = {
  sessionId: string;
  speaker: "assistant" | "user";
  content: string;
  turnIndex: number;
  startedAtS: number;
};

export class TranscriptSink {
  private turnIndex = 0;
  private readonly url: string;
  private readonly secret: string;
  private readonly sessionStartMs: number;

  constructor(opts: { url: string; secret: string }) {
    this.url = opts.url;
    this.secret = opts.secret;
    this.sessionStartMs = Date.now();
  }

  async post(args: { sessionId: string; speaker: "assistant" | "user"; content: string }) {
    const content = args.content.trim();
    if (!content) return;

    const payload: TurnPayload = {
      sessionId: args.sessionId,
      speaker: args.speaker,
      content,
      turnIndex: this.turnIndex++,
      startedAtS: Math.max(0, Math.round((Date.now() - this.sessionStartMs) / 1000)),
    };

    const body = JSON.stringify(payload);
    const signature = createHmac("sha256", this.secret).update(body).digest("hex");

    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Newseason-Signature": signature,
        },
        body,
      });
      if (!res.ok) {
        console.warn(
          `[transcript-sink] POST ${res.status}: ${await res.text().catch(() => "")}`,
        );
      }
    } catch (err) {
      console.warn("[transcript-sink] POST failed:", err);
    }
  }
}
