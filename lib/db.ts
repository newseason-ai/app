import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  db?: PrismaClient;
  pool?: Pool;
};

function createPool(): Pool {
  const url = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("No database URL set");
  }

  return new Pool({
    connectionString: url,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });
}

const pool = globalForPrisma.pool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool;
}

export const db =
  globalForPrisma.db ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.db = db;
}
