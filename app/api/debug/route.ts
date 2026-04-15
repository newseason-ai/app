import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.POSTGRES_URL ?? "";
  return Response.json({ 
    host: url.match(/@([^:\/]+)/)?.[1] ?? 'not found',
    source: process.env.DATABASE_URL ? 'DATABASE_URL' : 
            process.env.POSTGRES_URL ? 'POSTGRES_URL' : 'none'
  })

  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
