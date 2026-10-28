import { describe, expect, it } from "vitest"
import { computeCourseStatus } from "@/lib/certificates/eligibility"
import { nextStepText } from "@/components/course-status"

const status = (read: number, approved: number) => computeCourseStatus({
  moduleIds: ["a", "b"], completedModuleIds: ["a", "b"].slice(0, read),
  requiredAssignmentIds: ["x", "y"], approvedAssignmentIds: ["x", "y"].slice(0, approved),
})

describe("nextStepText", () => {
  it("separates finished reading from pending approval", () => {
    expect(nextStepText(status(2, 1))).toMatch(/faltan 1 entregas obligatorias/)
  })
  it("asks to finish reading when modules are missing", () => {
    expect(nextStepText(status(1, 2))).toMatch(/1 módulos/)
  })
  it("reports a revoked certificate instead of offering it", () => {
    const text = nextStepText(status(2, 2), true, true)
    expect(text).toMatch(/revocado/i)
    expect(text).not.toMatch(/podés descargarlo|obtené/i)
  })
  it("offers the certificate only when eligible", () => {
    expect(nextStepText(status(2, 2))).toMatch(/obtené tu certificado/)
    expect(nextStepText(status(2, 2), true)).toMatch(/ya tenés tu certificado/i)
  })
})
