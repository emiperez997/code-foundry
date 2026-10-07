import { createHash } from "node:crypto"
import { prisma } from "@/lib/prisma"

export function rateLimitKey(namespace: string, identity: string): string {
  return `${namespace}:${createHash("sha256").update(identity).digest("hex")}`
}

// Ventana fija compartida entre procesos. El UPSERT es atómico también con solicitudes concurrentes.
export async function consumeRateLimit(key: string, limit: number, seconds: number): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO auth_rate_limits (key, count, expires_at)
    VALUES (${key}, 1, CURRENT_TIMESTAMP + make_interval(secs => ${seconds}::int))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN auth_rate_limits.expires_at <= CURRENT_TIMESTAMP THEN 1
        ELSE LEAST(auth_rate_limits.count + 1, ${limit + 1}::int) END,
      expires_at = CASE WHEN auth_rate_limits.expires_at <= CURRENT_TIMESTAMP
        THEN CURRENT_TIMESTAMP + make_interval(secs => ${seconds}::int)
        ELSE auth_rate_limits.expires_at END
    RETURNING count
  `
  return rows.length === 1 && rows[0].count <= limit
}
