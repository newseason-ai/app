import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  db?: PrismaClient;
  pool?: Pool;
};

function createPool(): Pool {
  const url = process.env.POSTGRES_PRISMA_URL;
  if (!url) {
    throw new Error("POSTGRES_PRISMA_URL is not set");
  }
  return new Pool({ connectionString: url });
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
