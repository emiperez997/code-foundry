/**
 * e2e/helpers/seed.ts
 *
 * Cleans up E2E test data from the database.
 * Uses Prisma directly — must be run as a standalone script via tsx,
 * NOT imported inside Playwright spec files (ESM/CJS conflict); the specs
 * invoke it with `node --import tsx` through e2e/helpers/cleanup.ts.
 *
 * Only removes users whose email matches the e2e- prefix pattern
 * so it never touches real data.
 *
 * Usage:
 *   pnpm cleanup:e2e
 */

import "dotenv/config"
import { createHash } from "node:crypto"
import { PrismaClient } from "../../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function cleanupTestUsers(): Promise<void> {
  const testUsers = await prisma.user.findMany({
    where: { email: { startsWith: "e2e-" } },
    select: { id: true, email: true },
  })

  if (testUsers.length === 0) {
    console.log("No E2E test users found.")
    return
  }

  const userIds = testUsers.map((u) => u.id)
  const limitKeys = testUsers.flatMap((u) =>
    ["login:email", "register:email"].map(
      (namespace) =>
        `${namespace}:${createHash("sha256").update(u.email).digest("hex")}`,
    ),
  )

  // Remove dependent rows first: las FK hacia users son RESTRICT salvo
  // reviewerId/actorId (SET NULL), que se limpian igualmente.
  await prisma.$transaction([
    prisma.submission.deleteMany({
      where: { OR: [{ studentId: { in: userIds } }, { reviewerId: { in: userIds } }] },
    }),
    prisma.teacherInvitation.deleteMany({ where: { createdById: { in: userIds } } }),
    prisma.auditEvent.deleteMany({ where: { actorId: { in: userIds } } }),
    prisma.courseTeacher.deleteMany({ where: { teacherId: { in: userIds } } }),
    prisma.authRateLimit.deleteMany({ where: { key: { in: limitKeys } } }),
    prisma.progress.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.enrollment.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ])

  console.log(`Removed ${testUsers.length} E2E test user(s).`)
}

cleanupTestUsers()
  .catch((err) => {
    console.error("Cleanup failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

