import "dotenv/config"
import { prisma } from "../lib/prisma"

prisma.$executeRaw`DELETE FROM auth_rate_limits WHERE expires_at <= CURRENT_TIMESTAMP`
  .then((count) => console.log(`${count} ventanas de autenticación vencidas eliminadas.`))
  .catch(() => { console.error("No se pudieron limpiar los límites vencidos."); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
