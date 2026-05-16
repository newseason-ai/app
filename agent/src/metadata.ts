export type DispatchMetadata = {
  sessionId: string;
  systemPrompt: string;
  endCallPhrases: string[];
  voice: string;
};

export function parseMetadata(raw: string | undefined): DispatchMetadata {
  if (!raw) {
    throw new Error("agent dispatch metadata is missing");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`agent dispatch metadata is not valid JSON: ${String(err)}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("agent dispatch metadata must be a JSON object");
  }

  const obj = parsed as Record<string, unknown>;

  const sessionId = obj.sessionId;
  const systemPrompt = obj.systemPrompt;
  if (typeof sessionId !== "string" || !sessionId) {
    throw new Error("metadata.sessionId is required");
  }
  if (typeof systemPrompt !== "string" || !systemPrompt) {
    throw new Error("metadata.systemPrompt is required");
  }

  const endCallPhrases = Array.isArray(obj.endCallPhrases)
    ? obj.endCallPhrases.filter((p): p is string => typeof p === "string")
    : ["goodbye", "have a great day", "take care", "bye"];

  const voice =
    typeof obj.voice === "string" && obj.voice ? obj.voice : "alloy";

  return { sessionId, systemPrompt, endCallPhrases, voice };
}
