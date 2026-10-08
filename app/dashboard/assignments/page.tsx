import Link from "next/link"
import { requireUser } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"
import { statusLabels } from "@/lib/evaluation/rubric"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Mis entregas" }

export default async function AssignmentsPage() {
  const user = await requireUser("/dashboard/assignments", "STUDENT")
  const assignments = await prisma.assignment.findMany({
    where: { course: { isPublished: true, enrollments: { some: { userId: user.id } } } },
    orderBy: [{ course: { title: "asc" } }, { order: "asc" }],
    include: { course: true, submissions: { where: { studentId: user.id }, orderBy: { attempt: "desc" }, take: 1 } },
  })
  return <div className="container mx-auto max-w-5xl space-y-6 px-4 py-10">
    <h1 className="text-3xl font-bold">Mis entregas</h1>
    <p className="text-muted-foreground">Consultá tus consignas, enviá tu trabajo y revisá las devoluciones. La aprobación es independiente del avance de lectura.</p>
    {!assignments.length && <Card><CardContent className="space-y-4 pt-6"><p>No tenés entregas disponibles. Inscribite en un curso con prácticas evaluables.</p><Button asChild><Link href="/courses">Explorar cursos</Link></Button></CardContent></Card>}
    <div className="grid gap-4 md:grid-cols-2">{assignments.map((assignment) => {
      const latest = assignment.submissions[0]
      const blocked = assignments.some((previous) => previous.courseId === assignment.courseId && previous.order < assignment.order && previous.required && previous.submissions[0]?.status !== "APPROVED")
      return <Card key={assignment.id}><CardHeader><p className="text-sm text-muted-foreground">{assignment.course.title} · Entrega {assignment.order}</p><CardTitle>{assignment.title}</CardTitle></CardHeader><CardContent><Badge variant="secondary">{latest ? statusLabels[latest.status] : blocked ? "Requiere aprobación anterior" : "Lista para enviar"}</Badge>{latest && <p className="mt-2 text-sm text-muted-foreground">Intento {latest.attempt}</p>}</CardContent><CardFooter><Button asChild variant="outline"><Link href={`/assignments/${assignment.id}`}>Ver consigna e historial</Link></Button></CardFooter></Card>
    })}</div>
  </div>
}
