import Link from "next/link"
import { Award, BookCheck, BookOpen, CircleDashed, ClipboardCheck, ShieldAlert, ShieldCheck } from "lucide-react"
import type { CourseStatus as Status } from "@/lib/certificates/eligibility"

type Props = {
  status: Status
  courseSlug: string
  hasCertificate?: boolean
  /** El certificado existe pero fue revocado: no es válido ni descargable como vigente. */
  certificateRevoked?: boolean
  /** Muestra el siguiente paso explícito (dashboard/curso). */
  showNextStep?: boolean
}

export function nextStepText(status: Status, hasCertificate = false, certificateRevoked = false): string {
  if (certificateRevoked) return "Tu certificado fue revocado y ya no es válido. Consultá con un administrador."
  if (hasCertificate) return "Ya tenés tu certificado: podés descargarlo o compartir el código de verificación."
  if (status.eligible) return "Cumplís todos los requisitos: obtené tu certificado."
  if (!status.reading.done && !status.assignments.done) return "Seguí con la lectura y enviá las entregas obligatorias para su corrección."
  if (!status.reading.done) return `Te faltan ${status.reading.total - status.reading.completed} módulos por marcar como leídos.`
  if (status.assignments.required === 0) return "Este curso todavía no tiene entregas obligatorias, por eso no emite certificado."
  return `Terminaste la lectura. Para aprobar el curso faltan ${status.assignments.required - status.assignments.approved} entregas obligatorias por aprobar.`
}

/** Dos estados independientes y siempre visibles: texto + icono (nunca solo color). */
export function CourseStatus({ status, courseSlug, hasCertificate = false, certificateRevoked = false, showNextStep = true }: Props) {
  const approved = (status.eligible || hasCertificate) && !certificateRevoked
  return (
    <section aria-label="Estado del curso" className="rounded-lg border p-4">
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          {status.reading.done ? <BookCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-800" /> : <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <span><strong className="font-semibold">{status.reading.done ? "Lectura completada" : "Lectura en curso"}:</strong> {status.reading.completed}/{status.reading.total} módulos <span className="text-muted-foreground">(lo declarás vos)</span></span>
        </li>
        <li className="flex items-center gap-2">
          {approved ? <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-800" /> : <ClipboardCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <span><strong className="font-semibold">{approved ? "Curso aprobado" : "Curso no aprobado todavía"}:</strong> {status.assignments.approved}/{status.assignments.required} entregas obligatorias aprobadas <span className="text-muted-foreground">(lo decide un profesor)</span></span>
        </li>
        {certificateRevoked && (
          <li className="flex items-center gap-2 font-medium text-red-900">
            <ShieldAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>Certificado revocado</span>
          </li>
        )}
      </ul>
      {showNextStep && (
        <p className="mt-3 flex items-start gap-2 text-sm text-foreground">
          {approved ? <Award aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> : certificateRevoked ? <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleDashed aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />}
          <span><span className="font-medium">Siguiente paso:</span> {nextStepText(status, hasCertificate, certificateRevoked)}{" "}
            {(status.eligible || hasCertificate) && <Link className="font-medium underline underline-offset-4" href={`/dashboard/certificates/${courseSlug}`}>{certificateRevoked ? "Ver estado del certificado" : hasCertificate ? "Ver certificado" : "Obtener certificado"}</Link>}
            {!approved && !certificateRevoked && status.assignments.required > 0 && <Link className="font-medium underline underline-offset-4" href="/dashboard/assignments">Ir a mis entregas</Link>}
          </span>
        </p>
      )}
    </section>
  )
}
