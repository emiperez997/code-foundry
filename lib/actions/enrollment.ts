"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function enrollInCourse(formData: FormData): Promise<void> {
  const session = await auth()
  const userId = session?.user?.id
  const courseId = formData.get("courseId") as string
  const slug = formData.get("slug") as string
  const nextOrderRaw = formData.get("nextOrder") as string
  const nextOrder = parseInt(nextOrderRaw, 10)

  if (!courseId || !slug || Number.isNaN(nextOrder)) {
    return redirect("/courses")
  }

  if (!userId) {
    return redirect(`/login?callbackUrl=/courses/${slug}`)
  }

  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    update: {},
    create: {
      userId,
      courseId,
    },
  })

  revalidatePath(`/courses/${slug}`)
  revalidatePath("/dashboard")

  return redirect(`/courses/${slug}/modules/${nextOrder}`)
}
