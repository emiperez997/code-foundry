import "dotenv/config"
import { randomUUID } from "node:crypto"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { Client } from "pg"

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Configurá DATABASE_URL para crear una base temporal de pruebas.")
  const databaseName = `codefoundry_test_${randomUUID().replaceAll("-", "")}`
  if (!/^codefoundry_test_[a-f0-9]{32}$/.test(databaseName)) throw new Error("Nombre de base temporal inválido.")
  const admin = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 })
  await admin.connect()
  let created = false
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`)
    created = true
    const url = new URL(process.env.DATABASE_URL)
    url.pathname = `/${databaseName}`
    const env = { ...process.env, DATABASE_URL: url.href, RUN_DB_TESTS: "1" }
    execFileSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], { env, stdio: "inherit" })
    execFileSync(process.execPath, [resolve("node_modules/vitest/vitest.mjs"), "run", "lib/auth/access.integration.test.ts", "lib/evaluation/workflow.integration.test.ts"], { env, stdio: "inherit" })
  } finally {
    try {
      if (created) await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`)
    } finally {
      await admin.end()
    }
  }
}

main().catch(() => { console.error("Falló la preparación o la ejecución de las pruebas de base de datos. Se requiere permiso para crear bases temporales."); process.exitCode = 1 })
