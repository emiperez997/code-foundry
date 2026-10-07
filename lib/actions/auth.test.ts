import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  return {
    signIn: vi.fn(),
    redirect: vi.fn(),
    hash: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    consumeRateLimit: vi.fn(),
  }
})

vi.mock("@/lib/auth/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  rateLimitKey: (namespace: string, identity: string) => `${namespace}:${identity}`,
}))

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
    vi.resetAllMocks()
    mocks.consumeRateLimit.mockResolvedValue(true)
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

  it("normalizes login email and returns to the requested internal destination", async () => {
    const form = new FormData()
    form.set("email", " EMI@Example.com ")
    form.set("password", "12345678")
    form.set("callbackUrl", "/dashboard")
    await login({}, form)
    expect(mocks.signIn).toHaveBeenCalledWith("credentials", { email: "emi@example.com", password: "12345678", redirect: false })
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard")
  })

  it("rejects an external callback after login", async () => {
    const form = new FormData()
    form.set("email", "emi@example.com")
    form.set("password", "12345678")
    form.set("callbackUrl", "//evil.example")
    await login({}, form)
    expect(mocks.redirect).toHaveBeenCalledWith("/courses")
  })

  it.each(["invalid", "a@b", "a".repeat(255) + "@example.com"])("rejects malformed registration email %s", async (email) => {
    const form = new FormData()
    form.set("name", "Emi")
    form.set("email", email)
    form.set("password", "12345678")
    expect((await register({}, form)).error).toBeDefined()
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled()
  })

  it("rejects file-valued form fields without throwing", async () => {
    const form = new FormData()
    form.set("name", new Blob(["Emi"]), "name.txt")
    form.set("email", "emi@example.com")
    form.set("password", "12345678")
    expect((await register({}, form)).error).toBeDefined()
    expect(mocks.hash).not.toHaveBeenCalled()
  })

  it("rejects passwords above bcrypt's byte limit", async () => {
    const form = new FormData()
    form.set("name", "Emi")
    form.set("email", "emi@example.com")
    form.set("password", "á".repeat(37))
    expect((await register({}, form)).error).toBeDefined()
    expect(mocks.hash).not.toHaveBeenCalled()
  })

  it("handles concurrent duplicate registrations", async () => {
    mocks.findUnique.mockResolvedValue(null)
    mocks.hash.mockResolvedValue("hash")
    mocks.create.mockRejectedValue({ code: "P2002" })
    const form = new FormData()
    form.set("name", "Emi")
    form.set("email", "emi@example.com")
    form.set("password", "12345678")
    expect(await register({}, form)).toEqual({ error: "Ya existe una cuenta con ese email." })
    expect(mocks.signIn).not.toHaveBeenCalled()
  })

  it("does not hash or create a user when registration is throttled", async () => {
    mocks.consumeRateLimit.mockResolvedValue(false)
    const form = new FormData()
    form.set("name", "Emi")
    form.set("email", "emi@example.com")
    form.set("password", "12345678")
    expect((await register({}, form)).error).toContain("Demasiados intentos")
    expect(mocks.hash).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it("preserves the callback when registration logs the user in", async () => {
    mocks.findUnique.mockResolvedValue(null)
    mocks.hash.mockResolvedValue("hash")
    const form = new FormData()
    form.set("name", "Emi")
    form.set("email", "EMI@example.com")
    form.set("password", "12345678")
    form.set("callbackUrl", "/courses/real-world-auth/modules/1")
    await register({}, form)
    expect(mocks.create).toHaveBeenCalledWith({ data: { name: "Emi", email: "emi@example.com", passwordHash: "hash" } })
    expect(mocks.redirect).toHaveBeenCalledWith("/courses/real-world-auth/modules/1")
  })
})
