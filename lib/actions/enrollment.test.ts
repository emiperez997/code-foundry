import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  return {
    auth: vi.fn(),
    upsert: vi.fn(),
    revalidatePath: vi.fn(),
    redirect: vi.fn(),
    courseFindUnique: vi.fn(),
  }
})

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    course: { findUnique: mocks.courseFindUnique },
    enrollment: {
      upsert: mocks.upsert,
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}))

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

import { enrollInCourse } from "@/lib/actions/enrollment"

describe("enrollment actions", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.courseFindUnique.mockResolvedValue({ modules: [{ order: 2 }] })
  })

  it("redirects to courses when required payload is missing", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: "u1" } })

    const formData = new FormData()

    await enrollInCourse(formData)

    expect(mocks.redirect).toHaveBeenCalledWith("/courses")
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it("redirects unauthenticated users to login callback", async () => {
    mocks.auth.mockResolvedValueOnce(null)

    const formData = new FormData()
    formData.set("courseId", "c1")
    formData.set("slug", "real-world-auth")
    formData.set("nextOrder", "1")

    await enrollInCourse(formData)

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Fcourses%2Freal-world-auth"
    )
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it("upserts enrollment and redirects to first module", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: "u1" } })

    const formData = new FormData()
    formData.set("courseId", "c1")
    formData.set("slug", "real-world-auth")
    formData.set("nextOrder", "2")

    await enrollInCourse(formData)

    expect(mocks.upsert).toHaveBeenCalledWith({
      where: {
        userId_courseId: {
          userId: "u1",
          courseId: "c1",
        },
      },
      update: {},
      create: {
        userId: "u1",
        courseId: "c1",
      },
    })
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, "/courses/real-world-auth")
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(2, "/dashboard")
    expect(mocks.redirect).toHaveBeenCalledWith("/courses/real-world-auth/modules/2")
    expect(mocks.courseFindUnique).toHaveBeenCalledWith({
      where: { id: "c1", slug: "real-world-auth", isPublished: true },
      select: { modules: { where: { order: 2 }, select: { order: true } } },
    })
  })

  it.each(["1junk", "0", "-1", "1.5"])("rejects invalid order %s", async (order) => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } })
    const form = new FormData()
    form.set("courseId", "c1")
    form.set("slug", "real-world-auth")
    form.set("nextOrder", order)
    await enrollInCourse(form)
    expect(mocks.upsert).not.toHaveBeenCalled()
    expect(mocks.courseFindUnique).not.toHaveBeenCalled()
  })

  it("does not enroll in an unpublished or mismatched course", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } })
    mocks.courseFindUnique.mockResolvedValue(null)
    const form = new FormData()
    form.set("courseId", "c1")
    form.set("slug", "other-course")
    form.set("nextOrder", "2")
    await enrollInCourse(form)
    expect(mocks.redirect).toHaveBeenCalledWith("/courses")
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it("does not enroll if the destination module does not exist", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } })
    mocks.courseFindUnique.mockResolvedValue({ modules: [] })
    const form = new FormData()
    form.set("courseId", "c1")
    form.set("slug", "real-world-auth")
    form.set("nextOrder", "99")
    await enrollInCourse(form)
    expect(mocks.upsert).not.toHaveBeenCalled()
  })
})
