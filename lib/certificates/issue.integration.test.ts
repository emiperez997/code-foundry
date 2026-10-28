import "dotenv/config"
import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/prisma"
import { issueCertificate } from "./issue"
import { findPublicCertificate } from "./verify"
import { WorkflowError } from "@/lib/evaluation/rubric"

describe.skipIf(process.env.RUN_DB_TESTS !== "1")("certificate issuance with PostgreSQL", () => {
  const prefix = `cert-${randomUUID()}`
  let courseId: string
  let moduleIds: string[]
  let assignmentIds: string[]
  let student: string
  let other: string
  let teacher: string

  beforeAll(async () => {
    const users = await Promise.all(["student", "other", "teacher"].map((name) => prisma.user.create({
      data: { email: `${prefix}-${name}@example.com`, name: name === "student" ? "María Peña" : name, passwordHash: "unused", roles: name === "teacher" ? ["TEACHER"] : ["STUDENT"] },
    })))
    ;[student, other, teacher] = users.map((u) => u.id)
    const course = await prisma.course.create({ data: { slug: prefix, title: "Curso certificable", summary: "Temporal", level: "Test", isPublished: true, modules: { create: [1, 2, 3].map((order) => ({ order, title: `Módulo ${order}`, description: "Temporal" })) } }, include: { modules: { orderBy: { order: "asc" } } } })
    courseId = course.id
    moduleIds = course.modules.map((m) => m.id)
    // Dos entregas obligatorias y una opcional
    const created = await Promise.all(course.modules.map((m, i) => prisma.assignment.create({
      data: { courseId, moduleId: m.id, order: i + 1, title: `Entrega ${i + 1}`, required: i < 2, versions: { create: { version: 1, instructions: "x", criteria: [] } } },
      include: { versions: true },
    })))
    assignmentIds = created.map((a) => a.id)
    await prisma.enrollment.createMany({ data: [student, other].map((userId) => ({ userId, courseId })) })
  })

  afterAll(async () => {
    const ids = [student, other, teacher].filter(Boolean)
    if (courseId) {
      await prisma.certificate.deleteMany({ where: { courseId } })
      await prisma.submission.deleteMany({ where: { assignment: { courseId } } })
      await prisma.assignmentVersion.deleteMany({ where: { assignment: { courseId } } })
      await prisma.assignment.deleteMany({ where: { courseId } })
      await prisma.progress.deleteMany({ where: { module: { courseId } } })
      await prisma.enrollment.deleteMany({ where: { courseId } })
      await prisma.module.deleteMany({ where: { courseId } })
      await prisma.course.deleteMany({ where: { id: courseId } })
    }
    await prisma.auditEvent.deleteMany({ where: { actorId: { in: ids } } })
    await prisma.user.deleteMany({ where: { id: { in: ids } } })
    await prisma.$disconnect()
  })

  async function approve(userId: string, index: number) {
    const assignment = await prisma.assignment.findUniqueOrThrow({ where: { id: assignmentIds[index] }, include: { versions: true } })
    await prisma.submission.create({ data: { assignmentId: assignment.id, versionId: assignment.versions[0].id, studentId: userId, attempt: 1, status: "APPROVED", repositoryUrl: "https://example.com/r", commit: "a".repeat(40), instructions: "x", evidence: "x", explanation: "x", reviewerId: teacher } })
  }

  it("rejects when reading or approvals are incomplete", async () => {
    await expect(issueCertificate(student, courseId)).rejects.toBeInstanceOf(WorkflowError)
    await prisma.progress.createMany({ data: moduleIds.map((moduleId) => ({ userId: student, moduleId })) })
    await expect(issueCertificate(student, courseId)).rejects.toBeInstanceOf(WorkflowError) // lectura 3/3 pero 0 entregas
    await approve(student, 0)
    await expect(issueCertificate(student, courseId)).rejects.toBeInstanceOf(WorkflowError) // 1/2 obligatorias
    expect(await prisma.certificate.count({ where: { courseId } })).toBe(0)
  })

  it("does not issue for non-enrolled, inactive or unpublished cases", async () => {
    await expect(issueCertificate(teacher, courseId)).rejects.toBeInstanceOf(WorkflowError)
    await prisma.course.update({ where: { id: courseId }, data: { isPublished: false } })
    await expect(issueCertificate(student, courseId)).rejects.toBeInstanceOf(WorkflowError)
    await prisma.course.update({ where: { id: courseId }, data: { isPublished: true } })
  })

  it("issues once, ignoring the optional assignment, and is idempotent under concurrency", async () => {
    await approve(student, 1)
    const results = await Promise.all(Array.from({ length: 5 }, () => issueCertificate(student, courseId)))
    expect(new Set(results.map((r) => r.certificate.code)).size).toBe(1)
    expect(results.filter((r) => r.created)).toHaveLength(1)
    expect(await prisma.certificate.count({ where: { userId: student, courseId } })).toBe(1)
    expect(await prisma.auditEvent.count({ where: { action: "certificate.issued", actorId: student } })).toBe(1)
    const again = await issueCertificate(student, courseId)
    expect(again.created).toBe(false)
    expect(again.certificate.recipientName).toBe("María Peña")
  })

  it("keeps the snapshot and the certificate when progress or name later change", async () => {
    await prisma.progress.deleteMany({ where: { userId: student } })
    await prisma.user.update({ where: { id: student }, data: { name: "Otro nombre" } })
    const again = await issueCertificate(student, courseId)
    expect(again.certificate.recipientName).toBe("María Peña")
  })

  it("does not let another student obtain a certificate from the first student's data", async () => {
    await expect(issueCertificate(other, courseId)).rejects.toBeInstanceOf(WorkflowError)
  })

  it("exposes only public fields and reports revocation", async () => {
    const { certificate } = await issueCertificate(student, courseId)
    const publicData = await findPublicCertificate(certificate.code)
    expect(Object.keys(publicData ?? {}).sort()).toEqual(["courseTitle", "issuedAt", "issuer", "recipientName", "status"])
    expect(publicData?.status).toBe("valid")
    await prisma.certificate.update({ where: { code: certificate.code }, data: { revokedAt: new Date() } })
    expect((await findPublicCertificate(certificate.code))?.status).toBe("revoked")
    // Un certificado revocado no se presenta como emitido: solicitarlo de nuevo falla.
    await expect(issueCertificate(student, courseId)).rejects.toBeInstanceOf(WorkflowError)
    expect(await findPublicCertificate("CF-2222-2222-2222-2222")).toBeNull()
  })
})
