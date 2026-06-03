/**
 * e2e/helpers/seed.ts
 *
 * Cleans up E2E test data from the database before/after suites.
 * Uses Prisma directly — runs in Node context (not in the browser).
 *
 * Only removes users whose email matches the e2e- prefix pattern
 * so it never touches real data.
 */

import "dotenv/config"
import { PrismaClient } from "../../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

export const prisma = new PrismaClient({ adapter })

export async function cleanupTestUsers(): Promise<void> {
  const testUsers = await prisma.user.findMany({
    where: { email: { startsWith: "e2e-" } },
    select: { id: true },
  })

  if (testUsers.length === 0) return

  const userIds = testUsers.map((u) => u.id)

  // Remove in dependency order: progress → enrollments → user
  await prisma.progress.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.enrollment.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
}
