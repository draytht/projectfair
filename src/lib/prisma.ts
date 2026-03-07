import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({
    // Use the PgBouncer-pooled URL for all runtime queries.
    // DIRECT_URL is reserved for migrations (prisma.config.ts).
    connectionString: process.env.DATABASE_URL,
    // Keep the pg.Pool small — PgBouncer handles the real pooling.
    max: 3,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const cached = globalForPrisma.prisma;
const isStale = cached && (!("chatMessage" in cached) || !("course" in cached) || !("subscription" in cached));

export const prisma = !cached || isStale ? createPrismaClient() : cached;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
