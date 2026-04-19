import type { Metadata } from "next";
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
    context: string | null;
    background: string | null;
    directedQuestions: unknown;
    targetDurationS: number | null;
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

async function resolveSession(token: string): Promise<{
  response: Response;
  data: SessionResolutionResponse | null;
}> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(token)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return { response, data: null };
  }

  const data = (await response.json()) as SessionResolutionResponse;
  return { response, data };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const { data } = await resolveSession(token);

  if (!data?.company?.name) {
    return {
      title: "Customer Interview",
    };
  }

  return {
    title: `${data.company.name} Customer Interview`,
  };
}

export default async function LandingPage({ params }: PageProps) {
  const { token } = await params;
  const { response, data } = await resolveSession(token);

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

  if (!data) {
    return (
      <main className="flex min-h-full items-center justify-center bg-[#FAFAF8] p-6">
        <p className="text-center font-medium text-zinc-800">
          Something went wrong loading this page
        </p>
      </main>
    );
  }

  return <Flow company={data.company} template={data.template} token={token} />;
}
