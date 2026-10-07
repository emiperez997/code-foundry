"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { positiveOrder, textField, validSlug } from "@/lib/auth/validation"

type ProgressActionState = { error?: string }

async function validatedModule(formData: FormData) {
  const moduleId = textField(formData, "moduleId")
  const slug = textField(formData, "slug")
  const order = positiveOrder(textField(formData, "order"))
  if (!moduleId || moduleId.length > 128 || !validSlug(slug) || order === null) return null
  return prisma.module.findUnique({
    where: { id: moduleId, order, course: { slug, isPublished: true } },
    select: { id: true, courseId: true, order: true, course: { select: { slug: true } } },
  })
}

function revalidateModule(moduleRecord: { order: number; course: { slug: string } }) {
  revalidatePath(`/courses/${moduleRecord.course.slug}/modules/${moduleRecord.order}`)
  revalidatePath(`/courses/${moduleRecord.course.slug}`)
  revalidatePath("/dashboard")
}

export async function markModuleCompleted(_prev: ProgressActionState, formData: FormData): Promise<ProgressActionState> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: "Debes iniciar sesión para guardar progreso." }
  const moduleRecord = await validatedModule(formData)
  if (!moduleRecord) return { error: "No pudimos identificar el módulo." }

  await prisma.$transaction([
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: moduleRecord.courseId } },
      update: {},
      create: { userId, courseId: moduleRecord.courseId },
    }),
    prisma.progress.upsert({
      where: { userId_moduleId: { userId, moduleId: moduleRecord.id } },
      update: { completedAt: new Date() },
      create: { userId, moduleId: moduleRecord.id },
    }),
  ])
  revalidateModule(moduleRecord)
  return {}
}

export async function markModulePending(_prev: ProgressActionState, formData: FormData): Promise<ProgressActionState> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: "Debes iniciar sesión para guardar progreso." }
  const moduleRecord = await validatedModule(formData)
  if (!moduleRecord) return { error: "No pudimos identificar el módulo." }
  await prisma.progress.deleteMany({ where: { userId, moduleId: moduleRecord.id } })
  revalidateModule(moduleRecord)
  return {}
}
