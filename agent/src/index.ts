import "dotenv/config";

import {
  type JobContext,
  WorkerOptions,
  cli,
  defineAgent,
  voice,
} from "@livekit/agents";
import * as openai from "@livekit/agents-plugin-openai";

import { parseMetadata } from "./metadata.js";
import { TranscriptSink } from "./transcript-sink.js";

const TRANSCRIPT_CALLBACK_URL = required("TRANSCRIPT_CALLBACK_URL");
const TRANSCRIPT_CALLBACK_SECRET = required("TRANSCRIPT_CALLBACK_SECRET");

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();

    const metadata = parseMetadata(ctx.job.metadata);
    const { sessionId, systemPrompt, endCallPhrases, voice: voiceName } =
      metadata;

    console.info("[agent] starting", {
      sessionId,
      room: ctx.room.name,
      voice: voiceName,
      promptLen: systemPrompt.length,
    });

    const sink = new TranscriptSink({
      url: TRANSCRIPT_CALLBACK_URL,
      secret: TRANSCRIPT_CALLBACK_SECRET,
    });

    const model = new openai.realtime.RealtimeModel({
      model: "gpt-4o-realtime-preview",
      voice: voiceName,
      modalities: ["audio", "text"],
    });

    const agent = new voice.Agent({
      instructions: systemPrompt,
      llm: model,
    });

    const session = new voice.AgentSession({ llm: model });

    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (event) => {
      if (!event.isFinal) return;
      void sink.post({
        sessionId,
        speaker: "user",
        content: event.transcript,
      });
    });

    session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (event) => {
      const item = event.item;
      if (item.type !== "message" || item.role !== "assistant") return;
      const text = item.textContent;
      if (!text) return;
      void sink.post({ sessionId, speaker: "assistant", content: text });
      if (containsEndPhrase(text, endCallPhrases)) {
        void endCall(session);
      }
    });

    await session.start({ agent, room: ctx.room });
    await session.generateReply();
  },
});

function containsEndPhrase(text: string, phrases: string[]): boolean {
  const haystack = text.toLowerCase();
  return phrases.some((p) => haystack.includes(p.toLowerCase()));
}

async function endCall(session: voice.AgentSession): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await session.close();
}

cli.runApp(
  new WorkerOptions({
    agent: import.meta.filename,
    agentName: "interviewer",
  }),
);
