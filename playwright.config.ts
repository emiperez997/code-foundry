import { defineConfig, devices } from "@playwright/test"

const port = Number(process.env.E2E_PORT ?? 3100)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("E2E_PORT inválido")
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  timeout: 30000,

  use: {
    baseURL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: process.env.CI ? `pnpm build && pnpm start --port ${port}` : `pnpm dev --port ${port}`,
    url: baseURL,
    env: { AUTH_URL: baseURL },
    reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
    timeout: 120000,
  },
})
