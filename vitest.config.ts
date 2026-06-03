import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  test: {
    environment: "node",
    clearMocks: true,
    include: ["lib/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", ".agents/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
})
