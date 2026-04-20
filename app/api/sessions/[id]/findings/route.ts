import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { generateFindings } from "@/lib/findings";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await db.session.findUnique({
    where: { id },
    include: {
      linkToken: {
        include: {
          template: {
            include: { company: true },
          },
        },
      },
    },
  });

  if (!session || session.linkToken.template.company.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await generateFindings(id);
  return NextResponse.json({ ok: true });
}
