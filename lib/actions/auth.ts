"use server"

import bcrypt from "bcryptjs"
import { signIn } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginState = {
  error?: string
}

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." }
  }

  try {
    await signIn("credentials", { email, password, redirect: false })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email o contraseña incorrectos." }
    }
    throw err
  }

  redirect("/courses")
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export type RegisterState = {
  error?: string
}

export async function register(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string

  if (!name || !email || !password) {
    return { error: "Todos los campos son obligatorios." }
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Ya existe una cuenta con ese email." }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { name, email, passwordHash },
  })

  // Log in immediately after registration
  try {
    await signIn("credentials", { email, password, redirect: false })
  } catch {
    redirect("/login")
  }

  redirect("/courses")
}
