import Link from "next/link"
import { notFound } from "next/navigation"
import { requireUser } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"
import { rubric, statusLabels, type CriterionResult } from "@/lib/evaluation/rubric"
import { claimSubmission, releaseSubmission, reviewSubmission } from "@/lib/actions/evaluation"
import { WorkflowForm } from "@/components/workflow-form"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export const metadata = { title: "Revisar entrega" }

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser(`/teacher/submissions/${id}`, "TEACHER")
  const submission = await prisma.submission.findUnique({ where: { id, studentId: { not: user.id }, assignment: { course: { isPublished: true, teachers: { some: { teacherId: user.id } } } } }, include: {
    assignment: { include: { course: true } }, version: true, student: { select: { name: true } }, reviewer: { select: { name: true } },
  } })
  if (!submission) notFound()
  const previous = await prisma.submission.findMany({ where: { assignmentId: submission.assignmentId, studentId: submission.studentId, attempt: { lt: submission.attempt } }, orderBy: { attempt: "desc" }, take: 10, select: { id: true, attempt: true, feedback: true, status: true } })
  const criteria = rubric(submission.version.criteria)
  const results = (submission.results ?? []) as unknown as CriterionResult[]
  return <div className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
    <Button variant="ghost" asChild><Link href="/teacher">Volver a correcciones</Link></Button>
    <div><p className="text-sm text-muted-foreground">{submission.assignment.course.title} · {submission.student.name}</p><h1 className="text-3xl font-bold">{submission.assignment.title}</h1><Badge variant="secondary" className="mt-3">{statusLabels[submission.status]}</Badge></div>
    <Card><CardHeader><CardTitle>Trabajo presentado</CardTitle></CardHeader><CardContent className="space-y-4">
      <p>Intento {submission.attempt} · Consigna versión {submission.version.version}</p><p className="break-all font-mono text-sm">Commit: {submission.commit}</p><a href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer" className="underline">Abrir repositorio</a>
      <h2 className="font-semibold">Consigna original</h2><p className="whitespace-pre-wrap">{submission.version.instructions}</p>
      <h2 className="font-semibold">Instalación y ejecución</h2><p className="whitespace-pre-wrap">{submission.instructions}</p>
      <h2 className="font-semibold">Evidencias</h2><p className="whitespace-pre-wrap">{submission.evidence}</p>
      <h2 className="font-semibold">Decisiones y cambios</h2><p className="whitespace-pre-wrap">{submission.explanation}</p>
      {submission.reviewer && <p className="text-sm text-muted-foreground">Corrector: {submission.reviewer.name}</p>}
    </CardContent></Card>
    {!!previous.length && <Card><CardHeader><CardTitle>Intentos anteriores</CardTitle></CardHeader><CardContent><ol className="space-y-3">{previous.map((attempt) => <li key={attempt.id}><Link href={`/teacher/submissions/${attempt.id}`} className="underline">Intento {attempt.attempt}: {statusLabels[attempt.status]}</Link>{attempt.feedback && <p className="whitespace-pre-wrap text-sm">{attempt.feedback}</p>}</li>)}</ol></CardContent></Card>}
    {submission.status === "SUBMITTED" && <WorkflowForm action={claimSubmission} label="Tomar entrega" reloadOnSuccess><input type="hidden" name="submissionId" value={submission.id} /></WorkflowForm>}
    {submission.status === "IN_REVIEW" && submission.reviewerId !== user.id && <p role="status">Esta entrega está siendo revisada por otro profesor.</p>}
    <Card><CardHeader><CardTitle>Evaluación por criterios</CardTitle></CardHeader><CardContent>
    {submission.status === "IN_REVIEW" && submission.reviewerId === user.id ? <WorkflowForm action={reviewSubmission} label="Guardar corrección" reloadOnSuccess>
      <input type="hidden" name="submissionId" value={submission.id} /><input type="hidden" name="criterionIds" value={JSON.stringify(criteria.map((criterion) => criterion.id))} />
      {criteria.map((criterion) => <div key={criterion.id} className="space-y-3 border-b pb-4"><h2 className="font-semibold">{criterion.label} {criterion.required ? "(obligatorio)" : "(opcional)"}</h2><p className="text-sm text-muted-foreground">{criterion.expected}</p>
        <Label htmlFor={`result-${criterion.id}`}>Resultado</Label><NativeSelect id={`result-${criterion.id}`} name={`result-${criterion.id}`} required defaultValue=""><NativeSelectOption value="" disabled>Seleccioná un resultado</NativeSelectOption><NativeSelectOption value="pass">Cumple</NativeSelectOption><NativeSelectOption value="changes">Requiere cambios</NativeSelectOption></NativeSelect>
        <Label htmlFor={`feedback-${criterion.id}`}>Devolución (obligatoria si requiere cambios)</Label><Textarea id={`feedback-${criterion.id}`} name={`feedback-${criterion.id}`} maxLength={5000} />
      </div>)}
      <div className="space-y-2"><Label htmlFor="feedback">Devolución general</Label><Textarea id="feedback" name="feedback" maxLength={10000} /></div>
      <p className="text-sm text-muted-foreground">Se aprobará cuando todos los criterios obligatorios cumplan. La corrección final se conserva en el historial.</p>
    </WorkflowForm> : <ol className="space-y-4">{criteria.map((criterion) => {
      const result = results.find((item) => item.id === criterion.id)
      return <li key={criterion.id}><h2 className="font-medium">{criterion.label}: {result ? result.passed ? "Cumple" : "Requiere cambios" : "Sin evaluar"}</h2><p className="text-sm text-muted-foreground">{criterion.expected}</p>{result?.feedback && <p className="whitespace-pre-wrap text-sm">{result.feedback}</p>}</li>
    })}</ol>}
    {submission.feedback && <p className="mt-4 whitespace-pre-wrap">{submission.feedback}</p>}
    </CardContent></Card>
    {submission.status === "IN_REVIEW" && submission.reviewerId === user.id && <WorkflowForm action={releaseSubmission} label="Liberar entrega" reloadOnSuccess><input type="hidden" name="submissionId" value={submission.id} /></WorkflowForm>}
  </div>
}
