import { prisma } from "@/lib/prisma"
import { rubric } from "./rubric"

export type Definition = { order: number; moduleOrder: number; title: string; version: number; required: boolean; instructions: string; criteria: unknown }

export async function syncAssessmentDefinitions(content: { courseSlug: string; assignments: Definition[] }) {
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(740041) IS NULL AS locked`
    const course = await tx.course.findUnique({ where: { slug: content.courseSlug }, include: { modules: true } })
    if (!course) throw new Error("Ejecutá pnpm db:seed antes de cargar las entregas.")
    for (const definition of content.assignments) {
      const moduleRecord = course.modules.find((item) => item.order === definition.moduleOrder)
      if (!moduleRecord || !Number.isInteger(definition.version) || definition.version < 1 || !definition.instructions.trim()) throw new Error("Definición de entrega inválida.")
      const criteria = rubric(definition.criteria)
      const previous = await tx.assignment.findUnique({ where: { courseId_order: { courseId: course.id, order: definition.order } } })
      if (previous && previous.currentVersion > definition.version) throw new Error("No se permite retroceder la versión de una entrega.")
      const assignment = await tx.assignment.upsert({
        where: { courseId_order: { courseId: course.id, order: definition.order } },
        create: { courseId: course.id, moduleId: moduleRecord.id, order: definition.order, title: definition.title, required: definition.required, currentVersion: definition.version },
        update: { moduleId: moduleRecord.id, title: definition.title, required: definition.required, currentVersion: definition.version },
      })
      const existing = await tx.assignmentVersion.findUnique({ where: { assignmentId_version: { assignmentId: assignment.id, version: definition.version } } })
      if (existing) {
        if (existing.instructions !== definition.instructions || JSON.stringify(rubric(existing.criteria)) !== JSON.stringify(criteria)) throw new Error("La consigna o rúbrica cambió: incrementá version para conservar el historial.")
      } else await tx.assignmentVersion.create({ data: { assignmentId: assignment.id, version: definition.version, instructions: definition.instructions, criteria } })
    }
  }, { timeout: 15000 })
}
