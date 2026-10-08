import { createHash, randomBytes } from "node:crypto"
import { prisma } from "@/lib/prisma"
import type { Prisma, Role } from "@/app/generated/prisma/client"
import { normalizeEmail, validEmail } from "@/lib/auth/validation"
import { evaluate, rubric, WorkflowError, type CriterionResult } from "./rubric"

type Tx = Prisma.TransactionClient
const permittedRoles: Role[] = ["STUDENT", "TEACHER", "ADMIN"]

async function lock(tx: Tx) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(740041) IS NULL AS locked`
}

async function actor(tx: Tx, userId: string, role: Role) {
  const user = await tx.user.findUnique({ where: { id: userId } })
  if (!user?.isActive || !user.roles.includes(role)) throw new WorkflowError("No tenés permisos para realizar esta operación.")
  return user
}

function run<T>(userId: string, role: Role, operation: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await lock(tx)
    await actor(tx, userId, role)
    return operation(tx)
  }, { maxWait: 10000, timeout: 10000 })
}

async function audit(tx: Tx, actorId: string | null, action: string, targetType: string, targetId: string, details: Prisma.InputJsonValue = {}) {
  await tx.auditEvent.create({ data: { actorId, action, targetType, targetId, details } })
}

export type SubmissionInput = { assignmentId: string; versionId: string; repositoryUrl: string; commit: string; instructions: string; evidence: string; explanation: string }

export async function submitWork(userId: string, input: SubmissionInput) {
  let url: URL
  try { url = new URL(input.repositoryUrl) } catch { throw new WorkflowError("Ingresá una URL válida para el repositorio.") }
  if (url.protocol !== "https:" || url.username || url.password || input.repositoryUrl.length > 2048 || !/^[a-f0-9]{40}$/i.test(input.commit)) throw new WorkflowError("Usá un repositorio HTTPS y el hash completo del commit (40 caracteres).")
  if ([input.instructions, input.evidence, input.explanation].some((value) => !value.trim() || value.length > 10000)) throw new WorkflowError("Completá instrucciones, evidencias y explicación (hasta 10.000 caracteres cada una).")
  return run(userId, "STUDENT", async (tx) => {
    const assignment = await tx.assignment.findUnique({ where: { id: input.assignmentId }, include: { course: true } })
    if (!assignment?.course.isPublished) throw new WorkflowError("La entrega no está disponible.")
    const enrollment = await tx.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: assignment.courseId } } })
    if (!enrollment) throw new WorkflowError("Inscribite en el curso antes de entregar.")
    const version = await tx.assignmentVersion.findUnique({ where: { id: input.versionId, assignmentId: assignment.id, version: assignment.currentVersion } })
    if (!version) throw new WorkflowError("La consigna cambió. Recargá la página antes de enviar.")
    rubric(version.criteria)
    const previous = await tx.assignment.findMany({ where: { courseId: assignment.courseId, order: { lt: assignment.order }, required: true }, include: { submissions: { where: { studentId: userId, status: "APPROVED" }, take: 1 } } })
    if (previous.some((item) => !item.submissions.length)) throw new WorkflowError("Primero necesitás aprobar las entregas anteriores.")
    const latest = await tx.submission.findFirst({ where: { assignmentId: assignment.id, studentId: userId }, orderBy: { attempt: "desc" } })
    if (latest && latest.status !== "CHANGES_REQUESTED") throw new WorkflowError("Ya tenés una entrega pendiente de revisión o aprobada.")
    if (latest?.commit.toLowerCase() === input.commit.toLowerCase()) throw new WorkflowError("El reenvío debe identificar un nuevo commit con las correcciones.")
    const submission = await tx.submission.create({ data: { ...input, studentId: userId, attempt: (latest?.attempt ?? 0) + 1, commit: input.commit.toLowerCase() } })
    await audit(tx, userId, "SUBMISSION_SENT", "submission", submission.id, { attempt: submission.attempt, versionId: version.id })
    return submission
  })
}

async function assignedSubmission(tx: Tx, teacherId: string, submissionId: string) {
  const submission = await tx.submission.findUnique({ where: { id: submissionId }, include: { assignment: { include: { course: true } }, version: true } })
  if (!submission || !submission.assignment.course.isPublished || submission.studentId === teacherId) throw new WorkflowError("No podés corregir esta entrega.")
  const assignment = await tx.courseTeacher.findUnique({ where: { courseId_teacherId: { courseId: submission.assignment.courseId, teacherId } } })
  if (!assignment) throw new WorkflowError("No estás asignado a este curso.")
  return submission
}

export async function claimWork(teacherId: string, submissionId: string) {
  return run(teacherId, "TEACHER", async (tx) => {
    const submission = await assignedSubmission(tx, teacherId, submissionId)
    if (submission.status !== "SUBMITTED") throw new WorkflowError("Otra persona ya tomó o corrigió esta entrega.")
    await tx.submission.update({ where: { id: submission.id }, data: { status: "IN_REVIEW", reviewerId: teacherId, claimedAt: new Date() } })
    await audit(tx, teacherId, "REVIEW_CLAIMED", "submission", submission.id)
  })
}

export async function releaseWork(teacherId: string, submissionId: string) {
  return run(teacherId, "TEACHER", async (tx) => {
    const submission = await assignedSubmission(tx, teacherId, submissionId)
    if (submission.status !== "IN_REVIEW" || submission.reviewerId !== teacherId) throw new WorkflowError("No tenés una revisión activa sobre esta entrega.")
    await tx.submission.update({ where: { id: submission.id }, data: { status: "SUBMITTED", reviewerId: null, claimedAt: null } })
    await audit(tx, teacherId, "REVIEW_RELEASED", "submission", submission.id)
  })
}

export async function reviewWork(teacherId: string, submissionId: string, results: CriterionResult[], feedback: string) {
  if (feedback.length > 10000) throw new WorkflowError("La devolución general admite hasta 10.000 caracteres.")
  return run(teacherId, "TEACHER", async (tx) => {
    const submission = await assignedSubmission(tx, teacherId, submissionId)
    if (submission.status !== "IN_REVIEW" || submission.reviewerId !== teacherId) throw new WorkflowError("Primero tenés que tomar esta entrega.")
    const status = evaluate(rubric(submission.version.criteria), results)
    await tx.submission.update({ where: { id: submission.id }, data: { status, results, feedback: feedback.trim(), reviewedAt: new Date() } })
    await audit(tx, teacherId, "REVIEW_COMPLETED", "submission", submission.id, { status, versionId: submission.versionId })
    return status
  })
}

export async function manageUser(adminId: string, userId: string, roles: Role[], isActive: boolean) {
  if (!roles.length || new Set(roles).size !== roles.length || roles.some((role) => !permittedRoles.includes(role))) throw new WorkflowError("Elegí al menos un rol válido.")
  return run(adminId, "ADMIN", async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new WorkflowError("El usuario no existe.")
    if (user.isActive && user.roles.includes("ADMIN") && (!isActive || !roles.includes("ADMIN")) && await tx.user.count({ where: { isActive: true, roles: { has: "ADMIN" } } }) <= 1) throw new WorkflowError("Debe quedar al menos un administrador activo.")
    await tx.user.update({ where: { id: userId }, data: { roles, isActive } })
    let released = 0
    if (!isActive || !roles.includes("TEACHER")) {
      const result = await tx.submission.updateMany({ where: { reviewerId: userId, status: "IN_REVIEW" }, data: { status: "SUBMITTED", reviewerId: null, claimedAt: null } })
      released = result.count
    }
    if (!roles.includes("TEACHER")) await tx.courseTeacher.deleteMany({ where: { teacherId: userId } })
    await audit(tx, adminId, "USER_UPDATED", "user", userId, { before: { roles: user.roles, isActive: user.isActive }, after: { roles, isActive }, released })
  })
}

export async function assignTeacher(adminId: string, teacherId: string, courseId: string, assigned: boolean) {
  return run(adminId, "ADMIN", async (tx) => {
    const teacher = await tx.user.findUnique({ where: { id: teacherId } })
    if (!teacher || (assigned && (!teacher.isActive || !teacher.roles.includes("TEACHER")))) throw new WorkflowError("Elegí un profesor activo.")
    if (!await tx.course.findUnique({ where: { id: courseId } })) throw new WorkflowError("El curso no existe.")
    let released = 0
    if (assigned) await tx.courseTeacher.upsert({ where: { courseId_teacherId: { courseId, teacherId } }, create: { courseId, teacherId }, update: {} })
    else {
      await tx.courseTeacher.deleteMany({ where: { courseId, teacherId } })
      const result = await tx.submission.updateMany({ where: { reviewerId: teacherId, status: "IN_REVIEW", assignment: { courseId } }, data: { status: "SUBMITTED", reviewerId: null, claimedAt: null } })
      released = result.count
    }
    await audit(tx, adminId, assigned ? "TEACHER_ASSIGNED" : "TEACHER_UNASSIGNED", "course", courseId, { teacherId, released })
  })
}

export async function inviteTeacher(adminId: string, emailValue: string) {
  const email = normalizeEmail(emailValue)
  if (!validEmail(email)) throw new WorkflowError("Ingresá un email válido.")
  const token = randomBytes(32).toString("base64url")
  const tokenHash = createHash("sha256").update(token).digest("hex")
  await run(adminId, "ADMIN", async (tx) => {
    const invitation = await tx.teacherInvitation.create({ data: { email, tokenHash, createdById: adminId, expiresAt: new Date(Date.now() + 7 * 86400000) } })
    await audit(tx, adminId, "TEACHER_INVITED", "invitation", invitation.id, { email })
  })
  return `/invitations/${token}`
}

export async function acceptInvitation(userId: string, token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new WorkflowError("Invitación inválida.")
  const tokenHash = createHash("sha256").update(token).digest("hex")
  return prisma.$transaction(async (tx) => {
    await lock(tx)
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user?.isActive) throw new WorkflowError("Iniciá sesión con una cuenta activa.")
    const invitation = await tx.teacherInvitation.findUnique({ where: { tokenHash } })
    if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date() || invitation.email !== user.email) throw new WorkflowError("La invitación venció, ya fue usada o pertenece a otro email.")
    const issuer = await tx.user.findUnique({ where: { id: invitation.createdById } })
    if (!issuer?.isActive || !issuer.roles.includes("ADMIN")) throw new WorkflowError("La invitación ya no está habilitada.")
    await tx.teacherInvitation.update({ where: { id: invitation.id }, data: { usedAt: new Date() } })
    await tx.user.update({ where: { id: userId }, data: { roles: Array.from(new Set([...user.roles, "TEACHER" as const])) } })
    await audit(tx, userId, "INVITATION_ACCEPTED", "invitation", invitation.id)
  })
}

export async function revokeInvitation(adminId: string, invitationId: string) {
  return run(adminId, "ADMIN", async (tx) => {
    const result = await tx.teacherInvitation.updateMany({ where: { id: invitationId, usedAt: null }, data: { expiresAt: new Date(0) } })
    if (!result.count) throw new WorkflowError("La invitación no existe o ya fue aceptada.")
    await audit(tx, adminId, "INVITATION_REVOKED", "invitation", invitationId)
  })
}

export async function bootstrapAdmin(emailValue: string) {
  const email = normalizeEmail(emailValue)
  if (!validEmail(email)) throw new WorkflowError("Indicá el email de una cuenta registrada.")
  return prisma.$transaction(async (tx) => {
    await lock(tx)
    const user = await tx.user.findUnique({ where: { email } })
    if (!user?.isActive) throw new WorkflowError("Registrá primero una cuenta activa con ese email.")
    if (user.roles.includes("ADMIN")) return
    await tx.user.update({ where: { id: user.id }, data: { roles: [...user.roles, "ADMIN"] } })
    await audit(tx, null, "ADMIN_BOOTSTRAPPED", "user", user.id, { source: "local-cli" })
  })
}
