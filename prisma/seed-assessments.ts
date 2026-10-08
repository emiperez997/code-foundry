import "dotenv/config"
import { readFileSync } from "node:fs"
import { prisma } from "../lib/prisma"
import { syncAssessmentDefinitions, type Definition } from "../lib/evaluation/seed"

const content = JSON.parse(readFileSync("content/assessments/real-world-auth.json", "utf8")) as { courseSlug: string; assignments: Definition[] }
syncAssessmentDefinitions(content).then(() => console.log(`${content.assignments.length} entregas versionadas sincronizadas.`)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falló el seed de entregas.")
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
