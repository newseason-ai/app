"use client";

import { useMemo, useState } from "react";

import { CallScreen } from "./call-screen";
import { LandingScreen } from "./landing-screen";
import { MicPermissionScreen } from "./mic-permission-screen";
import { PostScreen } from "./post-screen";

type CompanyData = { name: string; slug: string; logoUrl: string | null };
type TemplateData = {
  openingPrompt: string;
  directedQuestions: unknown;
  targetDurationS: number;
};

type FlowProps = {
  company: CompanyData;
  template: TemplateData;
  token: string;
};

type ScreenState = "landing" | "mic" | "call" | "post";

export function Flow({ company, template, token }: FlowProps) {
  const [screen, setScreen] = useState<ScreenState>("landing");

  const nextScreen = useMemo<Record<ScreenState, ScreenState | null>>(
    () => ({
      landing: "mic",
      mic: "call",
      call: "post",
      post: null,
    }),
    [],
  );

  const onNext = () => {
    const next = nextScreen[screen];
    if (next) setScreen(next);
  };

  const handleLandingNext = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      if (permissionStatus.state === "granted") {
        setScreen("call");
        return;
      }

      setScreen("mic");
    } catch {
      // Permissions API may be unavailable in some browsers.
      setScreen("mic");
    }
  };

  if (screen === "landing") {
    return (
      <LandingScreen
        company={company}
        template={template}
        onNext={handleLandingNext}
      />
    );
  }

  if (screen === "mic") {
    return (
      <MicPermissionScreen
        company={company}
        onNext={onNext}
        onBack={() => setScreen("landing")}
      />
    );
  }

  if (screen === "call") {
    return <CallScreen company={company} token={token} onEnd={onNext} />;
  }

  return (
    <PostScreen
      company={{ name: company.name }}
      onOptIn={() => {
        console.log("opt-in clicked");
      }}
      onClose={() => {
        // For now, reset to the start of the flow.
        setScreen("landing");
      }}
    />
  );
}
