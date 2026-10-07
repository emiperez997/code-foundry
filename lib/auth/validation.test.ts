import { describe, expect, it } from "vitest"
import { positiveOrder, safeCallbackPath, textField, validPasswordLength } from "./validation"

describe("safeCallbackPath", () => {
  it("preserves internal destinations and query strings", () => {
    expect(safeCallbackPath("/dashboard?tab=completed#courses")).toBe("/dashboard?tab=completed#courses")
  })
  it.each([undefined, ["/dashboard"], "https://evil.example", "//evil.example", "/\\evil.example", "/%2f%2fevil.example", "/%252fevil.example", "/%0aevil", "/login", "/login/", "/reg%69ster", "/register", "/\nevil"])("rejects unsafe destination %s", (value) => {
    expect(safeCallbackPath(value)).toBe("/courses")
  })
})

describe("form validation", () => {
  it.each(["1x", "0", "-1", "1.5", "2147483648", "", " 1"])("rejects invalid order %s", (value) => {
    expect(positiveOrder(value)).toBeNull()
  })
  it("accepts a positive integer", () => expect(positiveOrder("3")).toBe(3))
  it("checks password bytes rather than characters", () => {
    expect(validPasswordLength("á".repeat(36))).toBe(true)
    expect(validPasswordLength("á".repeat(37))).toBe(false)
  })
  it("ignores file fields", () => {
    const form = new FormData()
    form.set("email", new Blob(["fake"]), "email.txt")
    expect(textField(form, "email")).toBe("")
  })
})
