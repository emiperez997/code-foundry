import { prisma } from "@/lib/prisma"
import { CERTIFICATE_ISSUER } from "./config"
import { parseCertificateCode } from "./code"

export type PublicCertificate = {
  recipientName: string
  courseTitle: string
  issuedAt: Date
  issuer: string
  status: "valid" | "revoked"
}

/** Solo campos públicos (D14): sin email, entregas ni devoluciones. */
export async function findPublicCertificate(input: string): Promise<PublicCertificate | null> {
  const code = parseCertificateCode(input)
  if (!code) return null
  const row = await prisma.certificate.findUnique({ where: { code }, select: { recipientName: true, courseTitle: true, issuedAt: true, revokedAt: true } })
  if (!row) return null
  return { recipientName: row.recipientName, courseTitle: row.courseTitle, issuedAt: row.issuedAt, issuer: CERTIFICATE_ISSUER, status: row.revokedAt ? "revoked" : "valid" }
}

export function verificationUrl(code: string): string {
  const base = (process.env.AUTH_URL || "http://localhost:3000").replace(/\/+$/, "")
  return `${base}/verify/${code}`
}
