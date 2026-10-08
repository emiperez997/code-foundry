import Link from "next/link"
import { requireUser } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"
import { positiveOrder } from "@/lib/auth/validation"
import { roleLabels, statusLabels } from "@/lib/evaluation/rubric"
import { cancelTeacherInvitation, createTeacherInvitation, updateTeacherAssignment, updateUser } from "@/lib/actions/evaluation"
import { WorkflowForm } from "@/components/workflow-form"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export const metadata = { title: "Administración" }

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireUser("/admin", "ADMIN")
  const query = await searchParams
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 254) : ""
  const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : {}
  const count = await prisma.user.count({ where })
  const pages = Math.max(1, Math.ceil(count / 20))
  const page = Math.min(positiveOrder(query.page ?? "1") ?? 1, pages)
  const [users, teachers, courses, invitations, pending, events] = await Promise.all([
    prisma.user.findMany({ where, select: { id: true, name: true, email: true, roles: true, isActive: true }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 20, skip: (page - 1) * 20 }),
    prisma.user.findMany({ where: { isActive: true, roles: { has: "TEACHER" } }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.course.findMany({ include: { teachers: { include: { teacher: { select: { id: true, name: true, isActive: true } } } } }, orderBy: { title: "asc" } }),
    prisma.teacherInvitation.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.submission.findMany({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } }, include: { assignment: { include: { course: true } }, student: { select: { name: true } }, reviewer: { select: { name: true } } }, orderBy: { createdAt: "asc" }, take: 20 }),
    prisma.auditEvent.findMany({ include: { actor: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
  ])
  const targets = (type: string) => events.filter((event) => event.targetType === type).map((event) => event.targetId)
  const [eventUsers, eventCourses, eventSubmissions, eventInvitations] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: targets("user") } }, select: { id: true, name: true } }),
    prisma.course.findMany({ where: { id: { in: targets("course") } }, select: { id: true, title: true } }),
    prisma.submission.findMany({ where: { id: { in: targets("submission") } }, select: { id: true, attempt: true, student: { select: { name: true } }, assignment: { select: { title: true } } } }),
    prisma.teacherInvitation.findMany({ where: { id: { in: targets("invitation") } }, select: { id: true, email: true } }),
  ])
  const targetNames = new Map([
    ...eventUsers.map((item) => [item.id, item.name] as const),
    ...eventCourses.map((item) => [item.id, item.title] as const),
    ...eventSubmissions.map((item) => [item.id, `${item.assignment.title} · ${item.student.name} · Intento ${item.attempt}`] as const),
    ...eventInvitations.map((item) => [item.id, item.email] as const),
  ])
  const labels: Record<string, string> = { USER_UPDATED: "Actualizó roles o estado de una cuenta", TEACHER_ASSIGNED: "Asignó un profesor", TEACHER_UNASSIGNED: "Retiró una asignación", TEACHER_INVITED: "Invitó a un profesor", INVITATION_ACCEPTED: "Aceptó una invitación", INVITATION_REVOKED: "Revocó una invitación", SUBMISSION_SENT: "Envió un trabajo", REVIEW_CLAIMED: "Tomó una entrega", REVIEW_RELEASED: "Liberó una revisión", REVIEW_COMPLETED: "Guardó una corrección", ADMIN_BOOTSTRAPPED: "Habilitó el administrador inicial" }
  return <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
    <h1 className="text-3xl font-bold">Administración</h1>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Alumnos y profesores</h2><form action="/admin" className="flex flex-wrap items-end gap-3"><div className="space-y-2"><Label htmlFor="q">Buscar por nombre o email</Label><Input id="q" name="q" defaultValue={q} maxLength={254} /></div><Button type="submit">Buscar</Button></form><p className="text-sm text-muted-foreground">{count} cuentas · Página {page} de {pages}</p>
      {!users.length && <p>No se encontraron usuarios.</p>}
      <div className="grid gap-4 md:grid-cols-2">{users.map((user) => <Card key={user.id}><CardHeader><CardTitle className="text-lg">{user.name}</CardTitle><p className="break-all text-sm text-muted-foreground">{user.email}</p><Badge variant="secondary" className="w-fit">{user.isActive ? "Activa" : "Desactivada"}</Badge></CardHeader><CardContent><WorkflowForm action={updateUser} label="Guardar usuario"><input type="hidden" name="userId" value={user.id} /><div className="grid gap-3 sm:grid-cols-2">{(["STUDENT", "TEACHER", "ADMIN"] as const).map((role) => <div key={role} className="space-y-2"><Label htmlFor={`${user.id}-${role}`}>{roleLabels[role]}</Label><NativeSelect id={`${user.id}-${role}`} name={`role-${role}`} defaultValue={user.roles.includes(role) ? "yes" : "no"}><NativeSelectOption value="yes">Sí</NativeSelectOption><NativeSelectOption value="no">No</NativeSelectOption></NativeSelect></div>)}<div className="space-y-2"><Label htmlFor={`${user.id}-active`}>Cuenta activa</Label><NativeSelect id={`${user.id}-active`} name="isActive" defaultValue={user.isActive ? "yes" : "no"}><NativeSelectOption value="yes">Sí</NativeSelectOption><NativeSelectOption value="no">No</NativeSelectOption></NativeSelect></div></div></WorkflowForm></CardContent></Card>)}</div>
      <div className="flex gap-3">{page > 1 && <Button variant="outline" asChild><Link href={`/admin?q=${encodeURIComponent(q)}&page=${page - 1}`}>Anterior</Link></Button>}{page < pages && <Button variant="outline" asChild><Link href={`/admin?q=${encodeURIComponent(q)}&page=${page + 1}`}>Siguiente</Link></Button>}</div>
    </section>
    <Card><CardHeader><CardTitle>Invitar profesor</CardTitle></CardHeader><CardContent><WorkflowForm action={createTeacherInvitation} label="Crear invitación"><div className="space-y-2"><Label htmlFor="invite-email">Email del profesor</Label><Input id="invite-email" name="email" type="email" maxLength={254} required /></div><p className="text-sm text-muted-foreground">Compartí el enlace con la persona invitada. Debe aceptar con una cuenta del mismo email.</p></WorkflowForm></CardContent></Card>
    <Card><CardHeader><CardTitle>Asignar profesor a un curso</CardTitle></CardHeader><CardContent>{teachers.length && courses.length ? <WorkflowForm action={updateTeacherAssignment} label="Asignar curso"><input type="hidden" name="assigned" value="yes" /><div className="space-y-2"><Label htmlFor="teacherId">Profesor activo</Label><NativeSelect id="teacherId" name="teacherId" required defaultValue=""><NativeSelectOption value="" disabled>Seleccioná un profesor</NativeSelectOption>{teachers.map((teacher) => <NativeSelectOption key={teacher.id} value={teacher.id}>{teacher.name} · {teacher.email}</NativeSelectOption>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor="courseId">Curso</Label><NativeSelect id="courseId" name="courseId" required defaultValue=""><NativeSelectOption value="" disabled>Seleccioná un curso</NativeSelectOption>{courses.map((course) => <NativeSelectOption key={course.id} value={course.id}>{course.title}</NativeSelectOption>)}</NativeSelect></div></WorkflowForm> : <p className="text-muted-foreground">Necesitás al menos un profesor activo y un curso para crear asignaciones.</p>}</CardContent></Card>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Asignaciones actuales</h2>{!courses.some((course) => course.teachers.length) && <p className="text-muted-foreground">Todavía no hay profesores asignados.</p>}{courses.filter((course) => course.teachers.length).map((course) => <Card key={course.id}><CardHeader><CardTitle className="text-lg">{course.title}</CardTitle></CardHeader><CardContent className="space-y-4">{course.teachers.map((assignment) => <div key={assignment.teacherId} className="space-y-2"><p>{assignment.teacher.name}{!assignment.teacher.isActive && " · Cuenta desactivada"}</p><WorkflowForm action={updateTeacherAssignment} label="Retirar asignación"><input type="hidden" name="assigned" value="no" /><input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="teacherId" value={assignment.teacherId} /></WorkflowForm></div>)}</CardContent></Card>)}</section>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Últimas invitaciones</h2>{!invitations.length && <p className="text-muted-foreground">No hay invitaciones.</p>}{invitations.map((invitation) => <Card key={invitation.id}><CardContent className="space-y-3 pt-6"><p>{invitation.email} · {invitation.usedAt ? "Aceptada" : invitation.expiresAt <= new Date() ? "Vencida o revocada" : "Pendiente"}</p><p className="text-sm text-muted-foreground">Vence: {invitation.expiresAt.toLocaleString("es-AR")}</p>{!invitation.usedAt && invitation.expiresAt > new Date() && <WorkflowForm action={cancelTeacherInvitation} label="Revocar invitación"><input type="hidden" name="invitationId" value={invitation.id} /></WorkflowForm>}</CardContent></Card>)}</section>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Seguimiento de entregas pendientes</h2>{!pending.length && <p className="text-muted-foreground">No hay entregas pendientes.</p>}{pending.map((submission) => <Card key={submission.id}><CardContent className="space-y-2 pt-6"><p className="font-medium">{submission.assignment.title} · {submission.student.name}</p><p className="text-sm text-muted-foreground">{submission.assignment.course.title} · {statusLabels[submission.status]} · {submission.reviewer?.name ?? "Sin corrector"}</p><p className="text-sm">Enviada: {submission.createdAt.toLocaleString("es-AR")}</p></CardContent></Card>)}</section>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Últimas acciones</h2>{!events.length && <p className="text-muted-foreground">Todavía no hay acciones registradas.</p>}<ul className="space-y-3">{events.map((event) => <li key={event.id} className="text-sm"><span className="font-medium">{event.actor?.name ?? "Operador local"}</span> · {labels[event.action] ?? "Actualizó un registro"}<span className="block">{targetNames.get(event.targetId) ?? "Registro archivado"}</span><span className="block text-muted-foreground">{event.createdAt.toLocaleString("es-AR")}</span></li>)}</ul></section>
  </div>
}
