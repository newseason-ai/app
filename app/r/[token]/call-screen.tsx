"use client";

import Vapi from "@vapi-ai/web";
import { useEffect, useMemo, useRef, useState } from "react";
import "../respondent.css";

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
  const [connecting, setConnecting] = useState(true);
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
        setConnecting(false);

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
          setConnecting(false);
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

  if (connecting && !error) {
    return (
      <div className="call-screen-root">
        <div className="call-screen-container">
          <div className="call-screen-top">
            <p className="call-screen-title">{company.name} · feedback</p>
          </div>
          <div className="call-screen-divider" />
          <div className="call-screen-main">
            <div className="call-screen-orb">
              <div
                className="call-screen-orb-ring-1"
                style={{ animation: "callPulse 2s ease-in-out infinite" }}
              />
              <div
                className="call-screen-orb-ring-2"
                style={{ animation: "callPulse 2s ease-in-out infinite", animationDelay: "0.2s" }}
              />
              <div className="call-screen-orb-core" />
            </div>
            <p className="call-screen-time">0:00</p>
            <p className="call-screen-listening" style={{ opacity: 0.5 }}>
              Connecting...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="call-screen-error-root">
        <div className="call-screen-error-card">
          <div className="call-screen-error-icon-wrap">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="call-screen-error-icon"
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

          <p className="call-screen-error-text">
            {error}
          </p>

          <button
            type="button"
            onClick={onEnd}
            className="call-screen-error-btn"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="call-screen-root">
      <div className="call-screen-container">
        <div className="call-screen-top">
          <p className="call-screen-title">
            {company.name} · feedback
          </p>
          <button
            type="button"
            onClick={handleEnd}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleEnd();
            }}
            className="call-screen-end-btn"
          >
            End
          </button>
        </div>

        <div className="call-screen-divider" />

        <div className="call-screen-main">
          <div className="call-screen-orb">
            <div
              className="call-screen-orb-ring-1"
              style={{
                animation: `callPulse ${
                  speakingState === "user" ? "1.1s" : speakingState === "agent" ? "2.4s" : "2s"
                } ease-in-out infinite`,
              }}
            />
            <div
              className="call-screen-orb-ring-2"
              style={{
                animation: `callPulse ${
                  speakingState === "user" ? "1.1s" : speakingState === "agent" ? "2.4s" : "2s"
                } ease-in-out infinite`,
                animationDelay: "0.2s",
              }}
            />
            <div className="call-screen-orb-core" />
          </div>

          <p className="call-screen-time">
            {formatElapsed(elapsedSeconds)}
          </p>

          {agentText ? (
            <div className="call-screen-transcript">
              <p className="call-screen-agent-label">
                AI interviewer
              </p>
              <p className="call-screen-agent-text">
                {agentText}
              </p>

              {userText ? (
                <div className="call-screen-user-bubble">
                  <p className="call-screen-user-text">
                    {userText}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="call-screen-waveform">
            {waveformHeights.map((height, idx) => (
              <span
                key={`${height}-${idx}`}
                className="call-screen-wave-bar"
                style={{
                  height,
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

          <p className="call-screen-listening">
            Listening · speak freely
          </p>
        </div>
      </div>
    </div>
  );
}
