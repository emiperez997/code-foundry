export function textField(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === "string" ? value : ""
}

export function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
}

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export function validEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// bcrypt admite como máximo 72 bytes; no aceptar contraseñas que se truncarían.
export function validPasswordLength(password: string): boolean {
  return new TextEncoder().encode(password).length <= 72
}

export function positiveOrder(value: unknown): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null
  const order = Number(value)
  return Number.isSafeInteger(order) && order <= 2147483647 ? order : null
}

export function validSlug(slug: string): boolean {
  return slug.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function safeCallbackPath(value: unknown): string {
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || hasControlCharacters(value)) return "/courses"
  try {
    const url = new URL(value, "https://codefoundry.invalid")
    if (url.origin !== "https://codefoundry.invalid" || /%2f|%5c|%25|%0[0-9a-f]|%1[0-9a-f]|%7f/i.test(url.pathname) || ["/login", "/register"].includes(decodeURIComponent(url.pathname).replace(/\/+$/, ""))) return "/courses"
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return "/courses"
  }
}
