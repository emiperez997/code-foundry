import { describe, expect, it } from "vitest"
import { evaluate, rubric } from "./rubric"

const criteria = rubric([
  { id: "security", label: "Seguridad", expected: "Protege recursos", required: true },
  { id: "extra", label: "Extra", expected: "Mejora opcional", required: false },
])
describe("rubrics and manual verdicts", () => {
  it("approves only when mandatory criteria pass", () => {
    expect(evaluate(criteria, [{ id: "security", passed: true, feedback: "" }, { id: "extra", passed: false, feedback: "Mejorar" }])).toBe("APPROVED")
    expect(evaluate(criteria, [{ id: "security", passed: false, feedback: "Falta control" }, { id: "extra", passed: true, feedback: "" }])).toBe("CHANGES_REQUESTED")
  })
  it.each([[], null, [{ ...criteria[0], id: "" }], [criteria[0], criteria[0]], [{ ...criteria[0], required: "yes" }]].map((input) => ({ input })))("rejects invalid definitions: $input", ({ input }) => {
    expect(() => rubric(input)).toThrow()
  })
  it.each([
    [{ id: "security", passed: true, feedback: "" }],
    [{ id: "security", passed: true, feedback: "" }, { id: "security", passed: true, feedback: "" }],
    [{ id: "unknown", passed: true, feedback: "" }, { id: "extra", passed: true, feedback: "" }],
    [{ id: "security", passed: false, feedback: " " }, { id: "extra", passed: true, feedback: "" }],
    [{ id: "security", passed: true, feedback: "x".repeat(5001) }, { id: "extra", passed: true, feedback: "" }],
  ].map((results) => ({ results })))("rejects incomplete or invalid correction $results", ({ results }) => {
    expect(() => evaluate(criteria, results)).toThrow()
  })
})
