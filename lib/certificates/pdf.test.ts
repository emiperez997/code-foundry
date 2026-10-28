import { describe, expect, it } from "vitest"
import { generateCertificatePdf, sanitizePdfText } from "./pdf"

const base = { courseTitle: "Autenticación en el mundo real", issuedAt: new Date("2026-10-28T12:00:00Z"), code: "CF-7K3M-92QD-XH4T-ABCD", verifyUrl: "http://localhost:3000/verify/CF-7K3M-92QD-XH4T-ABCD" }
const header = (bytes: Uint8Array) => Buffer.from(bytes.slice(0, 5)).toString("latin1")

describe("sanitizePdfText", () => {
  it("keeps Spanish accents used in the certificate template", () => {
    expect(sanitizePdfText("Código de verificación — Verifica en: Año")).toBe("Código de verificación ? Verifica en: Año")
  })
  it("keeps Spanish accents and ñ", () => {
    expect(sanitizePdfText("José Peña — Ünïcode ¿Qué?")).toBe("José Peña ? Ünïcode ¿Qué?")
  })
  it("replaces CJK, emoji and control characters with ?", () => {
    expect(sanitizePdfText("李雷 😀\u0000\n x")).toBe("?? ?? x")
    expect(sanitizePdfText("a\tb")).toBe("a b")
  })
  it("normalizes decomposed accents", () => {
    expect(sanitizePdfText("Jose\u0301")).toBe("José")
  })
})

describe("generateCertificatePdf", () => {
  it("creates a PDF for accented names", async () => {
    const bytes = await generateCertificatePdf({ ...base, recipientName: "María José Peña Núñez" })
    expect(header(bytes)).toBe("%PDF-")
  })
  it("does not fail with non-Latin-1 characters", async () => {
    const bytes = await generateCertificatePdf({ ...base, recipientName: "李雷 😀 Мария", courseTitle: "课程 🚀" })
    expect(header(bytes)).toBe("%PDF-")
  })
  it("handles very long names and unbroken words", async () => {
    const bytes = await generateCertificatePdf({ ...base, recipientName: "Nombre ".repeat(80), courseTitle: "X".repeat(400) })
    expect(header(bytes)).toBe("%PDF-")
  })
  it("handles empty and revoked data", async () => {
    expect(header(await generateCertificatePdf({ ...base, recipientName: "", revoked: true }))).toBe("%PDF-")
  })
})
