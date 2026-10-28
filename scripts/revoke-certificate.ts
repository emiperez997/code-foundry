import "dotenv/config"
import { prisma } from "../lib/prisma"
import { parseCertificateCode } from "../lib/certificates/code"

// Uso: pnpm certificate:revoke CF-XXXX-XXXX-XXXX-XXXX
async function main() {
  const code = parseCertificateCode(process.argv[2] ?? "")
  if (!code) throw new Error("Indicá un código válido con formato CF-XXXX-XXXX-XXXX-XXXX.")
  await prisma.$transaction(async (tx) => {
    const certificate = await tx.certificate.findUnique({ where: { code }, select: { id: true, revokedAt: true } })
    if (!certificate) throw new Error("No existe un certificado con ese código.")
    if (certificate.revokedAt) {
      console.log("El certificado ya estaba revocado.")
      return
    }
    await tx.certificate.update({ where: { id: certificate.id }, data: { revokedAt: new Date() } })
    await tx.auditEvent.create({ data: { actorId: null, action: "certificate.revoked", targetType: "certificate", targetId: certificate.id, details: { code, via: "script" } } })
    console.log(`Certificado ${code} revocado.`)
  })
}

main()
  .catch((error: unknown) => { console.error(error instanceof Error ? error.message : "No se pudo revocar el certificado."); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
