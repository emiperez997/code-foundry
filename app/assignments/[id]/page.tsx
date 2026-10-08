import Link from "next/link"
import { notFound } from "next/navigation"
import { requireUser } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"
import { rubric, statusLabels, type CriterionResult } from "@/lib/evaluation/rubric"
import { submitAssignment } from "@/lib/actions/evaluation"
import { WorkflowForm } from "@/components/workflow-form"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export const metadata = { title: "Consigna y entregas" }

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser(`/assignments/${id}`, "STUDENT")
  const assignment = await prisma.assignment.findUnique({ where: { id, course: { isPublished: true, enrollments: { some: { userId: user.id } } } }, include: {
    course: true, versions: { orderBy: { version: "desc" } },
    submissions: { where: { studentId: user.id }, orderBy: { attempt: "desc" }, include: { version: true, reviewer: { select: { name: true } } } },
  } })
  if (!assignment) notFound()
  const version = assignment.versions.find((item) => item.version === assignment.currentVersion)
  if (!version) notFound()
  const criteria = rubric(version.criteria)
  const previous = await prisma.assignment.findMany({ where: { courseId: assignment.courseId, order: { lt: assignment.order }, required: true }, include: { submissions: { where: { studentId: user.id, status: "APPROVED" }, take: 1 } } })
  const blocked = previous.some((item) => !item.submissions.length)
  const latest = assignment.submissions[0]
  const canSubmit = !blocked && (!latest || latest.status === "CHANGES_REQUESTED")
  return <div className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
    <Button variant="ghost" asChild><Link href="/dashboard/assignments">Volver a mis entregas</Link></Button>
    <div><p className="text-sm text-muted-foreground">{assignment.course.title} · Entrega {assignment.order} · Versión {version.version}</p><h1 className="text-3xl font-bold">{assignment.title}</h1></div>
    <Card><CardHeader><CardTitle>Consigna</CardTitle></CardHeader><CardContent className="space-y-4"><p className="whitespace-pre-wrap">{version.instructions}</p><h2 className="font-semibold">Criterios de aceptación</h2><ol className="space-y-3">{criteria.map((criterion) => <li key={criterion.id}><p className="font-medium">{criterion.label} {criterion.required ? "(obligatorio)" : "(opcional)"}</p><p className="text-sm text-muted-foreground">{criterion.expected}</p></li>)}</ol></CardContent></Card>
    {canSubmit ? <Card><CardHeader><CardTitle>{latest ? "Enviar correcciones" : "Enviar trabajo"}</CardTitle></CardHeader><CardContent><WorkflowForm action={submitAssignment} label="Enviar entrega" reloadOnSuccess>
      <input type="hidden" name="assignmentId" value={assignment.id} /><input type="hidden" name="versionId" value={version.id} />
      <div className="space-y-2"><Label htmlFor="repositoryUrl">Repositorio HTTPS</Label><Input id="repositoryUrl" name="repositoryUrl" type="url" maxLength={2048} placeholder="https://github.com/usuario/proyecto" required defaultValue={latest?.repositoryUrl} /></div>
      <div className="space-y-2"><Label htmlFor="commit">Commit completo (40 caracteres)</Label><Input id="commit" name="commit" pattern="[a-fA-F0-9]{40}" minLength={40} maxLength={40} required /></div>
      <div className="space-y-2"><Label htmlFor="instructions">Cómo instalar y ejecutar</Label><Textarea id="instructions" name="instructions" maxLength={10000} required defaultValue={latest?.instructions} /></div>
      <div className="space-y-2"><Label htmlFor="evidence">Evidencias y resultados de pruebas</Label><Textarea id="evidence" name="evidence" maxLength={10000} required defaultValue={latest?.evidence} /></div>
      <div className="space-y-2"><Label htmlFor="explanation">Explicación de decisiones y cambios</Label><Textarea id="explanation" name="explanation" maxLength={10000} required /></div>
      <p className="text-sm text-muted-foreground">El profesor debe poder acceder al repositorio. Las evidencias deben corresponder a este commit.</p>
    </WorkflowForm></CardContent></Card> : <p role="status" className="text-muted-foreground">{blocked ? "Necesitás aprobar las entregas anteriores antes de enviar esta." : latest?.status === "APPROVED" ? "Esta entrega está aprobada." : "Tu trabajo está pendiente de corrección."}</p>}
    <h2 className="text-xl font-semibold">Historial y devoluciones</h2>
    {!assignment.submissions.length && <p className="text-muted-foreground">Todavía no enviaste intentos.</p>}
    {assignment.submissions.map((submission) => {
      const snapshot = rubric(submission.version.criteria)
      const results = (submission.results ?? []) as unknown as CriterionResult[]
      return <Card key={submission.id}><CardHeader><CardTitle className="text-lg">Intento {submission.attempt} · Versión {submission.version.version}</CardTitle><Badge variant="secondary" className="w-fit">{statusLabels[submission.status]}</Badge></CardHeader><CardContent className="space-y-3">
        <p className="text-sm">Enviado: {submission.createdAt.toLocaleString("es-AR")}</p><p className="break-all font-mono text-sm">Commit: {submission.commit}</p><a className="text-sm underline" href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer">Abrir repositorio</a>
        <details><summary className="cursor-pointer font-medium">Consigna y evidencias de este intento</summary><div className="mt-3 space-y-3 whitespace-pre-wrap text-sm"><p>{submission.version.instructions}</p><p>{submission.instructions}</p><p>{submission.evidence}</p><p>{submission.explanation}</p>{snapshot.map((criterion) => <p key={criterion.id}>{criterion.label}: {criterion.expected}</p>)}</div></details>
        {submission.reviewer && <p className="text-sm text-muted-foreground">Corrector: {submission.reviewer.name}{submission.reviewedAt ? ` · ${submission.reviewedAt.toLocaleString("es-AR")}` : ""}</p>}
        {submission.feedback && <p className="whitespace-pre-wrap">{submission.feedback}</p>}
        {results.map((result) => <div key={result.id}><p className="font-medium">{snapshot.find((criterion) => criterion.id === result.id)?.label}: {result.passed ? "Cumple" : "Requiere cambios"}</p>{result.feedback && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{result.feedback}</p>}</div>)}
      </CardContent></Card>
    })}
  </div>
}
