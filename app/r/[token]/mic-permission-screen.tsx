"use client";

import { useState } from "react";
import "../respondent.css";

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
      className="mic-screen-large-icon"
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
      className="mic-screen-check-icon"
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
    <div className="mic-screen-root">
      <div className="mic-screen-container">
        <div>
          <span className="mic-screen-company">{company.name}</span>
        </div>

        <div className="mic-screen-main">
          <div className="mic-screen-icon-wrap">
            <MicLargeIcon />
          </div>

          <h1 className="mic-screen-title">
            We&apos;ll need your microphone
          </h1>

          <p className="mic-screen-subtitle">
            To hear your responses, we need access to your mic. We only record during
            this session.
          </p>

          <div className="mic-screen-benefits">
            <div className="mic-screen-benefit-row">
              <CheckIcon />
              <p className="mic-screen-benefit-text">
                Audio is only recorded during this session
              </p>
            </div>
            <div className="mic-screen-benefit-row">
              <CheckIcon />
              <p className="mic-screen-benefit-text">
                Your response goes to the {company.name} team
              </p>
            </div>
            <div className="mic-screen-benefit-row">
              <CheckIcon />
              <p className="mic-screen-benefit-text">
                You can end at any time
              </p>
            </div>
          </div>
        </div>

        <div className="mic-screen-footer">
          <button
            type="button"
            onClick={handleContinue}
            className="mic-screen-continue-btn"
          >
            Continue
          </button>
          {error ? (
            <p className="mic-screen-error">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onBack}
            className="mic-screen-back-btn"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
