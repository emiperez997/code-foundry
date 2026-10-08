import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { consumeRateLimit, rateLimitKey } from "./rate-limit"
import { normalizeEmail, validEmail, validPasswordLength } from "./validation"

const dummyHash = bcrypt.hashSync("codefoundry-dummy-password", 12)

export async function authorizeCredentials(credentials: Partial<Record<string, unknown>>) {
  // Aplicado aquí para cubrir también solicitudes directas a Auth.js.
  if (!await consumeRateLimit("login:global", 100, 60)) return null
  const email = normalizeEmail(credentials.email)
  const password = credentials.password
  if (!validEmail(email) || typeof password !== "string" || !password || !validPasswordLength(password)) return null
  if (!await consumeRateLimit(rateLimitKey("login:email", email), 10, 15 * 60)) return null

  const user = await prisma.user.findUnique({ where: { email } })
  const matches = await bcrypt.compare(password, user?.passwordHash ?? dummyHash)
  if (!user?.isActive || !matches) return null
  return { id: user.id, email: user.email, name: user.name }
}
