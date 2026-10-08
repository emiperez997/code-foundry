"use server"

import { revalidatePath } from "next/cache"
import type { Role } from "@/app/generated/prisma/client"
import { currentUser } from "@/lib/auth/permissions"
import { textField } from "@/lib/auth/validation"
import { acceptInvitation, assignTeacher, claimWork, inviteTeacher, manageUser, releaseWork, reviewWork, revokeInvitation, submitWork } from "@/lib/evaluation/workflow"
import { WorkflowError, statusLabels } from "@/lib/evaluation/rubric"

export type ActionState = { error?: string; message?: string; url?: string }

async function act(operation: (userId: string) => Promise<ActionState>): Promise<ActionState> {
  try {
    const user = await currentUser()
    if (!user) return { error: "Iniciá sesión con una cuenta activa." }
    const result = await operation(user.id)
    for (const path of ["/dashboard", "/dashboard/assignments", "/teacher", "/admin"]) revalidatePath(path)
    revalidatePath("/assignments/[id]", "page")
    revalidatePath("/teacher/submissions/[id]", "page")
    revalidatePath("/invitations/[token]", "page")
    return result
  } catch (error) {
    if (error instanceof WorkflowError) return { error: error.message }
    console.error("No se pudo completar una operación de evaluación o administración.")
    return { error: "No se pudo completar la operación. Intentá nuevamente." }
  }
}

export async function submitAssignment(_previous: ActionState, form: FormData): Promise<ActionState> {
  return act(async (userId) => {
    await submitWork(userId, {
      assignmentId: textField(form, "assignmentId"), versionId: textField(form, "versionId"),
      repositoryUrl: textField(form, "repositoryUrl").trim(), commit: textField(form, "commit").trim(),
      instructions: textField(form, "instructions").trim(), evidence: textField(form, "evidence").trim(), explanation: textField(form, "explanation").trim(),
    })
    return { message: "Entrega enviada. Podés consultar su estado y devolución en esta página." }
  })
}

export async function claimSubmission(_previous: ActionState, form: FormData): Promise<ActionState> {
  return act(async (userId) => { await claimWork(userId, textField(form, "submissionId")); return { message: "La entrega quedó asignada a tu revisión." } })
}

export async function releaseSubmission(_previous: ActionState, form: FormData): Promise<ActionState> {
  return act(async (userId) => { await releaseWork(userId, textField(form, "submissionId")); return { message: "La entrega volvió a la bandeja de pendientes." } })
}

export async function reviewSubmission(_previous: ActionState, form: FormData): Promise<ActionState> {
  return act(async (userId) => {
    let ids: unknown
    try { ids = JSON.parse(textField(form, "criterionIds")) } catch { throw new WorkflowError("No se pudo identificar la rúbrica.") }
    if (!Array.isArray(ids) || ids.length > 100 || ids.some((id) => typeof id !== "string" || !/^[a-z0-9-]+$/.test(id))) throw new WorkflowError("Rúbrica inválida.")
    const results = (ids as string[]).map((id) => {
      const decision = textField(form, `result-${id}`)
      if (decision !== "pass" && decision !== "changes") throw new WorkflowError("Evaluá todos los criterios.")
      return { id, passed: decision === "pass", feedback: textField(form, `feedback-${id}`).trim() }
    })
    const status = await reviewWork(userId, textField(form, "submissionId"), results, textField(form, "feedback"))
    return { message: `Corrección guardada: ${statusLabels[status]}.` }
  })
}

export async function updateUser(_previous: ActionState, form: FormData): Promise<ActionState> {
  return act(async (adminId) => {
    const roles: Role[] = []
    for (const role of ["STUDENT", "TEACHER", "ADMIN"] as const) {
      const value = textField(form, `role-${role}`)
      if (!["yes", "no"].includes(value)) throw new WorkflowError("Seleccioná los roles del usuario.")
      if (value === "yes") roles.push(role)
    }
    const active = textField(form, "isActive")
    if (!["yes", "no"].includes(active)) throw new WorkflowError("Seleccioná el estado de la cuenta.")
    const userId = textField(form, "userId")
    await manageUser(adminId, userId, roles, active === "yes")
    if (userId === adminId) revalidatePath("/", "layout")
    return { message: "Usuario actualizado." }
  })
}

export async function updateTeacherAssignment(_previous: ActionState, form: FormData): Promise<ActionState> {
  return act(async (adminId) => {
    const assigned = textField(form, "assigned")
    if (!["yes", "no"].includes(assigned)) throw new WorkflowError("Seleccioná la operación.")
    await assignTeacher(adminId, textField(form, "teacherId"), textField(form, "courseId"), assigned === "yes")
    return { message: assigned === "yes" ? "Profesor asignado al curso." : "Asignación retirada; las revisiones pendientes fueron liberadas." }
  })
}

export async function createTeacherInvitation(_previous: ActionState, form: FormData): Promise<ActionState> {
  return act(async (adminId) => {
    const origin = process.env.AUTH_URL
    if (!origin || !/^https?:\/\//.test(origin)) throw new WorkflowError("Configurá AUTH_URL antes de crear invitaciones.")
    let base: URL
    try { base = new URL(origin) } catch { throw new WorkflowError("AUTH_URL no tiene un formato válido.") }
    const path = await inviteTeacher(adminId, textField(form, "email"))
    return { message: "Invitación válida por siete días. Copiá y compartí el enlace con el profesor.", url: new URL(path, base).href }
  })
}

export async function acceptTeacherInvitation(_previous: ActionState, form: FormData): Promise<ActionState> {
  return act(async (userId) => { await acceptInvitation(userId, textField(form, "token")); revalidatePath("/", "layout"); return { message: "Rol de profesor habilitado. El administrador podrá asignarte a los cursos." } })
}

export async function cancelTeacherInvitation(_previous: ActionState, form: FormData): Promise<ActionState> {
  return act(async (adminId) => { await revokeInvitation(adminId, textField(form, "invitationId")); return { message: "Invitación revocada." } })
}
