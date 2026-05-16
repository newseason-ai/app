"use client";

import {
  type Participant,
  Room,
  RoomEvent,
  Track,
  type TranscriptionSegment,
} from "livekit-client";
import { useEffect, useMemo, useRef, useState } from "react";
import "../respondent.css";

import type { StartCallResponse } from "@/types/api";

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
  const roomRef = useRef<Room | null>(null);
  const endedRef = useRef(false);

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

        const payload = (await response.json()) as StartCallResponse;

        if (!mounted) return;

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) {
            track.attach();
          }
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
          if (speakers.length === 0) {
            setSpeakingState("idle");
            return;
          }
          const localSpeaking = speakers.some((p) => p.isLocal);
          setSpeakingState(localSpeaking ? "user" : "agent");
        });

        room.on(
          RoomEvent.TranscriptionReceived,
          (segments: TranscriptionSegment[], participant?: Participant) => {
            if (segments.length === 0) return;
            const text = segments
              .map((s) => s.text)
              .filter(Boolean)
              .join(" ")
              .trim();
            if (!text) return;
            if (participant?.isLocal) {
              setUserText(text);
            } else {
              setAgentText(text);
              setUserText("");
            }
          },
        );

        room.on(RoomEvent.Disconnected, () => {
          if (endedRef.current) return;
          endedRef.current = true;
          setSpeakingState("idle");
          onEnd();
        });

        await room.connect(payload.wsUrl, payload.token);
        await room.localParticipant.setMicrophoneEnabled(true);

        if (!mounted) {
          await room.disconnect();
          return;
        }
        setConnecting(false);
      } catch (err) {
        console.error("[call screen] failed to initialize LiveKit", err);
        if (mounted) {
          setConnecting(false);
          setError("Something went wrong starting the call. Please try again.");
        }
      }
    };

    initCall();

    return () => {
      mounted = false;
      const room = roomRef.current;
      roomRef.current = null;
      if (room) {
        void room.disconnect();
      }
    };
  }, [onEnd, token]);

  const handleEnd = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setSpeakingState("idle");
    const room = roomRef.current;
    if (room) {
      void room.disconnect();
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
