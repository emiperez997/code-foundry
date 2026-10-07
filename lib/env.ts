export function environmentErrors(env: Record<string, string | undefined>): string[] {
  const errors: string[] = []
  const databaseUrl = env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    errors.push("DATABASE_URL: falta la conexión a PostgreSQL.")
  } else {
    try {
      const url = new URL(databaseUrl)
      if (!["postgresql:", "postgres:"].includes(url.protocol) || !url.hostname || url.pathname.length <= 1) {
        errors.push("DATABASE_URL: debe ser una URL de PostgreSQL con host y nombre de base.")
      }
    } catch {
      errors.push("DATABASE_URL: el formato de la URL no es válido.")
    }
  }

  if ((env.AUTH_SECRET?.trim().length ?? 0) < 32) {
    errors.push("AUTH_SECRET: se requiere un secreto de al menos 32 caracteres.")
  }
  return errors
}
