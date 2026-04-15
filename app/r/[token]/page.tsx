import { headers } from "next/headers";

import { Flow } from "./flow";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

type SessionResolutionResponse = {
  company: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  template: {
    openingPrompt: string;
    directedQuestions: unknown;
    targetDurationS: number;
  };
};

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${host}`;
  }

  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (envBase) {
    return envBase.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

export default async function LandingPage({ params }: PageProps) {
  const { token } = await params;
  const baseUrl = await getBaseUrl();
  const response = await fetch(
    `${baseUrl}/api/sessions/${encodeURIComponent(token)}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return (
      <main className="flex min-h-full items-center justify-center bg-[#FAFAF8] p-6">
        <p className="text-center font-medium text-zinc-800">This link is invalid</p>
      </main>
    );
  }

  if (response.status === 410) {
    return (
      <main className="flex min-h-full items-center justify-center bg-[#FAFAF8] p-6">
        <p className="text-center font-medium text-zinc-800">This link has expired</p>
      </main>
    );
  }

  if (!response.ok) {
    return (
      <main className="flex min-h-full items-center justify-center bg-[#FAFAF8] p-6">
        <p className="text-center font-medium text-zinc-800">
          Something went wrong loading this page
        </p>
      </main>
    );
  }

  const data = (await response.json()) as SessionResolutionResponse;
  return <Flow company={data.company} template={data.template} token={token} />;
}
