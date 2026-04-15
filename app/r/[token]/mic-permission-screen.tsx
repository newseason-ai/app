"use client";

import { useState } from "react";

type MicPermissionScreenProps = {
  company: { name: string; slug: string; logoUrl: string | null };
  onNext: () => void;
  onBack: () => void;
};

function MicLargeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{ width: 48, height: 48, color: "#0D9488" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6.5 11.5a5.5 5.5 0 1 0 11 0" />
      <path d="M12 17v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{ width: 18, height: 18, color: "#0D9488", flexShrink: 0, marginTop: 2 }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

export function MicPermissionScreen({ company, onNext, onBack }: MicPermissionScreenProps) {
  const [error, setError] = useState("");

  const handleContinue = async () => {
    try {
      setError("");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      onNext();
    } catch {
      setError(
        "Microphone access is required. Please enable it in your browser settings and try again.",
      );
    }
  };

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
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
            {company.name}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              alignSelf: "center",
              borderRadius: 20,
              border: "1px solid #d4d4d8",
              background: "#F5F5EF",
              padding: 18,
              display: "flex",
            }}
          >
            <MicLargeIcon />
          </div>

          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -0.5,
              textAlign: "center",
              marginTop: 0,
              marginRight: 0,
              marginBottom: 12,
              marginLeft: 0,
            }}
          >
            We&apos;ll need your microphone
          </h1>

          <p
            style={{
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1.5,
              color: "#3f3f46",
              textAlign: "center",
              margin: 0,
            }}
          >
            To hear your responses, we need access to your mic. We only record during
            this session.
          </p>

          <div
            style={{
              background: "#EEEEE6",
              border: "1px solid #d4d4d8",
              borderRadius: 20,
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <CheckIcon />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "#27272a", lineHeight: 1.45 }}>
                Audio is only recorded during this session
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <CheckIcon />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "#27272a", lineHeight: 1.45 }}>
                Your response goes to the {company.name} team
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <CheckIcon />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "#27272a", lineHeight: 1.45 }}>
                You can end at any time
              </p>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 8 }}>
          <button
            type="button"
            onClick={handleContinue}
            style={{
              width: "100%",
              borderRadius: 999,
              background: "#18181b",
              color: "#fff",
              border: "none",
              padding: "18px 28px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            Continue
          </button>
          {error ? (
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 12,
                color: "#b91c1c",
                lineHeight: 1.4,
                textAlign: "center",
              }}
            >
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onBack}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "#71717a",
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.4,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
