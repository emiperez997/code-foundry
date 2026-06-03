/**
 * scripts/validate-env.ts
 *
 * Validates that all required environment variables are defined before
 * the application starts. Exits with code 1 and a clear message if any
 * are missing, so misconfigured deployments fail loudly at boot time
 * rather than silently at runtime.
 *
 * Run via:  pnpm exec tsx scripts/validate-env.ts
 * Or import at the top of next.config.ts for build-time validation.
 */

import "dotenv/config"

const REQUIRED_VARS: { name: string; description: string }[] = [
  {
    name: "DATABASE_URL",
    description: "PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/db)",
  },
  {
    name: "AUTH_SECRET",
    description: "Secret used by Auth.js to sign session tokens (min 32 chars recommended)",
  },
]

function validateEnv(): void {
  const missing = REQUIRED_VARS.filter(
    ({ name }) => !process.env[name]?.trim(),
  )

  if (missing.length === 0) {
    console.log("✓ All required environment variables are set.\n")
    return
  }

  console.error("ERROR: Missing required environment variables:\n")

  for (const { name, description } of missing) {
    console.error(`  ${name}`)
    console.error(`    → ${description}\n`)
  }

  console.error(
    "Copy .env.example to .env and fill in the missing values.\n",
  )

  process.exit(1)
}

validateEnv()
