import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({
    // Use the direct URL — pg.Pool handles connection pooling at the Node level.
    // DATABASE_URL (pgbouncer) is not compatible with the driver adapter.
    connectionString: process.env.DIRECT_URL,
    max: 10,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const cached = globalForPrisma.prisma;
const isStale = cached && (!("chatMessage" in cached) || !("course" in cached) || !("subscription" in cached));

export const prisma = !cached || isStale ? createPrismaClient() : cached;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
