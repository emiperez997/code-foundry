import "dotenv/config"
import { readFileSync } from "node:fs"
import bcrypt from "bcryptjs"
import { prisma } from "../../lib/prisma"
import { rateLimitKey } from "../../lib/auth/rate-limit"

type FixtureInput = { prefix: string; password: string }
// Prisma se ejecuta con tsx: evita que Playwright transforme el cliente generado.
const { prefix, password } = JSON.parse(readFileSync(0, "utf8")) as FixtureInput
const email = (role: string) => `${prefix}-${role}@example.com`
const roles = ["student", "teacher"]

async function main() {
  if (!/^certificate-e2e-[a-f0-9-]{36}$/.test(prefix)) throw new Error("Fixture inválido")
  switch (process.argv[2]) {
    case "create": {
      const passwordHash = await bcrypt.hash(password, 10)
      return prisma.$transaction(async (tx) => {
        const [student, teacher] = await Promise.all(roles.map((role) => tx.user.create({
          data: { email: email(role), name: `María Peña ${role}`, passwordHash, roles: role === "teacher" ? ["TEACHER"] : ["STUDENT"] },
        })))
        const course = await tx.course.create({ data: {
          slug: prefix, title: "Curso temporal de certificados", summary: "Fixture", level: "Test", isPublished: true,
          modules: { create: [1, 2].map((order) => ({ order, title: `Módulo ${order}`, description: "Fixture" })) },
        }, include: { modules: { orderBy: { order: "asc" } } } })
        for (const [index, mod] of course.modules.entries()) {
          await tx.assignment.create({ data: {
            courseId: course.id, moduleId: mod.id, order: index + 1, title: `Entrega ${index + 1}`,
            versions: { create: { version: 1, instructions: "Fixture", criteria: [{ id: "c", label: "C", expected: "E", required: true }] } },
          } })
        }
        await tx.enrollment.create({ data: { userId: student.id, courseId: course.id } })
        return { student: student.id, teacher: teacher.id, courseId: course.id }
      })
    }
    case "approve": {
      // La revisión manual ya se cubre en evaluation.spec.ts; aquí se fija el estado aprobado.
      const student = await prisma.user.findUniqueOrThrow({ where: { email: email("student") } })
      const teacher = await prisma.user.findUniqueOrThrow({ where: { email: email("teacher") } })
      const assignments = await prisma.assignment.findMany({ where: { course: { slug: prefix } }, include: { versions: true } })
      for (const a of assignments) {
        await prisma.submission.create({ data: { assignmentId: a.id, versionId: a.versions[0].id, studentId: student.id, attempt: 1, status: "APPROVED", repositoryUrl: "https://example.com/repo", commit: "a".repeat(40), instructions: "x", evidence: "x", explanation: "x", reviewerId: teacher.id, reviewedAt: new Date(), feedback: "SECRETO-DEVOLUCION" } })
      }
      return {}
    }
    case "cleanup": return prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { slug: prefix } })
      if (course) {
        const courseId = course.id
        await tx.certificate.deleteMany({ where: { courseId } })
        await tx.submission.deleteMany({ where: { assignment: { courseId } } })
        await tx.assignmentVersion.deleteMany({ where: { assignment: { courseId } } })
        await tx.assignment.deleteMany({ where: { courseId } })
        await tx.progress.deleteMany({ where: { module: { courseId } } })
        await tx.enrollment.deleteMany({ where: { courseId } })
        await tx.module.deleteMany({ where: { courseId } })
        await tx.course.delete({ where: { id: courseId } })
      }
      const users = await tx.user.findMany({ where: { email: { in: roles.map(email) } }, select: { id: true } })
      const ids = users.map((user) => user.id)
      await tx.auditEvent.deleteMany({ where: { actorId: { in: ids } } })
      const keys = roles.flatMap((role) => ["login:email", "register:email"].map((ns) => rateLimitKey(ns, email(role))))
      await tx.authRateLimit.deleteMany({ where: { key: { in: keys } } })
      await tx.user.deleteMany({ where: { id: { in: ids } } })
      return {}
    })
    default: throw new Error("Acción de fixture inválida")
  }
}
main().then((result) => console.log(JSON.stringify(result))).catch(() => {
  console.error("Falló el fixture de certificados E2E.")
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
