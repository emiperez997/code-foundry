import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ consume: vi.fn(), find: vi.fn(), compare: vi.fn() }))
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.find } } }))
vi.mock("./rate-limit", () => ({ consumeRateLimit: mocks.consume, rateLimitKey: (namespace: string, email: string) => `${namespace}:${email}` }))
vi.mock("bcryptjs", () => ({ default: { hashSync: () => "dummy-hash", compare: mocks.compare } }))

import { authorizeCredentials } from "./credentials"

describe("credentials provider", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.consume.mockResolvedValue(true)
    mocks.compare.mockResolvedValue(true)
    mocks.find.mockResolvedValue({ id: "u1", name: "Emi", email: "emi@example.com", passwordHash: "real-hash", isActive: true })
  })
  it("normalizes credentials even for direct Auth.js requests", async () => {
    expect(await authorizeCredentials({ email: " EMI@Example.COM ", password: "password123" })).toEqual({ id: "u1", name: "Emi", email: "emi@example.com" })
    expect(mocks.find).toHaveBeenCalledWith({ where: { email: "emi@example.com" } })
    expect(mocks.consume).toHaveBeenCalledWith("login:email:emi@example.com", 10, 900)
  })
  it("blocks throttled requests before querying or comparing passwords", async () => {
    mocks.consume.mockResolvedValue(false)
    expect(await authorizeCredentials({ email: "emi@example.com", password: "password123" })).toBeNull()
    expect(mocks.find).not.toHaveBeenCalled()
    expect(mocks.compare).not.toHaveBeenCalled()
  })
  it("blocks the account limit independently of the global limit", async () => {
    mocks.consume.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    expect(await authorizeCredentials({ email: "emi@example.com", password: "password123" })).toBeNull()
    expect(mocks.find).not.toHaveBeenCalled()
  })
  it("compares a dummy hash for nonexistent accounts", async () => {
    mocks.find.mockResolvedValue(null)
    expect(await authorizeCredentials({ email: "emi@example.com", password: "password123" })).toBeNull()
    expect(mocks.compare).toHaveBeenCalledWith("password123", "dummy-hash")
  })
  it("rejects incorrect passwords", async () => {
    mocks.compare.mockResolvedValue(false)
    expect(await authorizeCredentials({ email: "emi@example.com", password: "wrong" })).toBeNull()
  })
  it("rejects inactive accounts even with a correct password", async () => {
    mocks.find.mockResolvedValue({ id: "u1", passwordHash: "real-hash", isActive: false })
    expect(await authorizeCredentials({ email: "emi@example.com", password: "password123" })).toBeNull()
  })
  it("rejects untrusted value types", async () => {
    expect(await authorizeCredentials({ email: ["emi@example.com"], password: {} })).toBeNull()
    expect(mocks.find).not.toHaveBeenCalled()
  })
})
