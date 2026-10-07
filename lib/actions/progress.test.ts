import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  return {
    auth: vi.fn(),
    revalidatePath: vi.fn(),
    progressUpsert: vi.fn(),
    enrollmentUpsert: vi.fn(),
    moduleFindUnique: vi.fn(),
    deleteMany: vi.fn(),
    transaction: vi.fn(),
  }
})

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}))

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    enrollment: {
      upsert: mocks.enrollmentUpsert,
    },
    module: {
      findUnique: mocks.moduleFindUnique,
    },
    progress: {
      upsert: mocks.progressUpsert,
      deleteMany: mocks.deleteMany,
    },
  },
}))

import { markModuleCompleted, markModulePending } from "@/lib/actions/progress"

describe("progress actions", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.moduleFindUnique.mockResolvedValue({ id: "m1", courseId: "c1", order: 3, course: { slug: "real-world-auth" } })
    mocks.transaction.mockImplementation(async (operations) => Promise.all(operations))
  })

  it("returns error if user is not logged in when completing", async () => {
    mocks.auth.mockResolvedValueOnce(null)

    const formData = new FormData()
    formData.set("moduleId", "m1")
    formData.set("slug", "course")
    formData.set("order", "1")

    const result = await markModuleCompleted({}, formData)

    expect(result).toEqual({
      error: "Debes iniciar sesión para guardar progreso.",
    })
    expect(mocks.progressUpsert).not.toHaveBeenCalled()
  })

  it("returns error if module fields are missing when completing", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: "u1" } })

    const formData = new FormData()

    const result = await markModuleCompleted({}, formData)

    expect(result).toEqual({ error: "No pudimos identificar el módulo." })
    expect(mocks.progressUpsert).not.toHaveBeenCalled()
  })

  it("returns error if module does not exist when completing", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: "u1" } })
    mocks.moduleFindUnique.mockResolvedValueOnce(null)

    const formData = new FormData()
    formData.set("moduleId", "missing-module")
    formData.set("slug", "course")
    formData.set("order", "1")

    const result = await markModuleCompleted({}, formData)

    expect(result).toEqual({ error: "No pudimos identificar el módulo." })
    expect(mocks.enrollmentUpsert).not.toHaveBeenCalled()
    expect(mocks.progressUpsert).not.toHaveBeenCalled()
  })

  it("returns error if user is not logged in when setting pending", async () => {
    mocks.auth.mockResolvedValueOnce(null)

    const formData = new FormData()
    formData.set("moduleId", "m1")
    formData.set("slug", "course")
    formData.set("order", "1")

    const result = await markModulePending({}, formData)

    expect(result).toEqual({
      error: "Debes iniciar sesión para guardar progreso.",
    })
    expect(mocks.deleteMany).not.toHaveBeenCalled()
  })

  it("returns error if module fields are missing when setting pending", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: "u1" } })

    const formData = new FormData()

    const result = await markModulePending({}, formData)

    expect(result).toEqual({ error: "No pudimos identificar el módulo." })
    expect(mocks.deleteMany).not.toHaveBeenCalled()
  })

  it("completes module and revalidates related paths", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: "u1" } })
    mocks.moduleFindUnique.mockResolvedValueOnce({ id: "m1", courseId: "c1", order: 3, course: { slug: "real-world-auth" } })

    const formData = new FormData()
    formData.set("moduleId", "m1")
    formData.set("slug", "real-world-auth")
    formData.set("order", "3")

    const result = await markModuleCompleted({}, formData)

    expect(result).toEqual({})
    expect(mocks.moduleFindUnique).toHaveBeenCalledWith({
      where: { id: "m1", order: 3, course: { slug: "real-world-auth", isPublished: true } },
      select: { id: true, courseId: true, order: true, course: { select: { slug: true } } },
    })
    expect(mocks.enrollmentUpsert).toHaveBeenCalledTimes(1)
    expect(mocks.enrollmentUpsert).toHaveBeenCalledWith({
      where: { userId_courseId: { userId: "u1", courseId: "c1" } },
      update: {},
      create: { userId: "u1", courseId: "c1" },
    })
    expect(mocks.progressUpsert).toHaveBeenCalledTimes(1)
    expect(mocks.progressUpsert).toHaveBeenCalledWith({
      where: { userId_moduleId: { userId: "u1", moduleId: "m1" } },
      update: { completedAt: expect.any(Date) },
      create: { userId: "u1", moduleId: "m1" },
    })
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(
      1,
      "/courses/real-world-auth/modules/3"
    )
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(
      2,
      "/courses/real-world-auth"
    )
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(3, "/dashboard")
  })

  it("sets module pending and revalidates related paths", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: "u1" } })

    const formData = new FormData()
    formData.set("moduleId", "m1")
    formData.set("slug", "real-world-auth")
    formData.set("order", "3")

    const result = await markModulePending({}, formData)

    expect(result).toEqual({})
    expect(mocks.moduleFindUnique).toHaveBeenCalledOnce()
    expect(mocks.enrollmentUpsert).not.toHaveBeenCalled()
    expect(mocks.deleteMany).toHaveBeenCalledTimes(1)
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", moduleId: "m1" },
    })
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(
      1,
      "/courses/real-world-auth/modules/3"
    )
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(
      2,
      "/courses/real-world-auth"
    )
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(3, "/dashboard")
  })

  it.each([markModuleCompleted, markModulePending])("rejects unavailable or mismatched modules before writing", async (action) => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } })
    mocks.moduleFindUnique.mockResolvedValue(null)
    const form = new FormData()
    form.set("moduleId", "m1")
    form.set("slug", "other-course")
    form.set("order", "3")
    expect((await action({}, form)).error).toBeDefined()
    expect(mocks.progressUpsert).not.toHaveBeenCalled()
    expect(mocks.deleteMany).not.toHaveBeenCalled()
    expect(mocks.enrollmentUpsert).not.toHaveBeenCalled()
  })
})
