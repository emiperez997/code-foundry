import "dotenv/config"
import { bootstrapAdmin } from "../lib/evaluation/workflow"
import { prisma } from "../lib/prisma"
import { WorkflowError } from "../lib/evaluation/rubric"

const args = process.argv.slice(2)
const email = args.length === 2 && args[0] === "--email" ? args[1] : ""
bootstrapAdmin(email)
  .then(() => console.log("Administrador habilitado. Iniciá sesión con la cuenta registrada."))
  .catch((error: unknown) => { console.error(error instanceof WorkflowError ? error.message : "No se pudo habilitar el administrador."); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
