import Link from "next/link"
import { notFound } from "next/navigation"
import { Award, Download, ShieldAlert } from "lucide-react"
import type { Metadata } from "next"
import { requireUser } from "@/lib/auth/permissions"
import { validSlug } from "@/lib/auth/validation"
import { prisma } from "@/lib/prisma"
import { getCourseStatus } from "@/lib/certificates/status"
import { verificationUrl } from "@/lib/certificates/verify"
import { CourseStatus } from "@/components/course-status"
import { CertificateRequestForm } from "@/components/certificate-request-form"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Certificado", robots: { index: false } }
export const dynamic = "force-dynamic"

type Props = { params: Promise<{ slug: string }> }

export default async function CertificatePage({ params }: Props) {
  const { slug } = await params
  if (!validSlug(slug)) notFound()
  const user = await requireUser(`/dashboard/certificates/${slug}`, "STUDENT")
  const course = await prisma.course.findUnique({ where: { slug, isPublished: true }, select: { id: true, title: true, slug: true } })
  if (!course) notFound()
  const enrolled = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } }, select: { id: true } })
  if (!enrolled) notFound()
  const [status, certificate] = await Promise.all([
    getCourseStatus(user.id, course.id),
    prisma.certificate.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }),
  ])
  const url = certificate ? verificationUrl(certificate.code) : null

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="Migas de pan" className="mb-6 text-sm">
        <Link className="underline underline-offset-4" href="/dashboard">Dashboard</Link> / <span>Certificado</span>
      </nav>
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
        {certificate?.revokedAt ? <ShieldAlert aria-hidden="true" className="h-6 w-6 shrink-0" /> : <Award aria-hidden="true" className="h-6 w-6 shrink-0" />}
        {certificate?.revokedAt ? "Certificado revocado" : "Certificado"}: {course.title}
      </h1>
      {certificate ? (
        <div className="space-y-6">
          {certificate.revokedAt && (
            <p role="status" className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-900">
              <ShieldAlert aria-hidden="true" className="h-4 w-4 shrink-0" /> Certificado revocado: ya no es válido.
            </p>
          )}
          <dl className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">Titular</dt><dd className="font-medium">{certificate.recipientName}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Curso</dt><dd className="font-medium">{certificate.courseTitle}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Fecha de emisión original</dt><dd className="font-medium"><time dateTime={certificate.issuedAt.toISOString()}>{certificate.issuedAt.toISOString().slice(0, 10)}</time></dd></div>
            <div><dt className="text-sm text-muted-foreground">Código de verificación</dt><dd className="break-all font-mono font-medium">{certificate.code}</dd></div>
            <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">Enlace público de verificación</dt><dd className="break-all"><a className="underline underline-offset-4" href={`/verify/${certificate.code}`}>{url}</a></dd></div>
          </dl>
          {certificate.revokedAt ? (
            <p className="text-sm text-muted-foreground">Este certificado no se puede descargar como vigente. Si necesitás aclaraciones, contactá a un administrador.</p>
          ) : (
            <Button asChild className="min-h-11"><a href={`/api/certificates/${certificate.code}/pdf`} download><Download aria-hidden="true" className="mr-2 h-4 w-4" />Descargar PDF</a></Button>
          )}
        </div>
      ) : status.eligible ? (
        <div className="space-y-4">
          <CourseStatus status={status} courseSlug={course.slug} showNextStep={false} />
          <p>Cumplís todos los requisitos. Al emitir, se guarda tu nombre actual ({user.name}) en el certificado.</p>
          <CertificateRequestForm slug={course.slug} />
        </div>
      ) : (
        <div className="space-y-4">
          <CourseStatus status={status} courseSlug={course.slug} />
          <p className="text-sm text-muted-foreground">El certificado se habilita cuando leíste todos los módulos y un profesor aprobó todas las entregas obligatorias.</p>
        </div>
      )}
    </div>
  )
}
