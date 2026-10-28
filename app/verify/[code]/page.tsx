import { headers } from "next/headers"
import { BadgeCheck, ShieldAlert, ShieldQuestion, Timer } from "lucide-react"
import type { Metadata } from "next"
import { consumeRateLimit, rateLimitKey } from "@/lib/auth/rate-limit"
import { parseCertificateCode } from "@/lib/certificates/code"
import { findPublicCertificate } from "@/lib/certificates/verify"

export const metadata: Metadata = {
  title: "Verificación de certificado",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

const LIMIT = 30
const WINDOW_SECONDS = 60

async function allowed(): Promise<boolean> {
  const h = await headers()
  // Detrás de un proxy de confianza x-forwarded-for identifica al cliente; si no existe se agrupa en "unknown".
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
  try {
    return await consumeRateLimit(rateLimitKey("verify:ip", ip), LIMIT, WINDOW_SECONDS)
  } catch (error) {
    console.error("[verify] no se pudo consultar el límite de intentos", error)
    return true
  }
}

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  let raw = (await params).code
  try { raw = decodeURIComponent(raw) } catch { /* código malformado: se tratará como no encontrado */ }
  const code = parseCertificateCode(raw)
  const wrapper = "container mx-auto max-w-2xl px-4 py-10"

  if (code && !(await allowed())) {
    return (
      <div className={wrapper}>
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Verificación de certificado</h1>
        <p role="alert" className="flex items-center gap-2 rounded-lg border p-4"><Timer aria-hidden="true" className="h-4 w-4 shrink-0" /> Hiciste demasiadas consultas. Esperá un minuto e intentá de nuevo.</p>
      </div>
    )
  }
  const certificate = code ? await findPublicCertificate(code) : null

  return (
    <div className={wrapper}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Verificación de certificado</h1>
      {!certificate ? (
        <p role="status" className="flex items-center gap-2 rounded-lg border p-4">
          <ShieldQuestion aria-hidden="true" className="h-5 w-5 shrink-0" />
          No encontramos un certificado con ese código. Revisá que esté bien escrito.
        </p>
      ) : (
        <div className="space-y-4">
          {certificate.status === "valid" ? (
            <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 font-semibold text-emerald-900">
              <BadgeCheck aria-hidden="true" className="h-5 w-5 shrink-0" /> Estado: Válido
            </p>
          ) : (
            <p role="status" className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-4 font-semibold text-red-900">
              <ShieldAlert aria-hidden="true" className="h-5 w-5 shrink-0" /> Estado: Revocado
            </p>
          )}
          <dl className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">Titular</dt><dd className="font-medium">{certificate.recipientName}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Curso</dt><dd className="font-medium">{certificate.courseTitle}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Fecha de emisión</dt><dd className="font-medium"><time dateTime={certificate.issuedAt.toISOString()}>{certificate.issuedAt.toISOString().slice(0, 10)}</time></dd></div>
            <div><dt className="text-sm text-muted-foreground">Emitido por</dt><dd className="font-medium">{certificate.issuer}</dd></div>
          </dl>
        </div>
      )}
    </div>
  )
}
