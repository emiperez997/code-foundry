import { describe, expect, it } from "vitest"
import { CODE_ALPHABET, CODE_PATTERN, generateCertificateCode, parseCertificateCode } from "./code"

describe("certificate code", () => {
  it("has the CF-XXXX-XXXX-XXXX-XXXX format with the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCertificateCode()
      expect(code).toMatch(CODE_PATTERN)
      expect(code.replaceAll("-", "").slice(2)).toHaveLength(16)
      expect([...code.slice(3).replaceAll("-", "")].every((c) => CODE_ALPHABET.includes(c))).toBe(true)
    }
  })
  it("excludes ambiguous characters", () => {
    expect(CODE_ALPHABET).not.toMatch(/[01ILO]/)
  })
  it("does not collide in a large sample", () => {
    const codes = new Set(Array.from({ length: 5000 }, generateCertificateCode))
    expect(codes.size).toBe(5000)
  })
  it("parses normalized input and rejects invalid ones", () => {
    const code = generateCertificateCode()
    expect(parseCertificateCode(` ${code.toLowerCase()} `)).toBe(code)
    for (const bad of ["", "CF-1111-1111-1111-1111", "CF-7K3M-92QD-XH4T", `${code}x`, "x".repeat(500), "' OR 1=1 --"]) {
      expect(parseCertificateCode(bad)).toBeNull()
    }
    expect(parseCertificateCode(undefined as unknown as string)).toBeNull()
  })
})
