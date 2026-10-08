import { createHash } from "node:crypto"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requireUser } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"
import { acceptTeacherInvitation } from "@/lib/actions/evaluation"
import { WorkflowForm } from "@/components/workflow-form"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Invitación a profesor", referrer: "no-referrer" as const }

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) notFound()
  const user = await requireUser(`/invitations/${token}`)
  const invitation = await prisma.teacherInvitation.findUnique({ where: { tokenHash: createHash("sha256").update(token).digest("hex") }, include: { createdBy: { select: { isActive: true, roles: true } } } })
  const matches = invitation?.email === user.email
  const accepted = matches && invitation?.usedAt && user.roles.includes("TEACHER")
  const valid = matches && !invitation?.usedAt && invitation && invitation.expiresAt > new Date() && invitation.createdBy.isActive && invitation.createdBy.roles.includes("ADMIN")
  return <div className="container mx-auto max-w-xl px-4 py-10"><Card><CardHeader><CardTitle>Invitación a profesor</CardTitle></CardHeader><CardContent className="space-y-4"><p>Iniciaste sesión como {user.email}.</p>{accepted ? <><p role="status">Ya aceptaste esta invitación.</p><Button asChild><Link href="/teacher">Ir a correcciones</Link></Button></> : valid ? <><p>Al aceptar, tu cuenta tendrá el rol de profesor. El administrador deberá asignarte cursos para corregir.</p><WorkflowForm action={acceptTeacherInvitation} label="Aceptar invitación"><input type="hidden" name="token" value={token} /></WorkflowForm></> : <p role="alert">La invitación no está disponible o corresponde a otro email. Pedí al administrador que revise la invitación.</p>}</CardContent></Card></div>
}
