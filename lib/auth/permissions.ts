import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import type { Role } from "@/app/generated/prisma/client"

export async function currentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, roles: true, isActive: true },
  })
  return user?.isActive ? user : null
}

export async function requireUser(path: string, role?: Role) {
  const user = await currentUser()
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(path)}`)
  if (role && !user.roles.includes(role)) notFound()
  return user
}
