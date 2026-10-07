"use server"

import bcrypt from "bcryptjs"
import { signIn } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { hasControlCharacters, normalizeEmail, safeCallbackPath, textField, validEmail, validPasswordLength } from "@/lib/auth/validation"
import { consumeRateLimit, rateLimitKey } from "@/lib/auth/rate-limit"

export type LoginState = { error?: string }
export type RegisterState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(textField(formData, "email"))
  const password = textField(formData, "password")
  if (!email || !password) return { error: "Email y contraseña son obligatorios." }
  if (!validEmail(email) || !validPasswordLength(password)) {
    return { error: "Email o contraseña incorrectos." }
  }
  try {
    await signIn("credentials", { email, password, redirect: false })
  } catch (error) {
    if (error instanceof AuthError) return { error: "Email o contraseña incorrectos." }
    throw error
  }
  redirect(safeCallbackPath(textField(formData, "callbackUrl")))
}

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const name = textField(formData, "name").trim()
  const email = normalizeEmail(textField(formData, "email"))
  const password = textField(formData, "password")
  const callbackUrl = safeCallbackPath(textField(formData, "callbackUrl"))
  if (!name || !email || !password) return { error: "Todos los campos son obligatorios." }
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." }
  if (name.length > 100 || hasControlCharacters(name) || !validEmail(email) || !validPasswordLength(password)) {
    return { error: "Revisá el nombre, el email y la contraseña (máximo 72 bytes)." }
  }
  if (!await consumeRateLimit("register:global", 100, 15 * 60) ||
      !await consumeRateLimit(rateLimitKey("register:email", email), 5, 15 * 60)) {
    return { error: "Demasiados intentos de registro. Intentá nuevamente en unos minutos." }
  }
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: "Ya existe una cuenta con ese email." }
  const passwordHash = await bcrypt.hash(password, 12)
  try {
    await prisma.user.create({ data: { name, email, passwordHash } })
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { error: "Ya existe una cuenta con ese email." }
    }
    throw error
  }
  try {
    await signIn("credentials", { email, password, redirect: false })
  } catch (error) {
    if (!(error instanceof AuthError)) throw error
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }
  redirect(callbackUrl)
}
