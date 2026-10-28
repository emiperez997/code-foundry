import { randomInt } from "node:crypto"

// 31 símbolos sin ambiguos (sin 0, 1, I, L, O). 16 símbolos ≈ 79 bits de entropía.
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
const GROUPS = 4
const GROUP_SIZE = 4
export const CODE_PATTERN = /^CF-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/

/** Genera un código CF-XXXX-XXXX-XXXX-XXXX con CSPRNG (randomInt no tiene sesgo de módulo). */
export function generateCertificateCode(): string {
  const groups = Array.from({ length: GROUPS }, () =>
    Array.from({ length: GROUP_SIZE }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join(""),
  )
  return `CF-${groups.join("-")}`
}

/** Normaliza lo que escribe una persona (minúsculas, espacios) y devuelve null si el formato no es válido. */
export function parseCertificateCode(input: string): string | null {
  if (typeof input !== "string" || input.length > 64) return null
  const code = input.trim().toUpperCase()
  return CODE_PATTERN.test(code) ? code : null
}
