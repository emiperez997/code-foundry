import Link from "next/link"
import { requireUser } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { statusLabels } from "@/lib/evaluation/rubric"

export const metadata = { title: "Panel de corrección" }

export default async function TeacherPage() {
  const user = await requireUser("/teacher", "TEACHER")
  const scope = { studentId: { not: user.id }, assignment: { course: { isPublished: true, teachers: { some: { teacherId: user.id } } } } }
  const include = { assignment: { include: { course: true } }, student: { select: { name: true } } }
  const [pending, reviewing, history, teaching] = await Promise.all([
    prisma.submission.findMany({ where: { ...scope, status: "SUBMITTED" }, include, orderBy: { createdAt: "asc" }, take: 20 }),
    prisma.submission.findMany({ where: { ...scope, status: "IN_REVIEW", reviewerId: user.id }, include, orderBy: { claimedAt: "asc" }, take: 20 }),
    prisma.submission.findMany({ where: { ...scope, status: { in: ["APPROVED", "CHANGES_REQUESTED"] }, reviewerId: user.id }, include, orderBy: { reviewedAt: "desc" }, take: 20 }),
    prisma.courseTeacher.findMany({ where: { teacherId: user.id }, include: { course: true } }),
  ])
  return <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
    <div><h1 className="text-3xl font-bold">Panel de corrección</h1><p className="mt-2 text-muted-foreground">Tomá una entrega de tus cursos asignados y evaluá sus criterios. Cada sección muestra hasta 20 trabajos.</p></div>
    <Card><CardHeader><CardTitle>Cursos asignados</CardTitle></CardHeader><CardContent>{teaching.length ? <ul className="space-y-2">{teaching.map((item) => <li key={item.courseId}>{item.course.title}{!item.course.isPublished && " · No publicado"}</li>)}</ul> : <p className="text-muted-foreground">Todavía no tenés cursos asignados. El administrador debe asignarte uno para corregir.</p>}</CardContent></Card>
    {[{ title: "Pendientes", items: pending }, { title: "Mis revisiones activas", items: reviewing }, { title: "Historial de correcciones", items: history }].map((section) => <section key={section.title} className="space-y-4"><h2 className="text-xl font-semibold">{section.title}</h2>{!section.items.length && <p className="text-muted-foreground">No hay trabajos en esta sección.</p>}<div className="grid gap-4 md:grid-cols-2">{section.items.map((submission) => <Card key={submission.id}><CardHeader><CardTitle className="text-lg">{submission.assignment.title}</CardTitle><p className="text-sm text-muted-foreground">{submission.assignment.course.title} · {submission.student.name}</p></CardHeader><CardContent className="space-y-3"><p className="text-sm">Intento {submission.attempt} · {statusLabels[submission.status]}</p><Button variant="outline" asChild><Link href={`/teacher/submissions/${submission.id}`}>Ver entrega</Link></Button></CardContent></Card>)}</div></section>)}
  </div>
}
