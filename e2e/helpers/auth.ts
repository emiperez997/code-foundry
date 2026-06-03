/**
 * e2e/helpers/auth.ts
 *
 * Helpers for registering and logging in a test user via the UI.
 * Selectors are based on the Label text defined in register-form.tsx
 * and login-form.tsx.
 */

import { type Page } from "@playwright/test"

export interface TestUser {
  name: string
  email: string
  password: string
}

export function createTestUser(): TestUser {
  return {
    name: "E2E Test User",
    email: `e2e-${Date.now()}@test.com`,
    password: "testpassword123",
  }
}

export async function registerUser(page: Page, user: TestUser): Promise<void> {
  await page.goto("/register")
  await page.getByLabel("Nombre").fill(user.name)
  await page.getByLabel("Email").fill(user.email)
  await page.getByLabel("Contraseña").fill(user.password)
  await page.getByRole("button", { name: "Crear cuenta" }).click()
}

export async function loginUser(page: Page, user: TestUser): Promise<void> {
  await page.goto("/login")
  await page.getByLabel("Email").fill(user.email)
  await page.getByLabel("Contraseña").fill(user.password)
  await page.getByRole("button", { name: "Entrar" }).click()
}

export async function registerAndLogin(
  page: Page,
  user: TestUser,
): Promise<void> {
  await registerUser(page, user)
  await page.waitForURL(/\/login/)
  await loginUser(page, user)
  await page.waitForURL(/\/$/)
}
