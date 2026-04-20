import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/sessions/:id — Respondent landing: resolves the **link token** (not Session.id).
 * The path param is named `id` for folder consistency; value is `LinkToken.token`.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const linkToken = await db.linkToken.findUnique({
      where: { token: id },
      select: {
        expiresAt: true,
        template: {
          select: {
            context: true,
            background: true,
            directedQuestions: true,
            targetDurationS: true,
            company: {
              select: {
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!linkToken) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (linkToken.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    return NextResponse.json({
      company: {
        name: linkToken.template.company.name,
        slug: linkToken.template.company.slug,
        logoUrl: linkToken.template.company.logoUrl,
      },
      template: {
        context: linkToken.template.context,
        background: linkToken.template.background,
        directedQuestions: linkToken.template.directedQuestions,
        targetDurationS: linkToken.template.targetDurationS,
      },
    });
  } catch (error) {
    console.error("[sessions/:id GET] failed to resolve link token", error);
    return NextResponse.json(
      { error: "Failed to resolve session" },
      { status: 500 },
    );
  }
}
