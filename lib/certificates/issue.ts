import { prisma } from "@/lib/prisma"
import { WorkflowError } from "@/lib/evaluation/rubric"
import { generateCertificateCode } from "./code"
import { getCourseStatus } from "./status"

const MAX_CODE_ATTEMPTS = 3

const certificateSelect = { id: true, code: true, courseId: true, recipientName: true, courseTitle: true, issuedAt: true, revokedAt: true } as const

/**
 * Emite (o devuelve) el certificado del alumno. Idempotente y seguro ante concurrencia:
 * `createMany({ skipDuplicates })` usa ON CONFLICT DO NOTHING, así que un doble clic o dos
 * solicitudes simultáneas nunca fallan ni crean dos filas (UNIQUE userId+courseId).
 * La identidad `userId` debe venir siempre de la sesión.
 */
export async function issueCertificate(userId: string, courseId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { name: true, isActive: true, roles: true } })
    if (!user?.isActive || !user.roles.includes("STUDENT")) throw new WorkflowError("No tenés permisos para obtener este certificado.")
    const course = await tx.course.findUnique({ where: { id: courseId }, select: { title: true, isPublished: true } })
    if (!course?.isPublished) throw new WorkflowError("El curso no está disponible.")
    const enrollment = await tx.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { id: true } })
    if (!enrollment) throw new WorkflowError("Tenés que estar inscripto en el curso.")

    const existing = await tx.certificate.findUnique({ where: { userId_courseId: { userId, courseId } }, select: certificateSelect })
    if (existing?.revokedAt) throw new WorkflowError("Tu certificado fue revocado y no puede volver a emitirse. Contactá a un administrador.")
    if (existing) return { certificate: existing, created: false }

    const status = await getCourseStatus(userId, courseId, tx)
    if (!status.eligible) throw new WorkflowError("Todavía no cumplís los requisitos: completá la lectura y aprobá todas las entregas obligatorias.")

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateCertificateCode()
      const { count } = await tx.certificate.createMany({
        data: { code, userId, courseId, recipientName: user.name, courseTitle: course.title },
        skipDuplicates: true,
      })
      const certificate = await tx.certificate.findUnique({ where: { userId_courseId: { userId, courseId } }, select: certificateSelect })
      if (certificate) {
        if (count === 1) {
          await tx.auditEvent.create({ data: { actorId: userId, action: "certificate.issued", targetType: "certificate", targetId: certificate.id, details: { courseId, code: certificate.code } } })
        }
        return { certificate, created: count === 1 }
      }
      // Sin fila para (userId, courseId): el conflicto fue de `code`; reintentar con otro código.
    }
    throw new WorkflowError("No pudimos generar el certificado. Intentá de nuevo.")
  })
}
