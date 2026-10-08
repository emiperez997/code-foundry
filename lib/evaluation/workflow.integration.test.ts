import "dotenv/config"
import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
const session = vi.hoisted(() => ({ userId: "" }))
vi.mock("@/auth", () => ({ auth: async () => ({ user: { id: session.userId } }) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`) },
  notFound: () => { throw new Error("not-found") },
}))
import { prisma } from "@/lib/prisma"
import { currentUser, requireUser } from "@/lib/auth/permissions"
import { submitAssignment } from "@/lib/actions/evaluation"
import { syncAssessmentDefinitions, type Definition } from "./seed"
import { acceptInvitation, assignTeacher, bootstrapAdmin, claimWork, inviteTeacher, manageUser, releaseWork, reviewWork, revokeInvitation, submitWork } from "./workflow"

describe.skipIf(process.env.RUN_DB_TESTS !== "1")("evaluation workflow with PostgreSQL", () => {
  const prefix = `phase4-${randomUUID()}`
  const criteria = [{ id: "security", label: "Seguridad", expected: "Protege recursos", required: true }]
  const definitions: Definition[] = [1, 2].map((order) => ({ order, moduleOrder: order, title: `Entrega ${order}`, version: 1, required: true, instructions: "Consigna original", criteria }))
  let courseId: string
  let student: string
  let outsider: string
  let teacher: string
  let otherTeacher: string
  let admin: string
  let otherAdmin: string
  let first: string
  let version: string
  let second: string
  let secondVersion: string
  let submissionId: string
  let acceptedId: string
  function input(assignmentId = first, versionId = version, commit = "a".repeat(40)) {
    return { assignmentId, versionId, commit, repositoryUrl: "https://example.com/repo", instructions: "pnpm install", evidence: "Tests aprobados", explanation: "Decisiones del trabajo" }
  }
  const pass = [{ id: "security", passed: true, feedback: "" }]
  const fail = [{ id: "security", passed: false, feedback: "Falta autorización" }]
  beforeAll(async () => {
    const users = await Promise.all(["student", "outsider", "teacher", "otherTeacher", "admin", "otherAdmin"].map((name) => prisma.user.create({
      data: { email: `${prefix}-${name}@example.com`, name, passwordHash: "unused", roles: name.includes("Teacher") || name === "teacher" ? ["STUDENT", "TEACHER"] : name.includes("Admin") || name === "admin" ? ["STUDENT", "ADMIN"] : ["STUDENT"] },
    })))
    ;[student, outsider, teacher, otherTeacher, admin, otherAdmin] = users.map((u) => u.id)
    const course = await prisma.course.create({ data: { slug: prefix, title: "Fixture", summary: "Temporal", level: "Test", isPublished: true, modules: { create: [1, 2].map((order) => ({ order, title: "Módulo", description: "Temporal" })) } } })
    courseId = course.id
    await syncAssessmentDefinitions({ courseSlug: prefix, assignments: definitions })
    const assignments = await prisma.assignment.findMany({ where: { courseId }, orderBy: { order: "asc" }, include: { versions: true } })
    first = assignments[0].id; version = assignments[0].versions[0].id
    second = assignments[1].id; secondVersion = assignments[1].versions[0].id
    await prisma.enrollment.createMany({ data: [student, teacher].map((userId) => ({ userId, courseId })) })
    await assignTeacher(admin, teacher, courseId, true)
    await assignTeacher(admin, otherTeacher, courseId, true)
  })
  afterAll(async () => {
    const ids = [student, outsider, teacher, otherTeacher, admin, otherAdmin].filter(Boolean)
    if (courseId) {
      await prisma.submission.deleteMany({ where: { assignment: { courseId } } })
      await prisma.assignmentVersion.deleteMany({ where: { assignment: { courseId } } })
      await prisma.assignment.deleteMany({ where: { courseId } })
      await prisma.courseTeacher.deleteMany({ where: { courseId } })
      await prisma.enrollment.deleteMany({ where: { courseId } })
      await prisma.module.deleteMany({ where: { courseId } })
      await prisma.course.deleteMany({ where: { id: courseId } })
    }
    await prisma.teacherInvitation.deleteMany({ where: { createdById: { in: ids } } })
    await prisma.auditEvent.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { targetId: { in: ids } }] } })
    await prisma.user.deleteMany({ where: { id: { in: ids } } })
    await prisma.$disconnect()
  })
  it("checks enrollment, order, published courses and actor role before writing", async () => {
    await expect(submitWork(outsider, input())).rejects.toThrow()
    await expect(submitWork(student, input(second, secondVersion))).rejects.toThrow()
    await expect(claimWork(student, "missing")).rejects.toThrow()
    await prisma.course.update({ where: { id: courseId }, data: { isPublished: false } })
    await expect(submitWork(student, input())).rejects.toThrow()
    await prisma.course.update({ where: { id: courseId }, data: { isPublished: true } })
    expect(await prisma.submission.count({ where: { assignmentId: first } })).toBe(0)
  })
  it("uses session identity even if a form supplies another student", async () => {
    session.userId = student
    const form = new FormData()
    Object.entries(input()).forEach(([key, value]) => form.set(key, value))
    form.set("studentId", outsider)
    expect((await submitAssignment({}, form)).error).toBeUndefined()
    const record = await prisma.submission.findFirstOrThrow({ where: { assignmentId: first } })
    expect(record.studentId).toBe(student)
    submissionId = record.id
  })
  it("allows only one concurrent claim and prevents corrections by another teacher", async () => {
    const claims = await Promise.allSettled([claimWork(teacher, submissionId), claimWork(otherTeacher, submissionId)])
    expect(claims.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    const record = await prisma.submission.findUniqueOrThrow({ where: { id: submissionId } })
    const reviewer = record.reviewerId!
    const another = reviewer === teacher ? otherTeacher : teacher
    await expect(reviewWork(another, submissionId, pass, "")).rejects.toThrow()
    await expect(reviewWork(reviewer, submissionId, [], "")).rejects.toThrow()
    expect(await reviewWork(reviewer, submissionId, fail, "Corregir autorización")).toBe("CHANGES_REQUESTED")
    await expect(reviewWork(reviewer, submissionId, pass, "")).rejects.toThrow()
  })
  it("preserves old versions and refuses seed edits without a new version", async () => {
    await expect(syncAssessmentDefinitions({ courseSlug: prefix, assignments: [{ ...definitions[0], instructions: "Alteración" }] })).rejects.toThrow()
    expect((await prisma.assignmentVersion.findUniqueOrThrow({ where: { id: version } })).instructions).toBe("Consigna original")
    await syncAssessmentDefinitions({ courseSlug: prefix, assignments: [{ ...definitions[0], version: 2, instructions: "Consigna nueva" }] })
    await expect(submitWork(student, input())).rejects.toThrow()
    const current = await prisma.assignmentVersion.findFirstOrThrow({ where: { assignmentId: first, version: 2 } })
    await expect(submitWork(student, input(first, current.id))).rejects.toThrow()
    const attempts = await Promise.allSettled([submitWork(student, input(first, current.id, "b".repeat(40))), submitWork(student, input(first, current.id, "c".repeat(40)))])
    expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    const latest = await prisma.submission.findFirstOrThrow({ where: { assignmentId: first }, orderBy: { attempt: "desc" } })
    expect(latest.attempt).toBe(2)
    expect(latest.versionId).toBe(current.id)
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: submissionId } })).versionId).toBe(version)
    acceptedId = latest.id
  })
  it("approves by criteria, unlocks next assignment and records audit events", async () => {
    await claimWork(teacher, acceptedId)
    expect(await reviewWork(teacher, acceptedId, pass, "Buen trabajo")).toBe("APPROVED")
    const next = await submitWork(student, input(second, secondVersion))
    expect(next.attempt).toBe(1)
    expect(await prisma.auditEvent.count({ where: { targetId: acceptedId } })).toBe(3)
    submissionId = next.id
  })
  it("prevents self-review and requires course assignment", async () => {
    const current = await prisma.assignmentVersion.findFirstOrThrow({ where: { assignmentId: first, version: 2 } })
    const own = await submitWork(teacher, input(first, current.id))
    await expect(claimWork(teacher, own.id)).rejects.toThrow()
    await assignTeacher(admin, otherTeacher, courseId, false)
    await expect(claimWork(otherTeacher, own.id)).rejects.toThrow()
    await assignTeacher(admin, otherTeacher, courseId, true)
  })
  it("releases claims when unassigned or deactivated, and applies fresh session permissions", async () => {
    await claimWork(teacher, submissionId)
    await assignTeacher(admin, teacher, courseId, false)
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: submissionId } })).status).toBe("SUBMITTED")
    await assignTeacher(admin, teacher, courseId, true)
    await claimWork(teacher, submissionId)
    await manageUser(admin, teacher, ["STUDENT", "TEACHER"], false)
    session.userId = teacher
    expect(await currentUser()).toBeNull()
    await expect(claimWork(teacher, submissionId)).rejects.toThrow()
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: submissionId } })).reviewerId).toBeNull()
    await manageUser(admin, teacher, ["STUDENT"], true)
    await expect(requireUser("/teacher", "TEACHER")).rejects.toThrow("not-found")
    expect(await prisma.courseTeacher.count({ where: { teacherId: teacher } })).toBe(0)
    await claimWork(otherTeacher, submissionId)
    await releaseWork(otherTeacher, submissionId)
  })
  it("supports email-bound single-use invitations, expiry and revocation", async () => {
    const email = `${prefix}-outsider@example.com`
    const link = await inviteTeacher(admin, email)
    const token = link.split("/").at(-1)!
    await expect(acceptInvitation(student, token)).rejects.toThrow()
    const accepted = await Promise.allSettled([acceptInvitation(outsider, token), acceptInvitation(outsider, token)])
    expect(accepted.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: outsider } })).roles).toEqual(["STUDENT", "TEACHER"])
    const revoked = await inviteTeacher(admin, email)
    const record = await prisma.teacherInvitation.findFirstOrThrow({ where: { email, usedAt: null } })
    expect(record.tokenHash).not.toBe(revoked.split("/").at(-1))
    await revokeInvitation(admin, record.id)
    await expect(acceptInvitation(outsider, revoked.split("/").at(-1)!)).rejects.toThrow()
    const expired = await inviteTeacher(admin, email)
    await prisma.teacherInvitation.updateMany({ where: { email, usedAt: null }, data: { expiresAt: new Date(0) } })
    await expect(acceptInvitation(outsider, expired.split("/").at(-1)!)).rejects.toThrow()
    const issued = await inviteTeacher(otherAdmin, email)
    await manageUser(admin, otherAdmin, ["STUDENT"], true)
    await expect(acceptInvitation(outsider, issued.split("/").at(-1)!)).rejects.toThrow()
    await manageUser(admin, otherAdmin, ["STUDENT", "ADMIN"], true)
  })
  it("protects the last active administrator under simultaneous demotions", async () => {
    // Este caso requiere la base descartable creada por pnpm test:db.
    expect(await prisma.user.count({ where: { isActive: true, roles: { has: "ADMIN" } } })).toBe(2)
    const results = await Promise.allSettled([
      manageUser(admin, admin, ["STUDENT"], true),
      manageUser(otherAdmin, otherAdmin, ["STUDENT"], true),
    ])
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    expect(await prisma.user.count({ where: { isActive: true, roles: { has: "ADMIN" } } })).toBe(1)
    await bootstrapAdmin(`${prefix}-admin@example.com`)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: admin } })).roles).toContain("ADMIN")
  })
})
