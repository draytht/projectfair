import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Invalidate stale singleton if it's missing newly generated models
const cached = globalForPrisma.prisma;
const isStale = cached && !("chatMessage" in cached);

export const prisma = (!cached || isStale) ? createPrismaClient() : cached;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;