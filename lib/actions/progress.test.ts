import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  return {
    auth: vi.fn(),
    revalidatePath: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
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
    progress: {
      upsert: mocks.upsert,
      deleteMany: mocks.deleteMany,
    },
  },
}))

import { markModuleCompleted, markModulePending } from "@/lib/actions/progress"

describe("progress actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it("returns error if module fields are missing when completing", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: "u1" } })

    const formData = new FormData()

    const result = await markModuleCompleted({}, formData)

    expect(result).toEqual({ error: "No pudimos identificar el módulo." })
    expect(mocks.upsert).not.toHaveBeenCalled()
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

    const formData = new FormData()
    formData.set("moduleId", "m1")
    formData.set("slug", "real-world-auth")
    formData.set("order", "3")

    const result = await markModuleCompleted({}, formData)

    expect(result).toEqual({})
    expect(mocks.upsert).toHaveBeenCalledTimes(1)
    expect(mocks.upsert).toHaveBeenCalledWith({
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
})
