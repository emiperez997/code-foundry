import { describe, expect, it } from "vitest"
import { environmentErrors } from "./env"

describe("environmentErrors", () => {
  const valid = { DATABASE_URL: "postgresql://user:password@localhost:5432/codefoundry", AUTH_SECRET: "a".repeat(64) }

  it("accepts a PostgreSQL connection and sufficiently long secret", () => {
    expect(environmentErrors(valid)).toEqual([])
  })

  it("reports missing configuration", () => {
    expect(environmentErrors({})).toHaveLength(2)
  })

  it.each(["invalid", "https://localhost/db", "postgresql://localhost/"])("rejects invalid database URL %s", (DATABASE_URL) => {
    expect(environmentErrors({ ...valid, DATABASE_URL })).toHaveLength(1)
  })

  it("rejects short secrets without exposing their value", () => {
    const secret = "private-short-value"
    const errors = environmentErrors({ ...valid, AUTH_SECRET: secret })
    expect(errors).toHaveLength(1)
    expect(errors.join(" ")).not.toContain(secret)
  })
})
