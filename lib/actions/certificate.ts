"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { textField, validSlug } from "@/lib/auth/validation"
import { issueCertificate } from "@/lib/certificates/issue"
import { WorkflowError } from "@/lib/evaluation/rubric"

export type CertificateActionState = { error?: string }

export async function requestCertificate(_prev: CertificateActionState, formData: FormData): Promise<CertificateActionState> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: "Debes iniciar sesión para obtener el certificado." }
  const slug = textField(formData, "slug")
  if (!validSlug(slug)) return { error: "No pudimos identificar el curso." }
  const course = await prisma.course.findUnique({ where: { slug, isPublished: true }, select: { id: true } })
  if (!course) return { error: "No pudimos identificar el curso." }
  try {
    await issueCertificate(userId, course.id)
  } catch (error) {
    if (error instanceof WorkflowError) return { error: error.message }
    console.error("[certificate] error inesperado al emitir", error)
    return { error: "No pudimos emitir el certificado. Intentá de nuevo." }
  }
  revalidatePath(`/dashboard/certificates/${slug}`)
  revalidatePath(`/courses/${slug}`)
  revalidatePath("/dashboard")
  redirect(`/dashboard/certificates/${slug}`)
}
