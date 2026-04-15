import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const linkToken = await db.linkToken.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        template: {
          select: {
            openingPrompt: true,
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
        openingPrompt: linkToken.template.openingPrompt,
        directedQuestions: linkToken.template.directedQuestions,
        targetDurationS: linkToken.template.targetDurationS,
      },
    });
  } catch (error) {
    console.error("[sessions/:token GET] failed to resolve token", error);
    return NextResponse.json(
      { error: "Failed to resolve session token" },
      { status: 500 },
    );
  }
}
