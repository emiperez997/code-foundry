import "dotenv/config"
import { prisma } from "../lib/prisma"
import { loadCourses } from "../lib/courses/courseLoader"

async function main() {
  const definitions = loadCourses()
  for (const definition of definitions) {
    const course = await prisma.course.findUnique({
      where: { slug: definition.slug },
      include: { modules: { include: { _count: { select: { progress: true } } } } },
    })
    const orders = new Set(definition.modules.map((module) => module.order))
    const removed = course?.modules.filter((module) => !orders.has(module.order)) ?? []
    console.log(`${definition.slug}: ${course?.modules.length ?? 0} módulos en DB / ${definition.modules.length} en contenido; ${removed.length} módulos a eliminar; ${removed.reduce((sum, module) => sum + module._count.progress, 0)} registros de progreso afectados.`)
  }
  console.log("Conexión y lectura de cursos verificadas. Esta comprobación no modifica datos.")
}

main().catch(() => {
  console.error("No se pudo verificar la base. Revisá conexión, migraciones y configuración.")
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
