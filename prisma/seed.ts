/**
 * seed.ts
 *
 * Syncs all courses from content/courses/<slug>/README.md into the database.
 *
 * Safe to run multiple times:
 *   - Existing courses and modules are updated, not recreated.
 *   - Modules removed from a README are deleted from the DB (progress records first).
 *
 * Run via: prisma migrate dev  (executes seed automatically after migration)
 *      or: tsx prisma/seed.ts  (manual run)
 */

// Load .env manually — this file runs as a subprocess of the Prisma CLI,
// so prisma.config.ts's dotenv import does not apply here.
import "dotenv/config";

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadCourses } from "../lib/courses/courseLoader";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const courses = loadCourses();
  console.log(`\nFound ${courses.length} course(s) in content/courses/\n`);

  for (const course of courses) {
    // ── 1. Upsert the course row ─────────────────────────────────────────────
    const savedCourse = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        summary: course.summary,
        level: course.level,
        isPublished: course.isPublished,
      },
      create: {
        slug: course.slug,
        title: course.title,
        summary: course.summary,
        level: course.level,
        isPublished: course.isPublished,
      },
    });

    // ── 2. Upsert each module (identified by courseId + order) ───────────────
    for (const mod of course.modules) {
      await prisma.module.upsert({
        where: {
          courseId_order: { courseId: savedCourse.id, order: mod.order },
        },
        update: {
          title: mod.title,
          description: mod.description,
        },
        create: {
          courseId: savedCourse.id,
          title: mod.title,
          order: mod.order,
          description: mod.description,
        },
      });
    }

    // ── 3. Prune orphan modules (orders no longer in the README) ─────────────
    // The migration uses ON DELETE RESTRICT on progress.moduleId,
    // so progress records must be removed before the modules themselves.
    const currentOrders = course.modules.map((m) => m.order);

    const orphans = await prisma.module.findMany({
      where: {
        courseId: savedCourse.id,
        order: { notIn: currentOrders },
      },
      select: { id: true },
    });

    if (orphans.length > 0) {
      const orphanIds = orphans.map((o: { id: string }) => o.id);

      await prisma.progress.deleteMany({
        where: { moduleId: { in: orphanIds } },
      });

      await prisma.module.deleteMany({
        where: { id: { in: orphanIds } },
      });

      console.log(
        `  [${course.slug}] Removed ${orphans.length} orphan module(s)`,
      );
    }

    console.log(
      `  ✓ ${course.slug} — ${course.modules.length} module(s) synced`,
    );
  }

  console.log("\nSeed completed.\n");
}

main()
  .catch((err) => {
    console.error("\nSeed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
