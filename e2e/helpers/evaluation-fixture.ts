import "dotenv/config"
import { readFileSync } from "node:fs"
import bcrypt from "bcryptjs"
import { prisma } from "../../lib/prisma"
import { rateLimitKey } from "../../lib/auth/rate-limit"

type FixtureInput = { prefix: string; password: string; assignmentId?: string; attempt?: number }
// Prisma se ejecuta con tsx: evita que Playwright transforme el cliente generado.
const data = JSON.parse(readFileSync(0, "utf8")) as FixtureInput
const { prefix, password } = data
const email = (role: string) => `${prefix}-${role}@example.com`

async function main() {
  if (!/^evaluation-e2e-[a-f0-9-]{36}$/.test(prefix)) throw new Error("Fixture inválido")
  switch (process.argv[2]) {
    case "create": {
      const passwordHash = await bcrypt.hash(password, 10)
      return prisma.$transaction(async (tx) => {
        const users = await Promise.all(["student", "teacher", "admin", "invitee"].map((role) => tx.user.create({
          data: { email: email(role), name: `${prefix}-${role}`, passwordHash, roles: role === "teacher" ? ["TEACHER"] : role === "admin" ? ["ADMIN"] : ["STUDENT"] },
        })))
        const [student, teacher, admin, invitee] = users.map((user) => user.id)
        const course = await tx.course.create({ data: {
          slug: prefix, title: "Curso temporal de evaluación", summary: "Fixture", level: "Test", isPublished: true,
          modules: { create: { order: 1, title: "Módulo temporal", description: "Fixture" } },
        }, include: { modules: true } })
        const assignment = await tx.assignment.create({ data: {
          courseId: course.id, moduleId: course.modules[0].id, order: 1, title: "Entrega temporal",
          versions: { create: { version: 1, instructions: "Implementar autorización", criteria: [{ id: "security", label: "Seguridad", expected: "Protege recursos", required: true }] } },
        } })
        await tx.enrollment.create({ data: { userId: student, courseId: course.id } })
        await tx.courseTeacher.create({ data: { teacherId: teacher, courseId: course.id } })
        return { student, teacher, admin, invitee, courseId: course.id, assignmentId: assignment.id }
      })
    }
    case "submission": {
      if (!data.assignmentId || !Number.isInteger(data.attempt)) throw new Error("Intento inválido")
      return prisma.submission.findFirstOrThrow({ where: { assignmentId: data.assignmentId, assignment: { course: { slug: prefix } }, attempt: data.attempt }, select: { id: true, status: true, reviewerId: true } })
    }
    case "cleanup": return prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { slug: prefix } })
      if (course) {
        const courseId = course.id
        await tx.submission.deleteMany({ where: { assignment: { courseId } } })
        await tx.assignmentVersion.deleteMany({ where: { assignment: { courseId } } })
        await tx.assignment.deleteMany({ where: { courseId } })
        await tx.courseTeacher.deleteMany({ where: { courseId } })
        await tx.enrollment.deleteMany({ where: { courseId } })
        await tx.module.deleteMany({ where: { courseId } })
        await tx.course.delete({ where: { id: courseId } })
      }
      const users = await tx.user.findMany({ where: { email: { in: ["student", "teacher", "admin", "invitee"].map(email) } }, select: { id: true } })
      const ids = users.map((user) => user.id)
      await tx.teacherInvitation.deleteMany({ where: { createdById: { in: ids } } })
      await tx.auditEvent.deleteMany({ where: { actorId: { in: ids } } })
      const limitKeys = ["student", "teacher", "admin", "invitee"].flatMap((role) => ["login:email", "register:email"].map((namespace) => rateLimitKey(namespace, email(role))))
      await tx.authRateLimit.deleteMany({ where: { key: { in: limitKeys } } })
      await tx.user.deleteMany({ where: { id: { in: ids } } })
      return {}
    })
    default: throw new Error("Acción de fixture inválida")
  }
}
main().then((result) => console.log(JSON.stringify(result))).catch(() => {
  console.error("Falló el fixture de evaluación E2E.")
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
