import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  return {
    signIn: vi.fn(),
    redirect: vi.fn(),
    hash: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  }
})

vi.mock("@/auth", () => ({
  signIn: mocks.signIn,
}))

vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {},
}))

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

vi.mock("bcryptjs", () => ({
  default: {
    hash: mocks.hash,
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      create: mocks.create,
    },
  },
}))

import { login, register } from "@/lib/actions/auth"

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error when login fields are missing", async () => {
    const formData = new FormData()

    const result = await login({}, formData)

    expect(result).toEqual({ error: "Email y contraseña son obligatorios." })
    expect(mocks.signIn).not.toHaveBeenCalled()
  })

  it("returns error when register password is too short", async () => {
    const formData = new FormData()
    formData.set("name", "Emi")
    formData.set("email", "emi@example.com")
    formData.set("password", "1234567")

    const result = await register({}, formData)

    expect(result).toEqual({
      error: "La contraseña debe tener al menos 8 caracteres.",
    })
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it("returns error when register email already exists", async () => {
    mocks.findUnique.mockResolvedValueOnce({ id: "u1" })

    const formData = new FormData()
    formData.set("name", "Emi")
    formData.set("email", "emi@example.com")
    formData.set("password", "12345678")

    const result = await register({}, formData)

    expect(result).toEqual({ error: "Ya existe una cuenta con ese email." })
    expect(mocks.hash).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
