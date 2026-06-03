/**
 * e2e/auth.spec.ts
 *
 * Tests for registration, login, and route protection.
 */

import { test, expect } from "@playwright/test"
import { createTestUser, registerUser, loginUser, registerAndLogin } from "./helpers/auth"

test.describe("Authentication", () => {
  let user: ReturnType<typeof createTestUser>

  test.beforeEach(() => {
    user = createTestUser()
  })

  test("user can register and is redirected to login", async ({ page }) => {
    await registerUser(page, user)

    await expect(page).toHaveURL(/\/login/)
  })

  test("user can log in after registering", async ({ page }) => {
    await registerAndLogin(page, user)

    await expect(page).toHaveURL("/")
  })

  test("shows error on login with wrong password", async ({ page }) => {
    await registerUser(page, user)
    await page.waitForURL(/\/login/)

    await loginUser(page, { ...user, password: "wrongpassword" })

    await expect(
      page.getByText(/credenciales incorrectas|error/i),
    ).toBeVisible()
  })

  test("unauthenticated user is redirected to login when accessing a module", async ({
    page,
  }) => {
    await page.goto("/courses/real-world-auth/modules/1")

    await expect(page).toHaveURL(/\/login/)
  })

  test("navbar shows Dashboard link after login", async ({ page }) => {
    await registerAndLogin(page, user)

    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible()
  })
})
