/**
 * e2e/helpers/cleanup.ts
 *
 * Runs the standalone cleanup script (seed.ts) from Playwright specs.
 * Prisma runs under tsx in a child process so Playwright does not
 * transform the generated client (ESM/CJS conflict).
 */

import { execFileSync } from "node:child_process"
import { resolve } from "node:path"

export function cleanupTestUsers(): void {
  execFileSync(
    process.execPath,
    ["--import", "tsx", resolve("e2e/helpers/seed.ts")],
    { env: process.env, stdio: "inherit" },
  )
}
