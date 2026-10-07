"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { positiveOrder, textField, validSlug } from "@/lib/auth/validation"

export async function enrollInCourse(formData: FormData): Promise<void> {
  const session = await auth()
  const userId = session?.user?.id
  const courseId = textField(formData, "courseId")
  const slug = textField(formData, "slug")
  const nextOrder = positiveOrder(textField(formData, "nextOrder"))
  if (!courseId || courseId.length > 128 || !validSlug(slug) || nextOrder === null) {
    return redirect("/courses")
  }
  if (!userId) return redirect(`/login?callbackUrl=${encodeURIComponent(`/courses/${slug}`)}`)

  const course = await prisma.course.findUnique({
    where: { id: courseId, slug, isPublished: true },
    select: { modules: { where: { order: nextOrder }, select: { order: true } } },
  })
  if (!course || course.modules.length !== 1) return redirect("/courses")

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  })
  revalidatePath(`/courses/${slug}`)
  revalidatePath("/dashboard")
  return redirect(`/courses/${slug}/modules/${course.modules[0].order}`)
}
