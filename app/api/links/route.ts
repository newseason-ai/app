import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function generateToken(): string {
  // Node best practice for secure random token generation.
  return randomBytes(16).toString("hex");
}

function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not set");
  }
  return baseUrl.replace(/\/+$/, "");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      template_id?: string;
      respondent_ref?: string;
      respondentName?: string;
      respondentContext?: string;
    };

    const templateId =
      typeof body?.template_id === "string" ? body.template_id.trim() : "";
    const respondentRef =
      typeof body?.respondent_ref === "string" && body.respondent_ref.trim()
        ? body.respondent_ref.trim()
        : undefined;
    const respondentName =
      typeof body?.respondentName === "string" && body.respondentName.trim()
        ? body.respondentName.trim()
        : undefined;

    const respondentContext =
      typeof body?.respondentContext === "string" && body.respondentContext.trim()
        ? body.respondentContext.trim()
        : undefined;

    if (!templateId) {
      return NextResponse.json(
        { error: "template_id is required" },
        { status: 400 },
      );
    }

    const template = await db.template.findFirst({
      where: {
        id: templateId,
        active: true,
        company: { userId: user.id },
      },
      select: { id: true },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Active template not found" },
        { status: 404 },
      );
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.linkToken.create({
      data: {
        templateId: template.id,
        token,
        respondentRef,
        respondentContext: respondentContext ?? null,
        metadata: respondentName ? { name: respondentName } : {},
        label: respondentName ?? null,
        expiresAt,
      },
    });

    const baseUrl = getBaseUrl();
    return NextResponse.json({
      url: `${baseUrl}/r/${token}`,
    });
  } catch (error) {
    console.error("[links POST] failed to create link token", error);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 },
    );
  }
}
