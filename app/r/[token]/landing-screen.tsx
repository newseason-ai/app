"use client";

import type { ReactNode } from "react";
import "../respondent.css";

type LandingScreenProps = {
  company: { name: string; slug: string; logoUrl: string | null };
  template: {
    context: string | null;
    background: string | null;
    directedQuestions: unknown;
    targetDurationS: number | null;
  };
  onNext: () => void;
};

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="landing-meta-icon" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7.5v5l3 1.8" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="landing-meta-icon" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6.5 11.5a5.5 5.5 0 1 0 11 0" /><path d="M12 17v4" />
    </svg>
  );
}

function MetaChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="landing-meta-chip">
      {icon}<span>{label}</span>
    </div>
  );
}

export function LandingScreen({ company, template, onNext }: LandingScreenProps) {
  const minutes = Math.max(1, Math.round((template.targetDurationS ?? 120) / 60));

  return (
    <div className="landing-screen-root">
      <div className="landing-screen-container">
        
        {/* Top bar */}
        <div className="landing-top-bar">
          <span className="landing-company-name">{company.name}</span>
          <span className="landing-minutes-chip">
            {minutes} min
          </span>
        </div>

        {/* Main content — grows to fill space */}
        <div className="landing-main">
          <p className="landing-eyebrow">
            WITH NEWSEASON.AI
          </p>

          <h1 className="landing-title">
            Help shape what we build next
          </h1>

          <p className="landing-subtitle">
            We'd love to hear what's working and what's on your mind — in your own words.
          </p>

          <div className="landing-meta-row">
            <MetaChip icon={<ClockIcon />} label={`~${minutes} min`} />
            <MetaChip icon={<MicIcon />} label="Voice conversation" />
          </div>

          <div className="landing-card">
            <h2 className="landing-card-title">
              Your feedback shapes the product
            </h2>
            <p className="landing-card-text">
              You invested in {company.name} — tell us what matters most to you and we'll build it.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="landing-footer">
          <button
            type="button"
            onClick={() => onNext()}
            onTouchEnd={(e) => {
              e.preventDefault();
              onNext();
            }}
            className="landing-start-btn"
          >
            Start conversation
          </button>
          <p className="landing-powered-by">
            Powered by voice AI · your feedback goes to {company.name}
          </p>
        </div>

      </div>
    </div>
  );
}