import "dotenv/config";

import {
  type JobContext,
  WorkerOptions,
  cli,
  defineAgent,
  llm,
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
    const { sessionId, systemPrompt, voice: voiceName } = metadata;

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
      speed: 1.1,
      turnDetection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 400,
      },
    });

    const sessionRef: { current: voice.AgentSession | null } = {
      current: null,
    };

    const endCall = llm.tool({
      description:
        "End the call. Call this once you have said your final goodbye and the conversation is naturally complete. Do not say anything else after calling it.",
      execute: async () => {
        console.info("[agent] end_call tool invoked");
        setTimeout(() => {
          void sessionRef.current?.close();
        }, 1500);
        return "Call ending.";
      },
    });

    const agent = new voice.Agent({
      instructions: systemPrompt,
      llm: model,
      tools: { end_call: endCall },
    });

    const session = new voice.AgentSession({ llm: model });
    sessionRef.current = session;

    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (event) => {
      console.info("[agent] user_input_transcribed", {
        isFinal: event.isFinal,
        len: event.transcript.length,
      });
      if (!event.isFinal) return;
      void sink.post({
        sessionId,
        speaker: "user",
        content: event.transcript,
      });
    });

    session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (event) => {
      const item = event.item;
      console.info("[agent] conversation_item_added", {
        type: item.type,
        role: item.type === "message" ? item.role : "n/a",
        hasText:
          item.type === "message" ? Boolean(item.textContent) : false,
      });
      if (item.type !== "message" || item.role !== "assistant") return;
      const text = item.textContent;
      if (!text) return;
      void sink.post({ sessionId, speaker: "assistant", content: text });
    });

    session.on(voice.AgentSessionEventTypes.AgentStateChanged, (event) => {
      console.info("[agent] agent_state_changed", {
        from: event.oldState,
        to: event.newState,
      });
    });

    session.on(voice.AgentSessionEventTypes.Error, (event) => {
      console.error("[agent] error", event);
    });

    await session.start({ agent, room: ctx.room });
    await session.generateReply();
  },
});

cli.runApp(
  new WorkerOptions({
    agent: import.meta.filename,
    agentName: "interviewer",
    numIdleProcesses: 1,
  }),
);
