export type Criterion = { id: string; label: string; expected: string; required: boolean }
export type CriterionResult = { id: string; passed: boolean; feedback: string }

export class WorkflowError extends Error {}

export function rubric(value: unknown): Criterion[] {
  if (!Array.isArray(value) || !value.length) throw new WorkflowError("La rúbrica no está disponible.")
  const ids = new Set<string>()
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new WorkflowError("Rúbrica inválida.")
    const row = item as Record<string, unknown>
    if (typeof row.id !== "string" || !/^[a-z0-9-]+$/.test(row.id) || ids.has(row.id) || typeof row.label !== "string" || !row.label.trim() || typeof row.expected !== "string" || !row.expected.trim() || typeof row.required !== "boolean") {
      throw new WorkflowError("Rúbrica inválida.")
    }
    ids.add(row.id)
    return { id: row.id, label: row.label, expected: row.expected, required: row.required }
  })
}

export function evaluate(criteria: Criterion[], results: CriterionResult[]) {
  if (results.length !== criteria.length || new Set(results.map((item) => item.id)).size !== results.length) throw new WorkflowError("Evaluá todos los criterios una sola vez.")
  for (const item of results) {
    if (!criteria.some((criterion) => criterion.id === item.id) || typeof item.passed !== "boolean" || typeof item.feedback !== "string" || item.feedback.length > 5000 || (!item.passed && !item.feedback.trim())) {
      throw new WorkflowError("Cada criterio que requiere cambios necesita una devolución.")
    }
  }
  return criteria.filter((criterion) => criterion.required).every((criterion) => results.find((item) => item.id === criterion.id)?.passed) ? "APPROVED" as const : "CHANGES_REQUESTED" as const
}

export const statusLabels = {
  SUBMITTED: "Enviada", IN_REVIEW: "En revisión", APPROVED: "Aprobada", CHANGES_REQUESTED: "Cambios solicitados",
}
export const roleLabels = { STUDENT: "Alumno", TEACHER: "Profesor", ADMIN: "Administrador" }
