import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { parseCertificateCode } from "@/lib/certificates/code"
import { generateCertificatePdf } from "@/lib/certificates/pdf"
import { verificationUrl } from "@/lib/certificates/verify"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const privateHeaders = { "Cache-Control": "private, no-store" }

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401, headers: privateHeaders })
  const code = parseCertificateCode((await params).code)
  // Solo el titular: cualquier otro caso es 404 para no revelar si el código existe.
  const certificate = code ? await prisma.certificate.findFirst({ where: { code, userId, user: { isActive: true } } }) : null
  if (!certificate) return NextResponse.json({ error: "No encontrado" }, { status: 404, headers: privateHeaders })
  const bytes = await generateCertificatePdf({
    recipientName: certificate.recipientName,
    courseTitle: certificate.courseTitle,
    issuedAt: certificate.issuedAt,
    code: certificate.code,
    verifyUrl: verificationUrl(certificate.code),
    revoked: !!certificate.revokedAt,
  })
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      ...privateHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-${certificate.code}.pdf"`,
      "X-Content-Type-Options": "nosniff",
    },
  })
}
