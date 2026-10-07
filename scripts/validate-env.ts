import "dotenv/config"
import { environmentErrors } from "../lib/env"

const errors = environmentErrors(process.env)
if (errors.length > 0) {
  console.error("Configuración de entorno inválida:")
  for (const error of errors) console.error(`  ${error}`)
  console.error("Ejecutá pnpm setup:env y verificá la configuración de .env.")
  process.exitCode = 1
} else {
  console.log("Variables de entorno válidas.")
}
