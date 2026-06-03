"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

type ProgressActionState = {
  error?: string
}

export async function markModuleCompleted(
  _prev: ProgressActionState,
  formData: FormData
): Promise<ProgressActionState> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { error: "Debes iniciar sesión para guardar progreso." }
  }

  const moduleId = formData.get("moduleId") as string
  const slug = formData.get("slug") as string
  const order = formData.get("order") as string

  if (!moduleId || !slug || !order) {
    return { error: "No pudimos identificar el módulo." }
  }

  const moduleRecord = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  })

  if (!moduleRecord) {
    return { error: "No pudimos identificar el módulo." }
  }

  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId: moduleRecord.courseId,
      },
    },
    update: {},
    create: {
      userId,
      courseId: moduleRecord.courseId,
    },
  })

  await prisma.progress.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    update: { completedAt: new Date() },
    create: { userId, moduleId },
  })

  revalidatePath(`/courses/${slug}/modules/${order}`)
  revalidatePath(`/courses/${slug}`)
  revalidatePath("/dashboard")

  return {}
}

export async function markModulePending(
  _prev: ProgressActionState,
  formData: FormData
): Promise<ProgressActionState> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { error: "Debes iniciar sesión para guardar progreso." }
  }

  const moduleId = formData.get("moduleId") as string
  const slug = formData.get("slug") as string
  const order = formData.get("order") as string

  if (!moduleId || !slug || !order) {
    return { error: "No pudimos identificar el módulo." }
  }

  await prisma.progress.deleteMany({
    where: { userId, moduleId },
  })

  revalidatePath(`/courses/${slug}/modules/${order}`)
  revalidatePath(`/courses/${slug}`)
  revalidatePath("/dashboard")

  return {}
}
