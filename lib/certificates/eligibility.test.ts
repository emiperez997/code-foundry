import { describe, expect, it } from "vitest"
import { computeCourseStatus, isEligible } from "./eligibility"

const modules = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"]
const required = ["a1", "a2", "a3"]
const make = (completed: string[], approved: string[], req = required, mods = modules) => ({ moduleIds: mods, completedModuleIds: completed, requiredAssignmentIds: req, approvedAssignmentIds: approved })

describe("certificate eligibility", () => {
  it("is eligible with all modules read and all required assignments approved", () => {
    expect(isEligible(make(modules, required))).toBe(true)
  })
  it("is not eligible with 7/7 modules and 2/3 assignments", () => {
    const status = computeCourseStatus(make(modules, ["a1", "a2"]))
    expect(status.eligible).toBe(false)
    expect(status.reading).toEqual({ completed: 7, total: 7, done: true })
    expect(status.assignments).toEqual({ approved: 2, required: 3, done: false })
  })
  it("is not eligible with 6/7 modules and 3/3 assignments", () => {
    expect(isEligible(make(modules.slice(0, 6), required))).toBe(false)
  })
  it("never certifies a course without required assignments or modules", () => {
    expect(isEligible(make(modules, [], []))).toBe(false)
    expect(isEligible(make([], required, required, []))).toBe(false)
  })
  it("uses the required flag, not a fixed number of assignments", () => {
    expect(isEligible(make(modules, ["a1", "a2"], ["a1", "a2"]))).toBe(true)
    expect(isEligible(make(modules, required, ["a1", "a2", "a3", "a4"]))).toBe(false)
  })
  it("ignores progress or approvals for unrelated modules and assignments", () => {
    expect(isEligible(make([...modules.slice(0, 6), "other"], [...required]))).toBe(false)
    expect(isEligible(make(modules, ["a1", "a2", "x"]))).toBe(false)
  })
  it("counts duplicated entries once", () => {
    expect(computeCourseStatus(make([...modules, ...modules], ["a1", "a1", "a1"])).assignments.approved).toBe(1)
  })
})
