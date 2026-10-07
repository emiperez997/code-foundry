import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ auth: vi.fn(), course: vi.fn(), module: vi.fn() }))
vi.mock("@/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: { course: { findUnique: mocks.course }, module: { findUnique: mocks.module } } }))
vi.mock("@/lib/actions/enrollment", () => ({ enrollInCourse: vi.fn() }))
vi.mock("@/components/module-progress-form", () => ({ ModuleProgressForm: vi.fn() }))
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("not-found") },
  redirect: (path: string) => { throw new Error(`redirect:${path}`) },
}))

import CoursePage, { generateMetadata as courseMetadata } from "@/app/courses/[slug]/page"
import ModulePage, { generateMetadata as moduleMetadata } from "@/app/courses/[slug]/modules/[order]/page"

describe("course route access", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: "u1" } })
    mocks.course.mockResolvedValue(null)
  })
  it("returns not-found for an unavailable course and queries only published records", async () => {
    await expect(CoursePage({ params: Promise.resolve({ slug: "hidden" }) })).rejects.toThrow("not-found")
    expect(mocks.course).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "hidden", isPublished: true } }))
  })
  it("does not expose unpublished course metadata", async () => {
    expect(await courseMetadata({ params: Promise.resolve({ slug: "hidden" }) })).toEqual({})
    expect(mocks.course).toHaveBeenCalledWith({ where: { slug: "hidden", isPublished: true } })
  })
  it("rejects unavailable module courses for signed-in users", async () => {
    await expect(ModulePage({ params: Promise.resolve({ slug: "hidden", order: "1" }) })).rejects.toThrow("not-found")
    expect(mocks.course).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "hidden", isPublished: true } }))
  })
  it("checks session in the module page even without proxy protection", async () => {
    mocks.auth.mockResolvedValue(null)
    await expect(ModulePage({ params: Promise.resolve({ slug: "course", order: "1" }) })).rejects.toThrow("redirect:/login?callbackUrl=%2Fcourses%2Fcourse%2Fmodules%2F1")
    expect(mocks.course).not.toHaveBeenCalled()
  })
  it("does not expose unpublished module metadata", async () => {
    expect(await moduleMetadata({ params: Promise.resolve({ slug: "hidden", order: "1" }) })).toEqual({})
    expect(mocks.module).not.toHaveBeenCalled()
    expect(mocks.course).toHaveBeenCalledWith({ where: { slug: "hidden", isPublished: true } })
  })
  it("rejects malformed module orders", async () => {
    await expect(ModulePage({ params: Promise.resolve({ slug: "course", order: "1junk" }) })).rejects.toThrow("not-found")
    expect(mocks.course).not.toHaveBeenCalled()
  })
})
