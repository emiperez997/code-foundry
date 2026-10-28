import { readFileSync } from "fs"
import path from "path"
import { describe, expect, it } from "vitest"
import { rubric } from "@/lib/evaluation/rubric"

type Definition = { order: number; moduleOrder: number; title: string; version: number; instructions: string; criteria: unknown }
const content = JSON.parse(
  readFileSync(path.join(process.cwd(), "content", "assessments", "real-world-auth.json"), "utf8"),
) as { courseSlug: string; assignments: Definition[] }

describe("real-world-auth assessments content", () => {
  it("defines the 3 deliverables on modules 3, 5 and 7 with valid rubrics", () => {
    expect(content.assignments.map((a) => a.moduleOrder)).toEqual([3, 5, 7])
    for (const a of content.assignments) expect(rubric(a.criteria).length).toBeGreaterThan(0)
  })

  it("uses neutral tuteo (no voseo) in instructions and bumped the version after the rewrite", () => {
    for (const a of content.assignments) {
      expect(a.version).toBeGreaterThanOrEqual(2)
      expect(a.instructions).not.toMatch(/(Implementá|Entregá|Incluí|Extendé|Enviá|Completá)/)
      expect(a.instructions).toMatch(/\b(Implementa|Extiende|Completa)\b/)
    }
  })
})
