export type EligibilityInput = {
  moduleIds: string[]
  completedModuleIds: Iterable<string>
  requiredAssignmentIds: string[]
  approvedAssignmentIds: Iterable<string>
}

export type CourseStatus = {
  reading: { completed: number; total: number; done: boolean }
  assignments: { approved: number; required: number; done: boolean }
  eligible: boolean
}

/**
 * Regla pura (D15): todos los módulos con Progress y toda entrega con required=true aprobada.
 * Un curso sin módulos o sin entregas obligatorias nunca es elegible.
 */
export function computeCourseStatus(input: EligibilityInput): CourseStatus {
  const completed = new Set(input.completedModuleIds)
  const approved = new Set(input.approvedAssignmentIds)
  const modules = new Set(input.moduleIds)
  const required = new Set(input.requiredAssignmentIds)
  const readDone = [...modules].filter((id) => completed.has(id)).length
  const approvedDone = [...required].filter((id) => approved.has(id)).length
  const readingDone = modules.size > 0 && readDone === modules.size
  const assignmentsDone = required.size > 0 && approvedDone === required.size
  return {
    reading: { completed: readDone, total: modules.size, done: readingDone },
    assignments: { approved: approvedDone, required: required.size, done: assignmentsDone },
    eligible: readingDone && assignmentsDone,
  }
}

export function isEligible(input: EligibilityInput): boolean {
  return computeCourseStatus(input).eligible
}
