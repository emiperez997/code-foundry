import "dotenv/config"
import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

const session = vi.hoisted(() => ({ userId: "" }))
vi.mock("@/auth", () => ({ auth: async () => ({ user: { id: session.userId } }) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`) } }))

import { prisma } from "@/lib/prisma"
import { consumeRateLimit } from "./rate-limit"
import { enrollInCourse } from "@/lib/actions/enrollment"
import { markModuleCompleted, markModulePending } from "@/lib/actions/progress"

// Opt-in: usa únicamente fixtures identificados por un UUID, sin tocar cursos existentes.
describe.skipIf(process.env.RUN_DB_TESTS !== "1")("access and rate limits with PostgreSQL", () => {
  const prefix = `phase3-${randomUUID()}`
  let courseId: string
  let moduleId: string
  let otherUserId: string

  function form() {
    const data = new FormData()
    data.set("courseId", courseId)
    data.set("moduleId", moduleId)
    data.set("slug", prefix)
    data.set("order", "1")
    data.set("nextOrder", "1")
    return data
  }

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `${prefix}@example.com`, name: "Integration fixture", passwordHash: "unused" } })
    session.userId = user.id
    const other = await prisma.user.create({ data: { email: `${prefix}-other@example.com`, name: "Other fixture", passwordHash: "unused" } })
    otherUserId = other.id
    const course = await prisma.course.create({ data: {
      slug: prefix, title: "Integration fixture", summary: "Temporary fixture", level: "Test", isPublished: false,
      modules: { create: { title: "Fixture module", order: 1, description: "Temporary fixture" } },
    }, include: { modules: true } })
    courseId = course.id
    moduleId = course.modules[0].id
  })

  afterAll(async () => {
    if (moduleId) await prisma.progress.deleteMany({ where: { moduleId } })
    if (courseId) {
      await prisma.enrollment.deleteMany({ where: { courseId } })
      await prisma.module.deleteMany({ where: { courseId } })
      await prisma.course.deleteMany({ where: { id: courseId } })
    }
    const userIds = [session.userId, otherUserId].filter(Boolean)
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    await prisma.authRateLimit.deleteMany({ where: { key: { startsWith: prefix } } })
    await prisma.$disconnect()
  })

  it("enforces limits atomically under concurrent requests", async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => consumeRateLimit(`${prefix}:concurrent`, 5, 60)))
    expect(results.filter(Boolean)).toHaveLength(5)
    expect(results.filter((allowed) => !allowed)).toHaveLength(15)
  })

  it("resets an expired window", async () => {
    const key = `${prefix}:expired`
    expect(await consumeRateLimit(key, 1, 60)).toBe(true)
    expect(await consumeRateLimit(key, 1, 60)).toBe(false)
    await prisma.authRateLimit.update({ where: { key }, data: { expiresAt: new Date(Date.now() - 60000) } })
    expect(await consumeRateLimit(key, 1, 60)).toBe(true)
  })

  it("rejects unpublished courses and modules without writing", async () => {
    await expect(enrollInCourse(form())).rejects.toThrow("redirect:/courses")
    expect((await markModuleCompleted({}, form())).error).toBeDefined()
    expect((await markModulePending({}, form())).error).toBeDefined()
    expect(await prisma.enrollment.count({ where: { courseId } })).toBe(0)
    expect(await prisma.progress.count({ where: { moduleId } })).toBe(0)
  })

  it("rejects mismatched slugs and orders on published modules", async () => {
    await prisma.course.update({ where: { id: courseId }, data: { isPublished: true } })
    const wrongSlug = form()
    wrongSlug.set("slug", "another-course")
    await expect(enrollInCourse(wrongSlug)).rejects.toThrow("redirect:/courses")
    expect((await markModuleCompleted({}, wrongSlug)).error).toBeDefined()
    const wrongOrder = form()
    wrongOrder.set("order", "2")
    expect((await markModuleCompleted({}, wrongOrder)).error).toBeDefined()
    expect(await prisma.progress.count({ where: { moduleId } })).toBe(0)
  })

  it("uses session identity and preserves another user's progress", async () => {
    await prisma.course.update({ where: { id: courseId }, data: { isPublished: true } })
    await prisma.progress.create({ data: { userId: otherUserId, moduleId } })
    const submitted = form()
    submitted.set("userId", otherUserId)
    expect(await markModuleCompleted({}, submitted)).toEqual({})
    expect(await prisma.progress.count({ where: { userId: session.userId, moduleId } })).toBe(1)
    expect(await markModulePending({}, submitted)).toEqual({})
    expect(await prisma.progress.count({ where: { userId: session.userId, moduleId } })).toBe(0)
    expect(await prisma.progress.count({ where: { userId: otherUserId, moduleId } })).toBe(1)
  })
})
