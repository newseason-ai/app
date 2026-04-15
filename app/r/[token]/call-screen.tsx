"use client";

import Vapi from "@vapi-ai/web";
import { useEffect, useMemo, useRef, useState } from "react";

type CallScreenProps = {
  company: { name: string; slug: string; logoUrl: string | null };
  token: string;
  onEnd: () => void;
};

type SpeakingState = "agent" | "user" | "idle";

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function CallScreen({ company, token, onEnd }: CallScreenProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [speakingState, setSpeakingState] = useState<SpeakingState>("idle");
  const [agentText, setAgentText] = useState("");
  const [userText, setUserText] = useState("");
  const agentHistoryRef = useRef<string[]>([]);
  const isNewAgentTurn = useRef(false);
  const vapiRef = useRef<Vapi | null>(null);
  const endedRef = useRef(false);
  const currentSpeakerRef = useRef<"assistant" | "user" | "unknown">("unknown");

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const initCall = async () => {
      // TODO: Add a loading/connecting state while /api/calls/start is in flight.
      // Show a "Connecting..." indicator with the orb in a slow idle pulse
      // before the call connects, so the screen doesn't feel frozen on mount.
      try {
        const response = await fetch("/api/calls/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to start call: ${response.status} ${text}`);
        }

        const payload = (await response.json()) as {
          vapiCall?: {
            id?: string;
            webCallUrl?: string;
            transport?: { callUrl?: string };
          };
        };
        console.log("[/api/calls/start payload]", payload);

        const publicKey = process.env.NEXT_PUBLIC_VAPI_KEY;
        if (!publicKey) {
          throw new Error("NEXT_PUBLIC_VAPI_KEY is not set");
        }

        const webCallUrl =
          payload.vapiCall?.webCallUrl ?? payload.vapiCall?.transport?.callUrl;
        if (!webCallUrl) {
          throw new Error("Missing webCallUrl in /api/calls/start response");
        }
        console.log("[vapi reconnect args]", {
          webCallUrl,
          id: payload.vapiCall?.id,
        });

        if (!mounted) return;

        const vapi = new Vapi(publicKey);
        vapiRef.current = vapi;

        (vapi as any).on("speech-start", (event: any) => {
          const eventRole =
            typeof event?.role === "string" &&
            (event.role === "assistant" || event.role === "user")
              ? event.role
              : null;
          if (eventRole) {
            currentSpeakerRef.current = eventRole;
          }
          console.log("[vapi event] speech-start", {
            event,
            resolvedRole: currentSpeakerRef.current,
          });
          if (currentSpeakerRef.current === "assistant") {
            isNewAgentTurn.current = true;
            setUserText("");
          }
          setSpeakingState(
            currentSpeakerRef.current === "assistant" ? "agent" : "user",
          );
        });

        (vapi as any).on("speech-end", (event: any) => {
          console.log("[vapi event] speech-end", {
            event,
            currentSpeaker: currentSpeakerRef.current,
          });
          setSpeakingState("idle");
        });

        vapi.on("message", (msg: any) => {
          console.log("[vapi event] message", msg);
          if (msg?.type === "speech-update" && typeof msg?.role === "string") {
            // TODO: There is still a potential race between speech-update and speech-start role timing.
            // Revisit once Vapi event ordering/payload guarantees are confirmed.
            currentSpeakerRef.current =
              msg.role === "assistant" || msg.role === "user" ? msg.role : "unknown";
            return;
          }

          if (msg?.type !== "transcript") return;

          const role = typeof msg?.role === "string" ? msg.role : "";
          const transcript =
            typeof msg?.transcript === "string"
              ? msg.transcript
              : typeof msg?.content === "string"
                ? msg.content
                : "";
          if (!transcript) return;

          if (role === "assistant") {
            if (isNewAgentTurn.current) {
              // First transcript of a new turn — clear and start fresh
              isNewAgentTurn.current = false;
              setAgentText(transcript);
            } else {
              // Subsequent partials — replace with latest (Vapi partials are cumulative)
              setAgentText(transcript);
            }
            if (msg?.transcriptType === "final") {
              agentHistoryRef.current.push(transcript);
            }
            return;
          }

          if (role === "user") {
            setUserText(transcript);
          }
        });

        vapi.on("call-end", () => {
          console.log("[vapi event] call-end");
          if (endedRef.current) return;
          endedRef.current = true;
          setSpeakingState("idle");
          onEnd();
        });

        vapi.on("error", (error: any) => {
          console.log("[vapi event] error", error);
          console.error("[vapi web sdk] error", error);
        });

        // Best effort wildcard listener for SDKs that support it.
        (vapi as any).on?.("*", (event: any) => {
          console.log("[vapi *]", event);
        });

        await vapi.reconnect({
          webCallUrl,
          id: payload.vapiCall?.id,
        });
      } catch (error) {
        console.error("[call screen] failed to initialize Vapi", error);
        // TODO: distinguish between error types — Vapi downtime vs network vs token expired.
        // Consider retry logic for transient failures before showing the error screen.
        if (mounted) {
          setError("Something went wrong starting the call. Please try again.");
        }
      }
    };

    initCall();

    return () => {
      mounted = false;
      const vapi = vapiRef.current;
      vapiRef.current = null;
      if (vapi) {
        void vapi.stop();
        vapi.removeAllListeners();
      }
    };
  }, [onEnd, token]);

  const handleEnd = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setSpeakingState("idle");
    const vapi = vapiRef.current;
    if (vapi) {
      void vapi.stop();
    }
    onEnd();
  };

  const waveformHeights = useMemo(() => [12, 18, 25, 34, 25, 18, 12], []);

  if (error) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#FAFAF8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#18181b",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 320, width: "100%" }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              border: "1px solid #D4D4D8",
              color: "#A1A1AA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              style={{ width: 26, height: 26 }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="m9 9 6 6" />
              <path d="m15 9-6 6" />
            </svg>
          </div>

          <p style={{ margin: "0 0 16px", fontSize: 15, lineHeight: 1.5, color: "#52525B" }}>
            {error}
          </p>

          <button
            type="button"
            onClick={onEnd}
            style={{
              width: "100%",
              borderRadius: 999,
              background: "#18181B",
              color: "#FFFFFF",
              border: "none",
              padding: "14px 20px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              WebkitAppearance: "none",
            }}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#FAFAF8",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#18181b",
        padding: "0 24px",
        paddingTop: "max(20px, env(safe-area-inset-top))",
        paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        boxSizing: "border-box",
      }}
    >
      <style>
        {`
          @keyframes callPulse {
            0% { transform: scale(1); opacity: 0.35; }
            50% { transform: scale(1.08); opacity: 0.18; }
            100% { transform: scale(1); opacity: 0.35; }
          }
          @keyframes callWave {
            0%, 100% { transform: scaleY(0.45); opacity: 0.65; }
            50% { transform: scaleY(1); opacity: 1; }
          }
        `}
      </style>
      <div
        style={{
          maxWidth: 390,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#27272a" }}>
            {company.name} · feedback
          </p>
          <button
            type="button"
            onClick={handleEnd}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleEnd();
            }}
            style={{
              borderRadius: 999,
              border: "1px solid #FECACA",
              background: "#FEF2F2",
              color: "#DC2626",
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 14px",
              cursor: "pointer",
              WebkitAppearance: "none",
            }}
          >
            End
          </button>
        </div>

        <div style={{ height: 1, background: "#E4E4E7", marginBottom: 14 }} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div style={{ position: "relative", width: 132, height: 132 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "#1D9E75",
                opacity: 0.16,
                animation: `callPulse ${
                  speakingState === "user" ? "1.1s" : speakingState === "agent" ? "2.4s" : "2s"
                } ease-in-out infinite`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 16,
                borderRadius: "50%",
                background: "#1D9E75",
                opacity: 0.2,
                animation: `callPulse ${
                  speakingState === "user" ? "1.1s" : speakingState === "agent" ? "2.4s" : "2s"
                } ease-in-out infinite`,
                animationDelay: "0.2s",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 36,
                borderRadius: "50%",
                background: "#1D9E75",
              }}
            />
          </div>

          <p style={{ margin: 0, fontSize: 13, color: "#A1A1AA", lineHeight: 1.2 }}>
            {formatElapsed(elapsedSeconds)}
          </p>

          {agentText ? (
            <div
              style={{
                width: "100%",
                background: "#EEEEE6",
                borderRadius: 16,
                padding: "14px 16px",
                boxSizing: "border-box",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#1D9E75",
                  lineHeight: 1.3,
                }}
              >
                AI interviewer
              </p>
              <p
                style={{
                  margin: "6px 0 10px",
                  fontSize: 14,
                  color: "#27272A",
                  lineHeight: 1.45,
                }}
              >
                {agentText}
              </p>

              {userText ? (
                <div
                  style={{
                    borderRadius: 12,
                    border: "1px solid #E4E4E7",
                    background: "#FFFFFF",
                    padding: "10px 12px",
                  }}
                >
                  <p
                    style={{ margin: 0, fontSize: 14, color: "#52525B", lineHeight: 1.4 }}
                  >
                    {userText}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "end", gap: 4, height: 36 }}>
            {waveformHeights.map((height, idx) => (
              <span
                key={`${height}-${idx}`}
                style={{
                  width: 5,
                  height,
                  borderRadius: 999,
                  background: "#1D9E75",
                  transformOrigin: "bottom",
                  opacity: speakingState === "user" ? 1 : 0.35,
                  // TODO: Waveform animation can still be finicky across browsers; revisit if it stops animating.
                  animation:
                    speakingState === "user"
                      ? `callWave 1.1s ease-in-out ${idx * 0.08}s infinite`
                      : "none",
                }}
              />
            ))}
          </div>

          <p style={{ margin: 0, fontSize: 13, color: "#A1A1AA", lineHeight: 1.3 }}>
            Listening · speak freely
          </p>
        </div>
      </div>
    </div>
  );
}
